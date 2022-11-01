#! /usr/bin/env node
const fs = require('fs')
const program = require('commander')
const packageJson = require('../package.json')
const getRelyTree = require('../dist/bundle.js').getRelyTree
const openBrowser = require('../dist/bundle.js').openBrowser

// 配置版本号，执行 rely --version 将会看到版本号输出
program.version(packageJson.version)
// 需要的参数
program
  .option('-p --path  <pathname>', '需要分析的项目路径', '')
  .option('-a --alias <alias>', '路径别名', '')
  .option('-o --open', '打开浏览器', false)

// 自定义help信息
program.helpInformation = () => {
  return `
    -V, --version          输出版本号
    -p, --path             需要分析的项目路径
    -a, --alias            路径别名
    -o, --open             打开浏览器 (default: false)
    -h, --help             输出帮助信息
  `
}
// 解析commanderline arguments
program.parse(process.argv)

const options = program.opts() //获取配置参数对象
console.log(options)
let entryPath = options.path
let aliasObj = {} // {"@":"./src","@utils":"./src/utils"}

// 用户是否传入路径，rely --path "xxx/xxx"
if (!options.path) {
  entryPath = process.cwd()
  console.warn(`未传入路径，默认使用当前路径 ${entryPath} 进行分析`)
}

const result = getRelyTree(entryPath)
if (!result.length) {
  console.log('无数据')
} else {
  // 如果需要打开浏览器
  if (options.open) {
    openBrowser(result)
  } else {
    console.log(result)
  }
}
