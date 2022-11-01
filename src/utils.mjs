/** 转化为小驼峰
 *  A-bcd-e 转化为 aBcdE
 */
export function toLowerCamelCase(str) {
  // 将连字符及其后面的字母转化为大写字母
  var re = /-(\w)/g;
  str = str.replace(re, function ($0, $1) {
    return $1.toUpperCase();
  });
  // 首字母小写
  str = str.charAt(0).toLowerCase() + str.slice(1);
  return str;
}
