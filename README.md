# easy-nrm

[![NPM version][npm-image]][npm-url]
[![NPM][nodei-image]][nodei-url]

> `easy-nrm` is an easy way to install packages by different npm registries using nrm.



## install

Install with [npm](https://www.npmjs.com/);

```sh
$ npm install -g easy-nrm 
```



## Usage

At the root of project, create the file`easy-nrm.config.json`.

```json
{
  "my-npm": ["pkg1"],
  "my-npm -D": ["pkg2@0.1.0"],
  "my-npm2": ["pkg3"],
  "npm": ["pkg4"]
}
```

If you want to install some packages when you in dev mode, you should add `-D` or `--save-dev` at the end of register name.

```json
{
  "my-npm": ["pkg1"],
  "my-npm --save-dev": ["pkg2", "pkg3"],
  "my-npm-2": ["pkg4"],
  "my-npm-2 -D": ["pkg5"]
}
```



If you want to install a specified version of a package, add `@<version>` at the end of the package name.

```json
{
  "my-npm": ["pkg1@1.0.1", "pkg2"]
}
```



```
Usage: easy-nrm [options] [command]

Options:
  -v, --version   output the current version
  -h, --help      display help for command

Commands:
  install|i       install all the packages
  help [command]  display help for command
  
```



## Related Projects

* [verdaccio--A lightweight private npm proxy registry](https://verdaccio.org/)
* [nrm -- NPM registry manager](https://www.npmjs.com/package/nrm)



## LICENSE

MIT

[npm-image]: https://img.shields.io/npm/v/easy-nrm.svg?style=flat
[npm-url]: https://www.npmjs.com/package/easy-nrm
[nodei-image]: https://nodei.co/npm/easy-nrm.png?downloads=true&downloadRank=true&stars=true
[nodei-url]: https://www.npmjs.com/package/easy-nrm
