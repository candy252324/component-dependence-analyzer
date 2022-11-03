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
    return $1.toUpperCase()
  });
  // 首字母小写
  str = str.charAt(0).toLowerCase() + str.slice(1);
  return str
}

/**
 * 获取解析目录，如果用户没传，则使用当前目录作为解析路径
 * @param {string} projectDir 参数上的路径字符串，rely --projectDir "xxx/xxx"
 */
function getEntryPath(projectDir) {
  let entryPath = projectDir;
  if (!projectDir) {
    entryPath = process.cwd();
  }
  return entryPath
}

/**
 * 获取别名映射关系
 * @param {string} aliasStr 参数上的别名字符串， "@:./src;@components:./src/components"
 * @returns
 */
function getAliasObj(aliasStr) {
  if (aliasStr) {
    try {
      let aliasObj = {}; // {"@":"src","@components":"./src/components"}
      const aliasArr = aliasStr.split(';'); // ["@:./src","@components:./src/components"]
      for (let i = 0; i < aliasArr.length; i++) {
        const item = aliasArr[i].trim();
        if (item) {
          if (item.indexOf(':') === -1) {
            const errMes = "--alias 参数格式错误，参考格式：rely --alias '@:./src;@components:./src/components'";
            throw new Error(errMes)
            return
          }
          const key = item.split(':')[0].trim();
          const value = item.split(':')[1].trim();
          aliasObj[key] = value;
        }
      }
      return aliasObj
    } catch (error) {
      throw new Error(error)
    }
  } else {
    return ''
  }
}

/**
 * 给没有后缀的添加后缀
 * @param {*} filePath  绝对路径
 * @param {*} extensionsStr  ".ts, .tsx, .js, .jsx, .vue, .json"
 */
function setExtensions(filePath, extensionsStr) {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  // 如果有后缀
  if (ext.startsWith('.') && ext.length > 1 && ext.indexOf('/') === -1) {
    return filePath
  } else {
    const extensionsArr = extensionsStr.split(',');
    let hasMatch = false;
    for (let i = 0; i < extensionsArr.length; i++) {
      const newFilePath = filePath + extensionsArr[i].trim();
      try {
        const statsObj = fs.statSync(newFilePath);
        // 存在该后缀的文件
        if (statsObj.isFile()) {
          hasMatch = true;
          return newFilePath
        }
      } catch (error) {}
    }
    if (!hasMatch) {
      return filePath
    }
  }
}

/**
 * 获取引用组件的绝对路径
 * 如相对路径：import footerComp from "./xxx/xxx/footer";
 * 如路径别名：import footerComp from "@components/footer.vue";
 * @param {string} absFileDir 当前解析文件所在目录（绝对路径） "E:/projectName/src/main"
 * @param {string} compPath 组件中import语句中的路径 "@components/footer.vue"
 * @param {string} entryPath  解析目录（绝对路径） "E:/projectName"
 * @param {*} aliasObj {"@":"./src","@components":"./src/components"}
 */
function getAliasPath(absFileDir, compPath, entryPath, aliasObj) {
  // 如果没有配置别名
  if (!aliasObj) {
    return path.resolve(absFileDir, compPath)
  } else {
    try {
      const aliasKeysArr = Object.keys(aliasObj); // ["@","@components"]
      const aliasValuesArr = Object.values(aliasObj); // ["./src","./src/components"]
      const matchAliasIdx = aliasKeysArr.findIndex(item => compPath.startsWith(item));
      if (matchAliasIdx !== -1) {
        const aliasKey = aliasKeysArr[matchAliasIdx]; // "@components"
        const aliasValue = aliasValuesArr[matchAliasIdx]; // "./src/components"
        let absAliasPath = path.resolve(entryPath, aliasValue); // "E:/projectName/src/components"
        const s = './' + compPath.replace(aliasKey, ''); // "@components/footer.vue" 转化成 "./src/components/footer.vue"
        return path.resolve(absAliasPath, s)
      } else {
        return path.resolve(absFileDir, compPath)
      }
    } catch (error) {
      console.log('路径解析出错了！！！！！！！！！');
      console.log(error);
      throw new Error(error)
    }
  }
}

/**
 * 校验传入的组件路径格式是否正确
 * @param {string} filePath
 * @returns
 */
function validateFilePath(filePath) {
  let flag = false;
  if (!filePath) {
    console.log('--filePath 必须传入');
  } else {
    const statsObj = fs.statSync(filePath);
    if (statsObj.isDirectory()) {
      console.log('--filePath 参数传入错误');
    }
    // 必须是文件，且后缀是vue
    else if (statsObj.isFile() && path.extname(filePath) === '.vue') {
      flag = true;
    }
  }
  return flag
}
/**
 * 校验 --extensions 参数传的是否正确
 * 正确格式 ".jxs,.vue,.tsx"
 */
function validateExtensions(extensionsStr) {
  const extensionsArr = extensionsStr.split(',');
  // 必须以点开头
  const validate = extensionsArr.every(item => item.startsWith('.'));
  if (!validate) {
    console.log('--extensions 参数格式不正确');
  }
  return validate
}

/** 打印 */
function consoleSplitLine(key, value) {
  value = value ? value : '无';
  if (typeof value === 'string') {
    console.log(`---- ${key}: ${value}`);
  } else {
    console.log(`---- ${key}`);
    console.log(value);
  }
  console.log();
}

let entryPath = ''; // 项目目录（绝对路径）
let aliasObj = ''; // 别名映射关系
let extensionsStr = ''; // 解析顺序
const excludeFile = ['.git', 'node_modules'];

