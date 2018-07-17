---
layout: post
title: "Typescript初体验"
category: Javascript
tags: [Typescript]
date: 2018-07-17
---

1. 一个library要支持Typescript就需要提供一个`index.d.ts`文件，并在其中声明可以被import的对象。

   - 有些library自带了`index.d.ts`文件，那么安装好就能直接用；

   - 有些library并没有对Typescript做原生地支持，可以尝试安装`@types/[lib_name]`，`@types`是一个专门存放Typescript声明的库，很多library通过第三方在`@types`中添加了声明也可以很好地支持Typescript，例如：

     ```shell
     yarn add --dev @types/react
     ```

   - 对于那些以上都不支持的纯Javascript的library（一般是比较冷门的library了），那么可以通过创建一个`typings.d.ts`文件，并在其中声明该模块来使用（只需要声明模块即可，当然你也可以对其中的每个函数进行Typescript的声明，这样更利于维护），例如：

     ```typescript
     declare module "d3"
     ```

2. 有时候会碰到因为给定的类型和声明的类型不匹配而编译失败的情况，可以强行指定对象的类型来作为临时的work around（当然不建议这么做）：

   ```typescript
   myFunc('someInput' as any)
   ```

3. 目前（Typescript 2.9.2）对React的defaultProps支持还不是很好，但已经有[issue](https://github.com/Microsoft/TypeScript/issues/23812)在track这个特性，应该在未来的版本会有比较好的支持。

4. 通过Typescript的indexable type，我们可以声明一个字典对象：

   ```typescript
   interface AnimalGroup {
       [category: string]: {
           description: string,
           count: number,
       };
   }
   
   const zoo: AnimalGroup = {
       cat: {
           description: 'black',
           count: 3,
       },
       tiger: {
           description: 'big',
           count: 2,
       },
   };
   ```

5. 由于indexable type很灵活，于是也可以用来声明一个数组:

   ```typescript
   interface StringArray {
       [index: number]: string;
   }
   
   let myArray: StringArray;
   myArray = ["Bob", "Fred"];
   
   let myStr: string = myArray[0];
   ```

   但同时，也可以定义泛型达到类似的效果：

   ```typescript
   let myArray: Array<string>;
   myArray = ["Bob", "Fred"];
   
   let myStr: string = myArray[0];
   ```

   两种方式有什么区别？

   一个比较大的区别是：indexable type缺少泛型类原型支持的方法。比如：

   ```typescript
   interface StringArray {
       [index: number]: string;
   }
   
   let myArray: StringArray;
   myArray = ["Bob", "Fred"];
   
   myArray.find(x => x == 'Fred');  // Compile failed as Property 'find' does not exist on type 'StringArray'.
   ```