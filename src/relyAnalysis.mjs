import fs from 'fs'
import path from 'path'
import sfcParser from '@vue/compiler-sfc'
import ts from 'typescript'
import {
  validateFilePath,
  getEntryPath,
  getAliasObj,
  getAliasPath,
  toLowerCamelCase,
  consoleSplitLine,
} from './utils.mjs'

let entryPath = '' // 项目目录（绝对路径）
let aliasObj = '' // 别名映射关系
const excludeFile = ['.git', 'node_modules']

export function getRelyTree(projectDir, filePath, aliasStr) {
  if (!validateFilePath(filePath)) return
  entryPath = getEntryPath(projectDir)
  aliasObj = getAliasObj(aliasStr)

  consoleSplitLine('项目目录', entryPath)
  consoleSplitLine('组件路径', filePath)
  consoleSplitLine('别名映射关系', aliasObj)

  const traverseRes = loop(entryPath)
  const fianlResult = getRelyResult(filePath, traverseRes)

  consoleSplitLine('解析结果', fianlResult)
  return fianlResult
}

/** 遍历项目目录，拿到每个vue文件的依赖
 * [{
 *  fileName:"E:/projectDir/main.vue",
 *  relyonComp:[{
 *    fileName:"E:/projectDir/components/footer.vue",
 *  }]
 * }]
 */
function loop(absPath, fileTree = []) {
  const res = fs.readdirSync(absPath).forEach(file => {
    const pathName = path.join(absPath, file)
    const fileObj = { fileName: pathName, relyonComp: [] }
    // 如果是文件夹
    if (fs.statSync(pathName).isDirectory() && !excludeFile.includes(file)) {
      loop(pathName, fileTree)
    } else {
      // 只处理 .vue 文件
      if (path.extname(file) === '.vue') {
        try {
          fileObj.relyonComp = getRelyComp(absPath, file)
          fileTree.push(fileObj)
        } catch (error) {
          console.log(`!!!!文件解析出错,解析出错的文件路径：${pathName}`)
          console.log(error)
        }
      }
    }
  })
  return fileTree
}

/** 获取某个文件依赖的子组件 */
function getRelyComp(absPath, file) {
  const filePath = path.join(absPath, file)
  const fileData = fs.readFileSync(filePath, 'utf-8')
  const res = sfcParser.parse(fileData)
  const descriptor = res.descriptor
  if (!descriptor.template || !descriptor.script) {
    return []
  }
  //sfcParser 的解析产物中已经有 template 的 ast 结果了
  const templateAst = res.descriptor.template.ast
  // script 部分的 ast 需要自己去解析
  const scriptAst = ts.createSourceFile('', res.descriptor.script.content, ts.ScriptTarget.ES6, false)

  // 获取 template 中使用了的所有标签，["div", "elInput", "footerComp"];
  const templateRely = getTemplateRely(templateAst)
  // 获取 script 引入了的依赖  [{compName:"footerComp",filePath:"xx/xxx.vue"}]
  const scriptRely = getScriptRely(absPath, scriptAst)
  // 必须是 script 中引入了且 template 中使用了的才算是真正的依赖
  const realRely = scriptRely.filter(item => {
    return templateRely.includes(item.compName)
  })
  return realRely.map(item => {
    return {
      fileName: item.filePath,
    }
  })
}

/** 拿到 template 中使用的所有标签（包括原生标签，三方组件如 ant-,el-等）
 * 输出格式 ["div","elInput","footerComp"]
 */
function getTemplateRely(ast, result = []) {
  if (ast.type === 1) {
    const tagName = toLowerCamelCase(ast.tag)
    result.push(tagName)
  }
  if (ast.children) {
    ast.children.forEach(item => {
      getTemplateRely(item, result)
    })
  }
  return Array.from(new Set(result))
}

/**
 * 拿到 script 中通过 import 方式引入的所有依赖
 * @param absFileDir 当前解析文件所在目录（绝对路径）
 */
function getScriptRely(absFileDir, ast) {
  let rely = []
  ast.statements.forEach(item => {
    if (item.importClause && item.importClause.name && item.moduleSpecifier) {
      const compName = item.importClause.name.escapedText // 组件名称 "footerComp"
      const compPath = item.moduleSpecifier.text //组件路径  "./xxx/xxx/footer"
      rely.push({
        compName: toLowerCamelCase(compName),
        filePath: getAliasPath(absFileDir, compPath, entryPath, aliasObj),
      })
    }
  })
  return rely
}

/**
 * 计算组件依赖关系
 * @param {string} filePath 组件绝对路径
 * @param {*} traverseRes 所有的依赖关系
 */
function getRelyResult(filePath, traverseRes) {
  return []
}
