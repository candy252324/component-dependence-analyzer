'use strict';

var fs = require('fs');
var path = require('path');
var sfcParser = require('@vue/compiler-sfc');
var ts = require('typescript');
var http = require('http');

/** 转化为小驼峰
 *  A-bcd-e 转化为 aBcdE
 */
function toLowerCamelCase(str) {
  // 将连字符及其后面的字母转化为大写字母
  var re = /-(\w)/g;
  str = str.replace(re, function ($0, $1) {
    return $1.toUpperCase();
  });
  // 首字母小写
  str = str.charAt(0).toLowerCase() + str.slice(1);
  return str;
}

/** 主函数 */
function getRelyTree(absPath, fileTree = []) {
  fs.readdirSync(absPath).forEach((file) => {
    const pathName = path.join(absPath, file);
    const fileObj = { fileName: pathName, relyonComp: [] };
    // 如果是文件夹
    if (fs.statSync(pathName).isDirectory()) {
      getRelyTree(pathName, fileTree);
    } else {
      // 只处理 .vue 文件
      if (path.extname(file) === ".vue") {
        fileObj.relyonComp = getRelyComp(pathName);
        fileTree.push(fileObj);
      }
    }
  });
  return fileTree;
}

/** 获取某个文件依赖的子组件 */
function getRelyComp(filePath) {
  const fileData = fs.readFileSync(filePath, "utf-8");
  const res = sfcParser.parse(fileData);

  //sfcParser 的解析产物中已经有 template 的 ast 结果了
  const templateAst = res.descriptor.template.ast;
  // script 部分的 ast 需要自己去解析
  const scriptAst = ts.createSourceFile(
    "",
    res.descriptor.script.content,
    ts.ScriptTarget.ES6,
    false
  );

  // 获取 template 中使用了的所有标签，["div", "elInput", "footerComp"];
  const templateRely = getTemplateRely(templateAst);
  // 获取 script 引入了的依赖  [{compName:"footerComp",filePath:"xx/xxx.vue"}]
  const scriptRely = getScriptRely(scriptAst);
  // 必须是 script 中引入了且 template 中使用了的才算是真正的依赖
  const realRely = scriptRely.filter((item) => {
    return templateRely.includes(item.compName);
  });
  return realRely.map((item) => {
    return {
      fileName: item.filePath,
    };
  });
}

/** 拿到 template 中使用的所有标签（包括原生标签，三方组件如 ant-,el-等）
 * 输出格式 ["div","elInput","footerComp"]
 */
function getTemplateRely(ast, result = []) {
  if (ast.type === 1) {
    const tagName = toLowerCamelCase(ast.tag);
    result.push(tagName);
  }
  if (ast.children) {
    ast.children.forEach((item) => {
      getTemplateRely(item, result);
    });
  }
  return Array.from(new Set(result));
}

/** 拿到 script 中通过 import 方式引入的依赖 */
function getScriptRely(ast) {
  let rely = [];
  ast.statements.forEach((item) => {
    // 如：import footerComp from "./xxx/xxx/footer";
    if (item.importClause && item.importClause.name && item.moduleSpecifier) {
      const compName = item.importClause.name.escapedText; // 组件名称 "footerComp"
      const filePath = item.moduleSpecifier.text; //组件路径  "./xxx/xxx/footer"
      rely.push({
        compName: toLowerCamelCase(compName),
        filePath, // cjh todo,别名匹配
      });
    }
  });
  return rely;
}

function openBrowser(result) {
  const data = typeof result === "string" ? result : JSON.stringify(result);
  createServer(data);
}
function createServer(data) {
  const server = http.createServer();
  server.on("request", (req, res) => {
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.write(data);
    res.end();
  });
  server.listen(3345, () => {
    console.log("服务启动成功，浏览器访问：", "http://localhost:3345/");
  });
  server.on("error", (err) => {
    // 端口被占用，(这里判断比较简单，如果端口被占用，则认为已经启动了服务器，不考虑是其它程序占用端口的情况)
    if (err.code === "EADDRINUSE") {
      console.log("http://localhost:3345/");
    }
  });
}

var index = {
  getRelyTree,
  openBrowser,
};

module.exports = index;
