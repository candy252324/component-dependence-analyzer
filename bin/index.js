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
  .option('-p --projectDir  <projectDir>', '需要分析的项目路径', '')
  .option('-f --filePath  <filePath>', '组件绝对路径', '')
  .option('-a --alias <alias>', '路径别名', '')
  .option('-o --open', '打开浏览器', false)

// 自定义help信息
program.helpInformation = () => {
  return `
    -V, --version          输出版本号
    -p, --projectDir       需要分析的项目路径
    -f, --filePath         组件绝对路径
    -a, --alias            路径别名(即webpack中配置的alias)
    -o, --open             打开浏览器 (default: false)
    -h, --help             输出帮助信息
  `
}
// 解析commanderline arguments
program.parse(process.argv)

const options = program.opts() //获取配置参数对象

start()

function start() {
  const result = getRelyTree(options.projectDir, options.filePath, options.alias)
  if (Object.prototype.toString.call(result) !== '[object Array]') return
  if (!result.length) {
    console.log('没有任何组件依赖该组件')
  } else {
    // 如果需要打开浏览器
    if (options.open) {
      openBrowser(result)
    } else {
      console.log(result)
    }
  }
}
