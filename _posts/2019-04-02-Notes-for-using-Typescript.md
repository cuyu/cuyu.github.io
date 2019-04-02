---
layout: post
title: "关于Typescript以及React"
category: Javascript
tags: [Typescript, React]
date: 2019-04-02
---

1. 使用Webstorm（或vscode）可以debug Typescript的代码，但需要在`tsconfig.json`中把`sourceMap`设为true。然后在Typescript代码中打上断点，再使用Node.js来debug编译过的JavaScript代码（编译过后应该同时会生成一个`.map`文件，根据这个文件来映射`.js`到`.ts`进行debug）。

2. 在`tsconfig.json`中可以设置`outDir`，即为编译后的`.js`文件会放到指定的目录下。

3. `tsconfig.json`的compilerOptions中的`lib`如果包含了`dom`，则Typescript会认为这是一个前端的JS环境 ，所以一些保留字也会和前端JS的一致，这时候再用Node.js的话是有一些问题的，比如说下面的代码编译就没法通过：

   ```typescript
   const fetch = require("node-fetch");
   ```

   错误信息为`redeclared variable`，因为它认为Global变量中已经有一个叫做`fetch`的变量了（但Node.js中并没有~）。

   比较好的解决方法是分别使用不同的`tsconfig.json`及`tslint.json`来维护前端代码和Node.js的后端代码。

4. tslint默认配置要求interface的命名必须以`I`开头，但我看了许多人不建议这么命名，所以，可以把interface相关的rule修改下。

5. 可以使用`ReturnType`来使用一个函数的返回值的类型定义新的类型：

   ```typescript
   type yyy = ReturnType<typeof xxx>;
   ```

6. `create-react-app`目前支持生成typscript的项目，但tslint目前要手动创建，并且在`package.json`中添加如下的命令：

   ```
   "lint": "tslint -c tslint.json src/**/*.{ts,tsx}"
   ```

7. 可以安装额外的tslint package来扩充规则，对于React项目而言，比较有用的是`tslint-react`，贴下我的`tslint.json`作为参考：

   ```json
   {
     "extends": ["tslint:recommended", "tslint-react", "tslint-config-prettier"],
     "linterOptions": {
       "exclude": [
         "config/**/*.js",
         "node_modules/**/*.ts",
         "coverage/lcov-report/*.js"
       ]
     },
     "rules": {
       "no-console": false,
       "semicolon": false,
       "ordered-imports": false,
       "object-literal-sort-keys": false,
       "variable-name": [true, "allow-leading-underscore", "allow-pascal-case"],
       "interface-name": [true, "never-prefix"],
       "jsx-boolean-value": false,
       "max-classes-per-file": false
     }
   }
   ```

8. 很多example可以参考[https://github.com/piotrwitek/react-redux-typescript-guide](https://github.com/piotrwitek/react-redux-typescript-guide)

9. React现在不建议在组件中使用匿名函数，原因是某些情况下会导致性能下降。所以，要获取组件中某个JSX的ref可以这样做：

   ```tsx
   class MyComponent extends React.Component<Props, State> {
       private elem: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
       public render() {
           return (
               <div ref={this.elem}>
                   xxx
               <div/>
           );
       }
   }
   ```



Reference

- [https://www.jianshu.com/p/78268bd9af0a](https://www.jianshu.com/p/78268bd9af0a)