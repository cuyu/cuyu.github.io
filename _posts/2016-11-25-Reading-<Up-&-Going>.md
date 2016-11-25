---
layout: post
title: "Reading &lt;Up & Going&gt;"
category: Javascript
tags: [读书笔记,You Dont Know JS]
date: 2016-11-25
---

[Up & Going](https://github.com/getify/You-Dont-Know-JS/blob/master/up%20&%20going/README.md#you-dont-know-js-up--going)是[You Don't Know JS](https://github.com/getify/You-Dont-Know-JS)系列的第一本书，主要粗略的介绍了ES6的各个语言特性，可以说是从入门到~~放弃~~精通的很好读物。这里我摘了一些讲得不错或者我觉得比较有意思的段落，并在部分段落后面添加了当时读到时~~naive~~的想法。

> The JavaScript engine actually *compiles* the program on the fly and then immediately runs the compiled code.

---

> implicit coercion(隐式类型转换) is confusing and harms programs with unexpected bugs, and should thus be avoided. It's even sometimes called a flaw in the design of the language.

---

> There are lots of opinions on what makes well-commented code; we can't really define absolute universal rules. But some observations and guidelines are quite useful:
>
> - Code without comments is suboptimal.
> - Too many comments (one per line, for example) is probably a sign of poorly written code.
> - Comments should explain *why*, not *what*. They can optionally explain *how* if that's particularly confusing.

---

> In some programming languages, you declare a variable (container) to hold a specific type of value, such as `number`or `string`. *Static typing*, otherwise known as *type enforcement*, is typically cited as a benefit for program correctness by preventing unintended value conversions.
>
> Other languages emphasize types for values instead of variables. *Weak typing*, otherwise known as *dynamic typing*, allows a variable to hold any type of value at any time. It's typically cited as a benefit for program flexibility by allowing a single variable to represent a value no matter what type form that value may take at any given moment in the program's logic flow.
>
> JavaScript uses the latter approach, *dynamic typing*, meaning variables can hold values of any *type* without any *type*enforcement.

这段看得还是有点晕，其实说的是JavaScript是动态类型语言（虽然这里没提，它也是弱类型，作为对比，Python是强类型语言）。至于动态/静态，强/弱类型语言的区别，觉得轮子哥说的还比较清楚：

> 强类型：偏向于不容忍隐式类型转换。譬如说haskell的int就不能变成double
>
> 弱类型：偏向于容忍隐式类型转换。譬如说C语言的int可以变成double
>
> 静态类型：编译的时候就知道每一个变量的类型，因为类型错误而不能做的事情是语法错误。
>
> 动态类型：编译的时候不知道每一个变量的类型，因为类型错误而不能做的事情是运行时错误。譬如说你不能对一个数字a写a[10]当数组用。

---

> JavaScript has typed values, not typed variables. The following built-in types are available:
>
> - `string`
> - `number`
> - `boolean`
> - `null` and `undefined`
> - `object`
> - `symbol` (new to ES6)
>

---

> `typeof null` is an interesting case, because it errantly returns `"object"`, when you'd expect it to return `"null"`. This is a long-standing bug in JS, but one that is likely never going to be fixed. Too much code on the Web relies on the bug and thus fixing it would cause a lot more bugs!

---

> Properties can either be accessed with *dot notation* (i.e., `obj.a`) or *bracket notation* (i.e., `obj["a"]`). Dot notation is shorter and generally easier to read, and is thus preferred when possible.
>
> Bracket notation is useful if you have a property name that has special characters in it, like `obj["hello world!”]`. Bracket notation is also useful if you want to access a property/key but the name is stored in another variable

---

> You've probably heard sentiments like "coercion is evil" drawn from the fact that there are clearly places where coercion can produce some surprising results. Perhaps nothing evokes frustration from developers more than when the language surprises them.
>
> Coercion is not evil, nor does it have to be surprising. In fact, the majority of cases you can construct with type coercion are quite sensible and understandable, and can even be used to *improve* the readability of your code.

"coercion is not evil”的情况，对于显式转换没什么问题，但对于隐式转换，我能想到的大概是一些常用的大家都知道的隐式转换，比如`console.log()`这种（类似的有Python的string.format()和print()，当然Python这里不是coercion，而是调用的__str__方法，但效果和coercion接近），以及条件判断时也不必都转换为bool类型。其他情况我还是很赞同”(implicit) coercion is evil”的啊。

<!--break-->

---

> The specific list of "falsy" values in JavaScript is as follows:
>
> - `""` (empty string)
>
> - `0`, `-0`, `NaN` (invalid `number`)
>
> - `null`, `undefined`
>
> - ``false`
>
> Any value that's not on this "falsy" list is "truthy."

---

> `==` checks for value equality with coercion allowed, and `===` checks for value equality without allowing coercion; `===` is often called "strict equality" for this reason.

---

> To boil down a whole lot of details to a few simple takeaways, and help you know whether to use `==` or `===` in various situations, here are my simple rules:
>
> - If either value (aka side) in a comparison could be the `true` or `false` value, avoid `==` and use `===`.
> - If either value in a comparison could be of these specific values (`0`, `""`, or `[]` -- empty array), avoid `==` and use `===`.
> - In *all* other cases, you're safe to use `==`. Not only is it safe, but in many cases it simplifies your code in a way that improves readability.

前提是你要对你的代码非常了解，否则用`===`还是最保险的方式。

---

> You should take special note of the `==` and `===` comparison rules if you're comparing two non-primitive values, like `object`s (including `function` and `array`). Because those values are actually held by reference, both `==` and `===`comparisons will simply check whether the references match, not anything about the underlying values.
>
> ```javascript
> var a = [1,2,3];
> var b = [1,2,3];
> var c = "1,2,3";
>
> a == c;     // true
> b == c;     // true
> a == b;     // false
> ```

这点我是真想吐槽JavaScript，要么就都比较引用地址，要么就都比较对象内容，怎么build-in的类型就比较内容，而非原生的类型就要比较地址了呢。学学C++和Python不好么，比较时自动调用比较函数，若没有再比较地址。

---

> Wherever a `var` appears inside a scope, that declaration is taken to belong to the entire scope and accessible everywhere throughout. Metaphorically, this behavior is called *hoisting*, when a `var` declaration is conceptually "moved" to the top of its enclosing scope. 

这点和Python不一样，Python如果函数调用在函数定义之前是会报错的，即使在同一个scope当中。

---

> Because an IIFE(*immediately invoked function expression*) is just a function, and functions create variable *scope*, using an IIFE in this fashion is often used to declare variables that won't affect the surrounding code outside the IIFE:
>
> ```javascript
> var a = 42;
>
> (function IIFE(){
>     var a = 10;
>     console.log( a );   // 10
> })();
>
> console.log( a );       // 42
> ```

---

> You can think of closure as a way to "remember" and continue to access a function's scope (its variables) even once the function has finished running.
>
> Consider:
>
> ```javascript
> function makeAdder(x) {
>     // parameter `x` is an inner variable
>
>     // inner function `add()` uses `x`, so
>     // it has a "closure" over it
>     function add(y) {
>         return y + x;
>     };
>
>     return add;
> }
> ```
>
> The reference to the inner `add(..)` function that gets returned with each call to the outer `makeAdder(..)` is able to remember whatever `x` value was passed in to `makeAdder(..)`. Now, let's use `makeAdder(..)`:
>
> ```javascript
> // `plusOne` gets a reference to the inner `add(..)`
> // function with closure over the `x` parameter of
> // the outer `makeAdder(..)`
> var plusOne = makeAdder( 1 );
>
> // `plusTen` gets a reference to the inner `add(..)`
> // function with closure over the `x` parameter of
> // the outer `makeAdder(..)`
> var plusTen = makeAdder( 10 );
>
> plusOne( 3 );       // 4  <-- 1 + 3
> plusOne( 41 );      // 42 <-- 1 + 41
>
> plusTen( 13 );      // 23 <-- 10 + 13
> ```

闭包的这个例子挺好的，在这里的作用类似于一个工厂方法，可以生成不同的函数对象。

---

> The most common usage of closure in JavaScript is the module pattern. Modules let you define private implementation details (variables, functions) that are hidden from the outside world, as well as a public API that *is*accessible from the outside.
>
> Consider:
>
> ```javascript
> function User(){
>     var username, password;
>
>     function doLogin(user,pw) {
>         username = user;
>         password = pw;
>
>         // do the rest of the login work
>     }
>
>     var publicAPI = {
>         login: doLogin
>     };
>
>     return publicAPI;
> }
>
> // create a `User` module instance
> var fred = User();
>
> fred.login( "fred", "12Battery34!" );
> ```

既然能用class来实现，为啥要用闭包呢？作为一个pythoner，感到很难受-_-。

---

> While it may often seem that `this` is related to "object-oriented patterns," in JS `this` is a different mechanism.
>
> If a function has a `this` reference inside it, that `this` reference usually points to an `object`. But which `object` it points to depends on how the function was called.
>
> It's important to realize that `this` *does not* refer to the function itself, as is the most common misconception.
>
> ```javascript
> function foo() {
>     console.log( this.bar );
> }
>
> var bar = "global";
>
> var obj1 = {
>     bar: "obj1",
>     foo: foo
> };
>
> var obj2 = {
>     bar: "obj2"
> };
>
> // --------
>
> foo();              // "global"
> obj1.foo();         // "obj1"
> foo.call( obj2 );   // "obj2"
> new foo();          // undefined
> ```
>
> There are four rules for how `this` gets set, and they're shown in those last four lines of that snippet.
>
> 1. `foo()` ends up setting `this` to the global object in non-strict mode -- in strict mode, `this` would be `undefined`and you'd get an error in accessing the `bar` property -- so `"global"` is the value found for `this.bar`.
> 2. `obj1.foo()` sets `this` to the `obj1` object.
> 3. `foo.call(obj2)` sets `this` to the `obj2` object.
> 4. `new foo()` sets `this` to a brand new empty object.
>

习惯了C++代码，这个特性需要适应。

---

> When you reference a property on an object, if that property doesn't exist, JavaScript will automatically use that object's internal prototype reference to find another object to look for the property on. You could think of this almost as a fallback if the property is missing.
>
> The internal prototype reference linkage from one object to its fallback happens at the time the object is created. The simplest way to illustrate it is with a built-in utility called `Object.create(..)`.
>
> Consider:
>
> ```javascript
> var foo = {
>     a: 42
> };
>
> // create `bar` and link it to `foo`
> var bar = Object.create( foo );
>
> bar.b = "hello world";
>
> bar.b;      // "hello world"
> bar.a;      // 42 <-- delegated to `foo`
> ```
>
> This linkage may seem like a strange feature of the language. The most common way this feature is used -- and I would argue, abused -- is to try to emulate/fake a "class" mechanism with "inheritance."

这个解释我给满分，第一眼就感觉原型类似于Python里类的继承，就像这里`foo`被绑定为了`bar`的基类效果一样。

---

> There are two main techniques you can use to "bring" the newer JavaScript stuff to the older browsers: polyfilling and transpiling.
>
> #### Polyfilling
>
> For example, ES6 defines a utility called `Number.isNaN(..)` to provide an accurate non-buggy check for `NaN` values, deprecating the original `isNaN(..)` utility. But it's easy to polyfill that utility so that you can start using it in your code regardless of whether the end user is in an ES6 browser or not.
>
> Consider:
>
> ```javascript
> if (!Number.isNaN) {
>     Number.isNaN = function isNaN(x) {
>         return x !== x;
>     };
> }
> ```
>
> Not all new features are fully polyfillable. Use an already vetted set of polyfills that you can trust, such as those provided by ES5-Shim ([https://github.com/es-shims/es5-shim](https://github.com/es-shims/es5-shim)) and ES6-Shim ([https://github.com/es-shims/es6-shim](https://github.com/es-shims/es6-shim)).

这种兼容的方式类似于Python的package在`__init__.py`中先判断Python编译器版本再做一些不同的预处理操作。

---

> #### Transpiling
>
> There's no way to polyfill new syntax that has been added to the language. The new syntax would throw an error in the old JS engine as unrecognized/invalid.
>
> So the better option is to use a tool that converts your newer code into older code equivalents. This process is commonly called "transpiling," a term for transforming + compiling.
>
> There are quite a few great transpilers for you to choose from. Here are some good options at the time of this writing:
>
> - Babel ([https://babeljs.io](https://babeljs.io/)) (formerly 6to5): Transpiles ES6+ into ES5
> - Traceur ([https://github.com/google/traceur-compiler](https://github.com/google/traceur-compiler)): Transpiles ES6, ES7, and beyond into ES5

简单说就是把新版本的代码编译成旧版本的，用来兼容不支持新版的浏览器。这两种兼容方式的区别是前者是运行时做兼容处理，后者是运行前做兼容处理。

---

> The most common non-JavaScript JavaScript you'll encounter is the DOM API. For example:
>
> ```javascript
> var el = document.getElementById( "foo" );
> ```
>
> The `document` variable exists as a global variable when your code is running in a browser. It's not provided by the JS engine, nor is it particularly controlled by the JavaScript specification. It takes the form of something that looks an awful lot like a normal JS `object`, but it's not really exactly that. It's a special `object,` often called a "host object."
>
> Moreover, the `getElementById(..)` method on `document` looks like a normal JS function, but it's just a thinly exposed interface to a built-in method provided by the DOM from your browser. In some (newer-generation) browsers, this layer may also be in JS, but traditionally the DOM and its behavior is implemented in something more like C/C++.
>
> Another example is with input/output (I/O).
>
> Everyone's favorite `alert(..)` pops up a message box in the user's browser window. `alert(..)` is provided to your JS program by the browser, not by the JS engine itself. The call you make sends the message to the browser internals and it handles drawing and displaying the message box.
>
> The same goes with `console.log(..)`; your browser provides such mechanisms and hooks them up to the developer tools.

DOM是JavaScript和浏览器交互时浏览器暴露出来的一些API，前端的JavaScript编译器应该是对其做了简单的封装？对NodeJS而言，这些东西都是不存在的。