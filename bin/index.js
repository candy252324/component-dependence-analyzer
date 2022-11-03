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
  .option('-p --projectDir  <projectDir>', '需要分析的项目目录', '')
  .option('-f --filePath  <filePath>', '组件绝对路径', '')
  .option('-a --alias <alias>', '路径别名', '')
  .option('-e --extensions <extensions>', '解析顺序', '')
  .option('-o --open', '打开浏览器', false)

// 自定义help信息
program.helpInformation = () => {
  return `
    参数                 是否必须      参数含义
    ----------------------------------------------------------
    -V, --version           no         输出版本号
    -p, --projectDir        no         需要分析的项目目录(默认当前路径)
    -f, --filePath          yes        组件绝对路径
    -a, --alias             no         路径别名(对应webpack中配置的resolve.alias)
    -e, --extensions        no         解析顺序(对应webpack中配置的resolve.extensions)
    -o, --open              no         打开浏览器 (default: false)
    -h, --help              no         输出帮助信息
  `
}
// 解析commanderline arguments
program.parse(process.argv)

const options = program.opts() //获取配置参数对象

start()

function start() {
  const result = getRelyTree(options)
  if (Object.prototype.toString.call(result) !== '[object Array]') return
  if (!result.length) {
    console.log('没有任何组件依赖该组件')
  } else {
    // 如果需要打开浏览器
    if (options.open) {
      openBrowser(result)
    } else {
      console.log('解析结果')
      console.log(result)
    }
  }
}
