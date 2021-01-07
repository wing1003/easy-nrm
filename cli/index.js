#!/usr/bin/env node

'use strict';

const commander = require('commander');
const spawn = require('cross-spawn');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ini = require('ini');
const npm = require('npm');
const extend = require('extend');

const packageJson = require('../package.json');
const paths = require('../paths');
const { unique } = require('../util');

const GLOBAL_NPM_PATH = {
  'Darwin': '/lib/node_modules', // mac
  'Windows_NT': '/node_modules', // windows
  'Linux': '/node_modules' // linux
};
const registries = require('../registries.json');
const NRMRC = path.join(process.env.HOME, '.nrmrc');
const configJson = require(paths.configJson);
const appPackageJson = require(paths.appPackageJson);
const FIELD_REGISTRY = 'registry';
const FIELD_NRM = 'nrm';
const FIELD_NPM = 'npm';
const REG_DEV = /(\s-D|\s--save-dev)$/;
const configJsonDeps = [];

function getGlobalNpmPath() {
  const type = os.type();
  const npmPath = GLOBAL_NPM_PATH[type];
  if (npmPath) {
    return npmPath;
  } else {
    console.error(
        chalk.red(
            'You cannot install easy-nrm in %s operating system that is not supported.'
        ),
        type,
    );
  }
}

function checkGlobalPackageExisted(name) {
  const node_prefix = process.config.variables.node_prefix;
  const globalPackages = fs.readdirSync(path.join(node_prefix, getGlobalNpmPath()));
  return globalPackages.findIndex(packageName => packageName === name) !== -1;
}

function install(packageName, dependencies) {
  return new Promise((resolve, reject) => {
    const isDev = REG_DEV.test(packageName) ? '--save-dev' : '--save';
    const args = [
      'install',
      isDev,
      '--save-exact',
      '--loglevel',
      'error',
    ].concat(dependencies);

    const child = spawn(FIELD_NPM, args, { stdio: 'inherit' });
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${FIELD_NPM} ${args.join(' ')}`,
        });
        return;
      }
      resolve(true);
    });
  });
}

function checkPackageName(PackageConfig) {
  let dependencies = [];
  for (const [lib, packageName] of Object.entries(PackageConfig)) {
    dependencies = dependencies.concat(packageName);
  }
  const { result, hash } = unique(dependencies);
  if (result.length !== dependencies.length) {
    const repeatPackages = [];
    for (const [packageName, times] of Object.entries(hash)) {
      if (times !== 1) repeatPackages.push(packageName);
    }

    if (repeatPackages.length) {
      console.error(
          chalk.red(
              `Cannot install these dependencies ${chalk.green(
                  `"${repeatPackages.join()}"`
              )} with the same name exists.\n`
          )
      );
    }
    return repeatPackages;
  } else {
    return [];
  }
}

function changeRegister(registerName) {
  const allRegistry = getAllRegistry();
  if (REG_DEV.test(registerName)) {
    registerName = registerName.replace(REG_DEV, '');
  }
  if (!allRegistry[registerName]) {
    console.error(
        chalk.red(
            `Please make sure the ${chalk.green(
                `"${registerName}"`
            )} has been registered in nrm.\n`
        )
    );
    return false;
  }
  return new Promise((resolve, reject) => {
    const child = spawn(FIELD_NRM, ['use', registerName], { stdio: 'inherit' });
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${FIELD_NRM} use ${registerName}`
        });
      }
      resolve(registerName);
    });
  });
}

function getINIInfo (path) {
  return fs.existsSync(path) ? ini.parse(fs.readFileSync(path, 'utf-8')) : {};
}

function getCustomRegistry () {
  return getINIInfo(NRMRC)
}

function getAllRegistry () {
  const custom = getCustomRegistry();
  const all = extend({}, registries, custom);
  for (let name in registries) {
    if (name in custom && registries.hasOwnProperty(name)) {
      all[name] = extend({}, custom[name], registries[name]);
    }
  }
  return all;
}

function getCurrentRegistry (callback) {
  npm.load((err, conf) => {
    if (err) return npm.exit(err);
    callback(npm.config.get(FIELD_REGISTRY));
  });
}

function getCurrentRegistryName(currentRegistry) {
  const allRegistries = getAllRegistry();
  return Object.keys(allRegistries).filter((name) => {
    const item = allRegistries[name];
    return item[FIELD_REGISTRY] === currentRegistry;
  })[0];
}

function checkRestAppDependencies() {
  const allDep = Object.keys(appPackageJson.dependencies)
      .concat(Object.keys(appPackageJson.devDependencies));
  return allDep === configJsonDeps;
}

(function init() {
  const program = new commander.Command(packageJson.name);

  program.version(packageJson.version, '-v, --version', 'output the current version');

  program.command('install')
      .alias('i')
      .description('install all the packages')
      .action(() => {
        if (!checkGlobalPackageExisted(FIELD_NRM)) {
          console.log(
              chalk.red(
                  `Please make sure the ${FIELD_NRM} has been installed.`
              )
          )
        }

        if (checkPackageName(configJson).length) return;

        getCurrentRegistry((currentRegistryUrl) => {
          const name = getCurrentRegistryName(currentRegistryUrl);

          if (configJson[name] ||
              `${configJson[name]} -D` ||
              `${configJson[name]} --save-dev`
          ) {
            const composePromise = function(pkgList) {
              const promiseArray = [];
              for (let i = 0, length = pkgList.length; i < length; i++) {
                let name = pkgList[i];
                configJsonDeps.concat(configJson[name]);
                promiseArray.push(
                    () => changeRegister(name),
                    () => install(name, configJson[name])
                );
              }
              return promiseArray;
            }
            const promiseArray = composePromise(Object.keys(configJson));
            if (!checkRestAppDependencies()) {
              Object.keys(configJson).forEach(pkg => {
                configJson[pkg].forEach(depName => {
                  if (appPackageJson.devDependencies[depName]) {
                    delete appPackageJson.devDependencies[depName]
                  }
                  delete appPackageJson.dependencies[depName];
                })
              });

              promiseArray.push(() => changeRegister(FIELD_NPM));
              if (Object.keys(appPackageJson.devDependencies).length) {
                promiseArray.push(
                    () => install(`${FIELD_NPM} -D`, Object.keys(appPackageJson.devDependencies))
                )
              }
              if (Object.keys(appPackageJson.dependencies).length) {
                promiseArray.push(
                    () => install(FIELD_NPM, Object.keys(appPackageJson.dependencies))
                )
              }
            }
            promiseArray.reduce((promise, next) => {
              return promise.then(value => next(value));
            }, Promise.resolve())
                .then(success => {
                  if (success) {
                    console.log(
                        chalk.green(
                            `All the packages have been installed.`
                        )
                    )
                  }
                })
                .catch(error => {
                  console.log(
                      chalk.red(
                          `Error Command: ${error.command}`
                      )
                  )
                });
          } else {
            console.log(
                chalk.red(
                    `The ${chalk.green(`${name}`)} doesn't in easy-nrm.config.json`
                )
            )
          }
        });
      });

  program.parse(process.argv);
})();
