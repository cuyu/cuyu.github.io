---
layout: post
title: "Notes for using Typescript"
category: Javascript
tags: [Typescript]
date: 2019-01-16
---

1. ~~Node.js目前对于ES6的import语法只是实验性地支持，所以，在Node.js中还是用require吧。~~

2. 使用Webstorm可以debug Typescript的代码，但需要在`tsconfig.json`中把`sourceMap`设为true。然后在Typescript代码中打上断点，再使用Node.js来debug编译过的JavaScript代码（编译过后应该同时会生成一个`.map`文件，根据这个文件来映射`.js`到`.ts`进行debug）。

3. 在`tsconfig.json`中还可以设置`outDir`，即为编译后的`.js`文件会放到指定的目录下。

4. `tsconfig.json`的compilerOptions中的`lib`如果包含了`dom`，则Typescript会认为这是一个前端的JS环境 ，所以一些保留字也会和前端JS的一致，这时候再用Node.js的话是有一些问题的，比如说下面的代码编译就没法通过：

   ```typescript
   const fetch = require("node-fetch");
   ```

   错误信息为`redeclared variable`，因为它认为Global变量中已经有一个叫做`fetch`的变量了（但Node.js中并没有~）。

   比较好的解决方法是分别使用不同的`tsconfig.json`及`tslint.json`来维护前端代码和Node.js的后端代码。

5. tslint默认配置要求interface的命名必须以`I`开头，但我看了许多人不建议这么命名，所以，可以把interface相关的rule修改下。

6. 



Reference

- [https://www.jianshu.com/p/78268bd9af0a](https://www.jianshu.com/p/78268bd9af0a)