function getRelyTree(options) {
  const { projectDir, filePath, alias, extensions } = options;
  if (!validateFilePath(filePath)) return
  if (extensions && !validateExtensions(extensions)) return

  entryPath = getEntryPath(projectDir);
  aliasObj = getAliasObj(alias);

  consoleSplitLine('项目目录', entryPath);
  consoleSplitLine('组件路径', filePath);
  consoleSplitLine('别名映射关系', aliasObj);
  // --extensions 未传，使用默认解析顺序
  if (!extensions) {
    extensionsStr = '.ts,.tsx,.js,.jsx,.vue,.json';
    consoleSplitLine('--extensions参数未传，使用默认解析顺序', extensionsStr);
  } else {
    extensionsStr = extensions;
    consoleSplitLine('解析顺序', extensionsStr);
  }

  const rawRely = loop(entryPath);
  const fianlResult = getRelyResult(rawRely, [{ fileName: filePath }]);
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
  fs.readdirSync(absPath).forEach(file => {
    const pathName = path.join(absPath, file);
    const fileObj = { fileName: pathName, relyonComp: [] };
    // 如果是文件夹
    if (fs.statSync(pathName).isDirectory() && !excludeFile.includes(file)) {
      loop(pathName, fileTree);
    } else {
      // 只处理 .vue 文件
      if (path.extname(file) === '.vue') {
        try {
          fileObj.relyonComp = getRelyComp(absPath, file);
          fileTree.push(fileObj);
        } catch (error) {
          console.log(`!!!!文件解析出错,解析出错的文件路径：${pathName}`);
          console.log(error);
        }
      }
    }
  });
  return fileTree
}

/** 获取某个文件依赖的子组件 */
function getRelyComp(absPath, file) {
  const filePath = path.join(absPath, file);
  const fileData = fs.readFileSync(filePath, 'utf-8');
  const res = sfcParser.parse(fileData);
  const descriptor = res.descriptor;
  if (!descriptor.template || !descriptor.script) {
    return []
  }
  //sfcParser 的解析产物中已经有 template 的 ast 结果了
  const templateAst = res.descriptor.template.ast;
  // script 部分的 ast 需要自己去解析
  const scriptAst = ts.createSourceFile('', res.descriptor.script.content, ts.ScriptTarget.ES6, false);

  // 获取 template 中使用了的所有标签，["div", "elInput", "footerComp"];
  const templateRely = getTemplateRely(templateAst);
  // 获取 script 引入了的依赖  [{compName:"footerComp",filePath:"xx/xxx.vue"}]
  const scriptRely = getScriptRely(absPath, scriptAst);
  // 必须是 script 中引入了且 template 中使用了的才算是真正的依赖
  const realRely = scriptRely.filter(item => {
    return templateRely.includes(item.compName)
  });
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
    const tagName = toLowerCamelCase(ast.tag);
    result.push(tagName);
  }
  if (ast.children) {
    ast.children.forEach(item => {
      getTemplateRely(item, result);
    });
  }
  return Array.from(new Set(result))
}

/**
 * 拿到 script 中通过 import 方式引入的所有依赖
 * @param absFileDir 当前解析文件所在目录（绝对路径）
 */
function getScriptRely(absFileDir, ast) {
  let rely = [];
  ast.statements.forEach(item => {
    if (item.importClause && item.importClause.name && item.moduleSpecifier) {
      const compName = item.importClause.name.escapedText; // 组件名称 "footerComp"
      const compPath = item.moduleSpecifier.text; //组件路径  "./xxx/xxx/footer"
      // 处理成绝对路径
      const aliasPath = getAliasPath(absFileDir, compPath, entryPath, aliasObj);
      // 处理解析顺序
      rely.push({
        compName: toLowerCamelCase(compName),
        filePath: extensionsStr ? setExtensions(aliasPath, extensionsStr) : aliasPath,
      });
    }
  });
  return rely
}

/**
 * 计算组件依赖关系 getRelyResult( data, [{ fileName: 'E:/xxx/xxx.vue' }])
 * @param {Array} searchList
 * @param {*} rawRely 所有的依赖关系
 */
function getRelyResult(rawRely, searchList, result = []) {
  searchList.forEach(searchOne => {
    const match = rawRely.filter(item => {
      return item.relyonComp.find(rely => {
        // path.normalize 格式化路径
        return path.normalize(rely.fileName) === path.normalize(searchOne.fileName)
      })
    });
    if (match.length) {
      const ta = match.map(item => {
        return {
          fileName: item.fileName,
          child: [searchOne],
        }
      });
      getRelyResult(rawRely, ta, result);
    } else {
      const find = result.find(item => item.fileName === searchOne.fileName);
      if (find) {
        find.child = (find.child || []).concat(searchOne.child || []);
      } else {
        result.push(searchOne);
      }
    }
  });
  return result
}

function openBrowser(result) {
  const data = typeof result === 'string' ? result : JSON.stringify(result);
  createServer(data);
}
function createServer(data) {
  const server = http.createServer();
  server.on('request', (req, res) => {
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    res.write(data);
    res.end();
  });
  server.listen(3345, () => {
    console.log('服务启动成功，浏览器访问：', 'http://localhost:3345/');
  });
  server.on('error', err => {
    // 端口被占用，(这里判断比较简单，如果端口被占用，则认为已经启动了服务器，不考虑是其它程序占用端口的情况)
    if (err.code === 'EADDRINUSE') {
      console.log('http://localhost:3345/');
    }
  });
}

var index = {
  getRelyTree,
  openBrowser,
};

module.exports = index;
