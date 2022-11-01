import path from 'path'
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
 * @param {string} pathStr 参数上的路径字符串，rely --path "xxx/xxx"
 */
export function getEntryPath(pathStr) {
  let entryPath = pathStr
  if (!pathStr) {
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

/** 打印 */
export function consoleSplitLine(key, value) {
  console.log(`--------------------- ${key} ---------------------`)
  console.log(value)
  console.log()
}
