'use strict';

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
const configJson = resolveApp('./easy-nrm.config.json');

try {
  fs.statSync(configJson);
} catch (e) {
  console.log(
      chalk.red(
          `Warning: The easy-nrm.config.json is needed!`
      )
  )
  process.exit(0)
}

module.exports = {
  appPackageJson: resolveApp('package.json'),
  configJson,
};