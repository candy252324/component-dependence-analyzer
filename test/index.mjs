import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __filenameNew = fileURLToPath(import.meta.url)
const __dirnameNew = path.dirname(__filenameNew)

import { getRelyTree } from '../src/relyAnalysis.mjs'

console.log(path.resolve(__dirnameNew, './example'))

// 由于 __dirname 是 commonjs 规范的内置变量，这里无法使用，所以新写了个 __dirnameNew
const result = getRelyTree(path.resolve(__dirnameNew, './example'), '@:./src;@components:./src/components')

// 将分析结果输出到 /test/example 目录下
const outputPath = path.resolve(__dirnameNew, 'result.json')
fs.writeFile(outputPath, JSON.stringify(result), err => {
  if (!err) {
    console.warn('依赖分析结束，输出目录：', outputPath)
  }
})
