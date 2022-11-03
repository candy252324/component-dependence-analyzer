# component-dependence-analyzer

一个用于分析组件依赖的工具。

注：目前只支持 vue 组件的依赖分析。

## 安装

```
npm install component-dependence-analyzer
```

## 使用示例

1. 项目目录默认为当前目录，分析 example.vue 文件的依赖关系

```bash
rely -f 'E:\projectDir\xxx\example.vue'
```

2.指定项目目录，分析 example.vue 文件的依赖关系

```bash
rely -p 'E:\projectDir'  -f 'E:\projectDir\xxx\example.vue'
```

3.配置别名

```bash
rely -p -f 'E:\projectDir\xxx\example.vue' -a "@:./src;@components:./src/components"
```

4.配置解析顺序

```bash
rely -p -f 'E:\projectDir\xxx\example.vue' -e ".js,.jsx,.vue,.json"
```

5.将分析结果输出到浏览器上（默认只是打印出来）

```bash
rely -f 'E:\projectDir\xxx\example.vue' -o
```

| 参数             | 是否必须 | 默认值                         | 参数含义                         |
| :--------------- | :------- | :----------------------------- | :------------------------------- |
| -f, --filePath   | yes      | /                              | 组件绝对路径                     |
| -p, --projectDir | no       | process.cwd()                  | 需要分析的项目目录(默认当前路径) |
| -a, --alias      | no       | ""                             | 路径别名                         |
| -e, --extensions | no       | ".ts,.tsx,.js,.jsx,.vue,.json" | 解析顺序                         |
| -o, --open       | no       | false                          | 打开浏览器                       |
| -V, --version    | /        | /                              | 输出版本号                       |
| -h, --help       | /        | /                              | 输出帮助信息                     |
