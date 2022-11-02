import path from 'path'
import fs from 'fs'

/** 转化为小驼峰
 *  A-bcd-e 转化为 aBcdE
 */
export function toLowerCamelCase(str) {
  // 将连字符及其后面的字母转化为大写字母
  var re = /-(\w)/g
  str = str.replace(re, function ($0, $1) {
    return $1.toUpperCase()
  })
  // 首字母小写
  str = str.charAt(0).toLowerCase() + str.slice(1)
  return str
}

/**
 * 获取解析目录，如果用户没传，则使用当前目录作为解析路径
 * @param {string} projectDir 参数上的路径字符串，rely --projectDir "xxx/xxx"
 */
export function getEntryPath(projectDir) {
  let entryPath = projectDir
  if (!projectDir) {
    entryPath = process.cwd()
  }
  return entryPath
}

/**
 * 获取别名映射关系
 * @param {string} aliasStr 参数上的别名字符串， "@:./src;@components:./src/components"
 * @returns
 */
export function getAliasObj(aliasStr) {
  if (aliasStr) {
    try {
      let aliasObj = {} // {"@":"src","@components":"./src/components"}
      const aliasArr = aliasStr.split(';') // ["@:./src","@components:./src/components"]
      for (let i = 0; i < aliasArr.length; i++) {
        const item = aliasArr[i]
        if (item.indexOf(':') === -1) {
          const errMes = "--alias 参数格式错误，参考格式：rely --alias '@:./src;@components:./src/components'"
          throw new Error(errMes)
          return
        }
        const key = item.split(':')[0].trim()
        const value = item.split(':')[1].trim()
        aliasObj[key] = value
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
export function setExtensions(filePath, extensionsStr) {
  const ext = filePath.slice(filePath.lastIndexOf('.'))
  // 如果有后缀
  if (ext.startsWith('.') && ext.length > 1 && ext.indexOf('/') === -1) {
    return filePath
  } else {
    const extensionsArr = extensionsStr.split(',')
    let hasMatch = false
    for (let i = 0; i < extensionsArr.length; i++) {
      const newFilePath = filePath + extensionsArr[i].trim()
      try {
        const statsObj = fs.statSync(newFilePath)
        // 存在该后缀的文件
        if (statsObj.isFile()) {
          hasMatch = true
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
export function getAliasPath(absFileDir, compPath, entryPath, aliasObj) {
  // 如果没有配置别名
  if (!aliasObj) {
    return path.resolve(absFileDir, compPath)
  } else {
    try {
      const aliasKeysArr = Object.keys(aliasObj) // ["@","@components"]
      const aliasValuesArr = Object.values(aliasObj) // ["./src","./src/components"]
      const matchAliasIdx = aliasKeysArr.findIndex(item => compPath.startsWith(item))
      if (matchAliasIdx !== -1) {
        const aliasKey = aliasKeysArr[matchAliasIdx] // "@components"
        const aliasValue = aliasValuesArr[matchAliasIdx] // "./src/components"
        let absAliasPath = path.resolve(entryPath, aliasValue) // "E:/projectName/src/components"
        const s = './' + compPath.replace(aliasKey, '') // "@components/footer.vue" 转化成 "./src/components/footer.vue"
        return path.resolve(absAliasPath, s)
      } else {
        return path.resolve(absFileDir, compPath)
      }
    } catch (error) {
      console.log('路径解析出错了！！！！！！！！！')
      console.log(error)
      throw new Error(error)
    }
  }
}

/**
 * 校验传入的组件路径格式是否正确
 * @param {string} filePath
 * @returns
 */
export function validateFilePath(filePath) {
  let flag = false
  if (!filePath) {
    console.log('--filePath 必须传入')
  } else {
    const statsObj = fs.statSync(filePath)
    if (statsObj.isDirectory()) {
      console.log('--filePath 参数传入错误')
    }
    // 必须是文件，且后缀是vue
    else if (statsObj.isFile() && path.extname(filePath) === '.vue') {
      flag = true
    }
  }
  return flag
}
/**
 * 校验 --extensions 参数传的是否正确
 * 正确格式 ".jxs,.vue,.tsx"
 */
export function validateExtensions(extensionsStr) {
  const extensionsArr = extensionsStr.split(',')
  // 必须以点开头
  const validate = extensionsArr.every(item => item.startsWith('.'))
  if (!validate) {
    console.log('--extensions 参数格式不正确')
  }
  return validate
}

/** 打印 */
export function consoleSplitLine(key, value) {
  value = value ? value : '无'
  if (typeof value === 'string') {
    console.log(`---- ${key}: ${value}`)
  } else {
    console.log(`---- ${key}`)
    console.log(value)
  }
  console.log()
}
