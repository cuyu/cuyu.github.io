---
layout: post
title: "Typescript: indexable types VS. generic types"
category: Javascript
tags: [Typescript]
date: 2018-06-21
---

我们可以定义indexable type:

```typescript
interface StringArray {
    [index: number]: string;
}

let myArray: StringArray;
myArray = ["Bob", "Fred"];

let myStr: string = myArray[0];
```

也可以定义泛型达到类似的效果：

```typescript
let myArray: Array<string>;
myArray = ["Bob", "Fred"];

let myStr: string = myArray[0];
```

两种方式有什么区别？为何有了泛型还需要indexable type？



区别1：indexable type缺少泛型类原型支持的方法。比如：

```typescript
interface StringArray {
    [index: number]: string;
}

let myArray: StringArray;
myArray = ["Bob", "Fred"];

myArray.find(x => x == 'Fred');  // Compile failed as Property 'find' does not exist on type 'StringArray'.
```



区别2：