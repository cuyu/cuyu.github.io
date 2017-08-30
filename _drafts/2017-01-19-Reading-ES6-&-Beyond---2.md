---
layout: post
title: "Reading <ES6 & Beyond> - 2"
category: Javascript
tags: [读书笔记, You Dont Know JS]
date: 2017-01-19
---



---

*在我看关于module的内容时，似乎还没有编译器原生支持这个特性（nodejs(v7.4.0)和chrome都不行），也是寂了个寞了。我之所以要看这部分内容其实是因为看到React的quickstart例子有用到import，现在看来它应该是帮你polyfill了这部分语句吧。*

> ## Modules
>
> ### The Old Way
>
> The traditional module pattern is based on an outer function with inner variables and functions, and a returned "public API" with methods that have closure over the inner data and capabilities. It's often expressed like this:
>
> ```javascript
> function Hello(name) {
>     function greeting() {
>         console.log( "Hello " + name + "!" );
>     }
>
>     // public API
>     return {
>         greeting: greeting
>     };
> }
>
> var me = Hello( "Kyle" );
> me.greeting();          // Hello Kyle!
> ```

所以，module的作用是封装咯，选择性地提供部分方法供外部调用（这么想，module和class也没什么区别了嘛，只不过一个是以文件为单位，一个是自己定义的范围）。

---

> ### The New Way
>
> An important detail that's easy to overlook: both `import` and `export` must always appear in the top-level scope of their respective usage. For example, you cannot put either an `import` or `export` inside an `if` conditional; they must appear outside of all blocks and functions.

Python里面没这个限制，不过这个限制也很弱，很容易work around的。

---

> The `export` keyword is either put in front of a declaration, or used as an operator (of sorts) with a special list of bindings to export. Consider:
>
> ```javascript
> export function foo() {
>     // ..
> }
>
> export var awesome = 42;
>
> var bar = [1,2,3];
> export { bar };
> ```
>
> Another way of expressing the same exports:
>
> ```javascript
> function foo() {
>     // ..
> }
>
> var awesome = 42;
> var bar = [1,2,3];
>
> export { foo, awesome, bar };
> ```

1. Python里面没有指定export的对象一说，即一个module里面所有全局对象都是可以import的（至于一些全局私有对象，只能靠变量名前面的下划线来区分，告诉别人最好不要import这些对象而已）。在封装这一块，Python做的事情特别少（比如class也没有私有成员一说），也就导致了代码比较容易被hack，这对于代码开发的来说是好事（所有都是透明的），但对维护者来说就不太友好了（什么都要关注）。
2. `export`后面的花括号是和它配套的语法，JavaScript里面是没有set的概念的。

---

> Within your module, if you change the value of a variable you already exported a binding to, even if it's already been imported (see the next section), the imported binding will resolve to the current (updated) value.
>
> Consider:
>
> ```javascript
> var awesome = 42;
> export { awesome };
>
> // later
> awesome = 100;
> ```
>
> When this module is imported, regardless of whether that's before or after the `awesome = 100` setting, once that assignment has happened, the imported binding resolves to the `100` value, not `42`.

module是单例模式，export和import的是同一个对象的引用（对比Python的话，`import`得到了也是module的引用，但`from..import`得到的是module的拷贝）。

---

> A default export sets a particular exported binding to be the default when importing the module. The name of the binding is literally `default`. As you'll see later, when importing module bindings you can also rename them, as you commonly will with a default export.
>
> There can only be one `default` per module definition. We'll cover `import` in the next section, and you'll see how the `import` syntax is more concise if the module has a default export.
>
> There's a subtle nuance to default export syntax that you should pay close attention to. Compare these two snippets:
>
> ```javascript
> function foo(..) {
>     // ..
> }
>
> export default foo;
> ```
>
> And this one:
>
> ```javascript
> function foo(..) {
>     // ..
> }
>
> export { foo as default };
> ```

1. `default`其实就是import和export的一个语法糖，它可以帮你省去import时default对象外的花括号，同时可以任意命名这个default的对象（它的mapping不需要靠名称，即import没花括号对象->default对象->export的default对象）。
2. 上述两种方式的不同在于：前者export的对象是作为值来export的，即使后续它发生变化，export的仍然是之前的值；后者export的是引用，后续发生变化，则export的值也发生变化。（统一起见，我觉得还是用后面的方式吧。）

---

> 