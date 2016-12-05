---
layout: post
title: "Reading &lt;Scope & Closures&gt;"
category: Javascript
tags: [读书笔记, You Dont Know JS]
date: 2016-12-05
---

## Chapter 1: What is Scope?

> In fact, the ability to store values and pull values out of variables is what gives a program *state*.

简单的概念我们往往会自动忽略，并不会理解到这么深入。

---

> For JavaScript, the compilation that occurs happens, in many cases, mere microseconds (or less!) before the code is executed. To ensure the fastest performance, JS engines use all kinds of tricks (like JITs, which lazy compile and even hot re-compile, etc.) 

---

> Two distinct actions are taken for a variable assignment (e.g. `var a = 2;`): First, *Compiler* declares a variable (if not previously declared in the current scope), and second, when executing, *Engine* looks up the variable in *Scope* and assigns to it, if found.

简单说就是声明是编译时进行的，赋值是运行时的（这点和Python一样，虽然Python不需要声明，作为对比，C++的赋值是编译时的？）。

---

> ```javascript
> function foo(a) {
>     console.log( a ); // 2
> }
>
> foo( 2 );
> ```
>
> Let's imagine the above exchange (which processes this code snippet) as a conversation. The conversation would go a little something like this:
>
> > **Engine**: Hey *Scope*, I have an RHS(right-hand side) reference for `foo`. Ever heard of it?
> >
> > **Scope**: Why yes, I have. *Compiler* declared it just a second ago. He's a function. Here you go.
> >
> > **Engine**: Great, thanks! OK, I'm executing `foo`.
> >
> > **Engine**: Hey, *Scope*, I've got an LHS(left-hand side) reference for `a`, ever heard of it?
> >
> > **Scope**: Why yes, I have. *Compiler* declared it as a formal parameter to `foo` just recently. Here you go.
> >
> > **Engine**: Helpful as always, *Scope*. Thanks again. Now, time to assign `2` to `a`.
> >
> > **Engine**: Hey, *Scope*, sorry to bother you again. I need an RHS look-up for `console`. Ever heard of it?
> >
> > **Scope**: No problem, *Engine*, this is what I do all day. Yes, I've got `console`. He's built-in. Here ya go.
> >
> > **Engine**: Perfect. Looking up `log(..)`. OK, great, it's a function.
> >
> > **Engine**: Yo, *Scope*. Can you help me out with an RHS reference to `a`. I think I remember it, but just want to double-check.
> >
> > **Scope**: You're right, *Engine*. Same guy, hasn't changed. Here ya go.
> >
> > **Engine**: Cool. Passing the value of `a`, which is `2`, into `log(..)`.
> >
> > ...

太生动了。

---

> Both LHS and RHS reference look-ups start at the currently executing *Scope*, and if need be (that is, they don't find what they're looking for there), they work their way up the nested *Scope*, one scope (floor) at a time, looking for the identifier, until they get to the global (top floor) and stop, and either find it, or don't.
>
> Unfulfilled RHS references result in `ReferenceError`s being thrown. Unfulfilled LHS references result in an automatic, implicitly-created global of that name (if not in "Strict Mode"), or a `ReferenceError` (if in "Strict Mode").

所以在严格模式下，我们其实不用太区分RHS还是LHS了。(目前看来Scope上和Python不同的地方在于，外部变量需要声明后才能在内部使用（严格模式下），而Python只有在需要对外部变量赋值时才需要使用`global`来声明，使用并不需要声明。)

---

## Chapter 2: Lexical Scope

> There are two predominant models for how scope works. The first of these is by far the most common, used by the vast majority of programming languages. It's called **Lexical Scope**, and we will examine it in-depth. The other model, which is still used by some languages (such as Bash scripting, some modes in Perl, etc.) is called **Dynamic Scope**.

编译原理要补课了。

---

> Global variables are also automatically properties of the global object (`window` in browsers, etc.), so it *is*possible to reference a global variable not directly by its lexical name, but instead indirectly as a property reference of the global object.
>
> ```javascript
> window.a
> ```

JavaScript冷知识。

---

> If lexical scope is defined only by where a function is declared, which is entirely an author-time decision, how could there possibly be a way to "modify" (aka, cheat) lexical scope at run-time?
>
> JavaScript has two such mechanisms. Both of them are equally frowned-upon in the wider community as bad practices to use in your code. But the typical arguments against them are often missing the most important point: **cheating lexical scope leads to poorer performance.**

这里说的两种方式一是用`eval`，一是用`with`。前者强烈不建议用（eval is evil!），且在严格模式下用`eval`夹带赋值操作是没有作用的（`eval(..)` when used in a strict-mode program operates in its own lexical scope）。而后者在严格模式下直接整个就不能用了。

---

> `with` is typically explained as a short-hand for making multiple property references against an object *without*repeating the object reference itself each time.
>
> For example:
>
> ```javascript
> var obj = {
>     a: 1,
>     b: 2,
>     c: 3
> };
>
> // more "tedious" to repeat "obj"
> obj.a = 2;
> obj.b = 3;
> obj.c = 4;
>
> // "easier" short-hand
> with (obj) {
>     a = 3;
>     b = 4;
>     c = 5;
> }
> ```

虽然在严格模式下，`with`语句被禁了，但还是可以了解下，可以看到`with`的用处和Python完全不一样。

---

## Chapter 3: Function vs. Block Scope

> They tend to arise from the software design principle "Principle of Least Privilege" , also sometimes called "Least Authority" or "Least Exposure". This principle states that in the design of software, such as the API for a module/object, you should expose only what is minimally necessary, and "hide" everything else.

---

> For example:
>
> ```javascript
> var a = 2;
>
> function foo() { // <-- insert this
>
>     var a = 3;
>     console.log( a ); // 3
>
> } // <-- and this
> foo(); // <-- and this
>
> console.log( a ); // 2
> ```
>
> There are a few problems it introduces. The first is that we have to declare a named-function `foo()`, which means that the identifier name `foo` itself "pollutes" the enclosing scope (global, in this case). We also have to explicitly call the function by name (`foo()`) so that the wrapped code actually executes.
>
> It would be more ideal if the function didn't need a name (or, rather, the name didn't pollute the enclosing scope), and if the function could automatically be executed.
>
> ```javascript
> var a = 2;
>
> (function foo(){ // <-- insert this
>
>     var a = 3;
>     console.log( a ); // 3
>
> })(); // <-- and this
>
> console.log( a ); // 2
> ```

回想下在Python代码里我为什么比较少去关注”命名污染“的问题，一是所有的类和方法定义通常会单独放在一些py文件里，而代码执行的main函数会单独一个文件，所以很少会出现方法定义污染main函数所在命名空间的情况；二是得益于Python的namespace规则和import的规则，每个py文件都拥有一个独立的命名空间，加之强大的IDE会在`from..import..`两个同名的变量时有所提示，发生命名冲突的情况也就比较少；三就是俺的命名习惯比较好啦。

---

> ### Anonymous vs. Named
>
> You are probably most familiar with function expressions as callback parameters, such as:
>
> ```javascript
> setTimeout( function(){
>     console.log("I waited 1 second!");
> }, 1000 );
> ```
>
> This is called an "anonymous function expression", because `function()...` has no name identifier on it. Function expressions can be anonymous, but function declarations cannot omit the name -- that would be illegal JS grammar.
>
> Anonymous function expressions are quick and easy to type, and many libraries and tools tend to encourage this idiomatic style of code. However, they have several draw-backs to consider:
>
> 1. Anonymous functions have no useful name to display in stack traces, which can make debugging more difficult.
> 2. Without a name, if the function needs to refer to itself, for recursion, etc., the **deprecated** `arguments.callee`reference is unfortunately required. Another example of needing to self-reference is when an event handler function wants to unbind itself after it fires.
> 3. Anonymous functions omit a name that is often helpful in providing more readable/understandable code. A descriptive name helps self-document the code in question.
>
> **Inline function expressions** are powerful and useful -- the question of anonymous vs. named doesn't detract from that. Providing a name for your function expression quite effectively addresses all these draw-backs, but has no tangible downsides. The best practice is to always name your function expressions:
>
> ```javascript
> setTimeout( function timeoutHandler(){ // <-- Look, I have a name!
>     console.log( "I waited 1 second!" );
> }, 1000 );
> ```

这段很精彩，因为匿名函数在JavaScript里面用的还是比较多的，这里建议是尽量不用匿名函数，即使要避免命名污染，也是用函数表达式来替代函数定义。

---

> Another application of this pattern addresses the (minor niche) concern that the default `undefined` identifier might have its value incorrectly overwritten, causing unexpected results. By naming a parameter `undefined`, but not passing any value for that argument, we can guarantee that the `undefined` identifier is in fact the undefined value in a block of code:
>
> ```javascript
> undefined = true; // setting a land-mine for other code! avoid!
>
> (function IIFE( undefined ){
>
>     var a;
>     if (a === undefined) {
>         console.log( "Undefined is safe here!" );
>     }
>
> })();
> ```

这段代码可以联想到的JavaScript和Python的几处不同：

- Python的函数定义有几个input，那么调用时就必须放几个输入变量，否则会报错：

  ```python
  def test(a):
      print a

  test()  # Raise TypeError
  ```
  而JavaScript则会对多余的变量赋予`undefined`的值（这样调试感觉更困难了）。

- Python中所有的东西都是对象，所有东西的类型都有一个共同的基类`object`（简直不能更优雅）。而JavaScript则不是这样的，它本身定义了几种不同的基本类型（类似C++），比如`123`和`'abc'`两者之间是断然没有任何交集的。

- `undefined`在JavaScript感觉就是个奇葩的存在。在Python中类似的场景要么是报错，要么是得到`None`（比如函数没有设返回值，返回值就是`None`）。具体出现`undefined`的情况可以参考[stackoverflow](http://stackoverflow.com/questions/2235622/can-i-set-variables-to-undefined-or-pass-undefined-as-an-argument)的一个回答：

  > Don't be confused about `null`. It generally makes sense and behaves similarly to other scripting languages' concepts of the out-of-band ‘null’, ‘nil’ or ‘None’ objects.
  >
  > `undefined`, on the other hand, is a weird JavaScript quirk. It's a singleton object that represents out-of-band values, essentially a second similar-but-different `null`. It comes up:
  >
  > 1. When you call a function with fewer arguments than the arguments list in the `function`statement lists, the unpassed arguments are set to `undefined`. You can test for that with eg.:
  >
  >    ```
  >    function dosomething(arg1, arg2) {
  >        if (arg2===undefined)
  >        arg2= DEFAULT_VALUE_FOR_ARG2;
  >        ...
  >    }
  >    ```
  >
  >    With this method you can't tell the difference between `dosomething(1)` and `dosomething(1, undefined)`; `arg2` will be the same value in both. If you need to tell the difference you can look at `arguments.length`, but doing optional arguments like that isn't generally very readable.
  >
  > 2. When a function has no `return value;`, it returns `undefined`. There's generally no need to use such a return result.
  >
  > 3. When you declare a variable by having a `var a` statement in a block, but haven't yet assigned a value to it, it is `undefined`. Again, you shouldn't really ever need to rely on that.
  >
  > 4. The spooky `typeof` operator returns `'undefined'` when its operand is a simple variable that does not exist, instead of throwing an error as would normally happen if you tried to refer to it. (You can also give it a simple variable wrapped in parentheses, but *not* a full expression involving a non-existant variable.) Not much use for that, either.
  >
  > 5. This is the controversial one. When you access a property of an object which doesn't exist, you don't immediately get an error like in every other language. Instead you get an `undefined`object. (And then when you try to use that `undefined` object later on in the script it'll go wrong in a weird way that's much more difficult to track down than if JavaScript had just thrown an error straight away.)
  >
  >    This is often used to check for the existance of properties:
  >
  >    ```
  >    if (o.prop!==undefined) // or often as truthiness test, if (o.prop)
  >       ...do something...
  >    ```
  >
  >    However, because you can assign `undefined` like any other value:
  >
  >    ```
  >    o.prop= undefined;
  >    ```
  >
  >    that doesn't actually detect whether the property is there reliably. Better to use the `in`operator, which wasn't in the original Netscape version of JavaScript, but is available everywhere now:
  >
  >    ```
  >    if ('prop' in o)
  >        ...
  >    ```
  >
  > In summary, `undefined` is a JavaScript-specific mess, which confuses everyone. Apart from optional function arguments, where JS has no other more elegant mechanism, `undefined` should be avoided. It should never have been part of the language; `null` would have worked just fine for (2) and (3), and (4) is a misfeature that only exists because in the beginning JavaScript had no exceptions.

  `undefined`既然已经是JavaScript的一部分，我们也只能尽量避免去用到它了，但也要知道它会在哪些时候出现。

- How to explain this?

  ```javascript
  var undefined=123;
  console.log(undefined);  // undefined, not 123
  ```


---

> Still another variation of the IIFE inverts the order of things, where the function to execute is given second, *after* the invocation and parameters to pass to it. This pattern is used in the UMD (Universal Module Definition) project. Some people find it a little cleaner to understand, though it is slightly more verbose.
>
> ```javascript
> var a = 2;
>
> (function IIFE( def ){
>     def( window );
> })(function def( global ){
>
>     var a = 3;
>     console.log( a ); // 3
>     console.log( global.a ); // 2
>
> });
> ```

这段代码对于一个pythoner不太友好啊，对着这`def`看了半天。。好吧，`def`在这是个变量，指向了后面定义的一个函数。也就是说这里的IIFE在它的输入里面定义了一个函数，并把这个刚定义的函数传递给了自己。注意这里的函数名`IIFE`和`def`都没有污染当前的命名空间。

---

> ```javascript
> for (var i=0; i<10; i++) {
>     console.log( i );
> }
> ```
>
> We declare the variable `i` directly inside the for-loop head, most likely because our *intent* is to use `i` only within the context of that for-loop, and essentially ignore the fact that the variable actually scopes itself to the enclosing scope (function or global).

这点JavaScript和Python是一样的：循环语句和条件语句并没有独立的scope，它其中定义的变量隶属于它所在的scope (JavaScript/Python has no facility for block scope)。没有block scope的也就导致了一些bug可能会由命名污染/冲突而产生（因为它们看起来实在是太像有一个独立的scope了）。

---

> It's a *very* little known fact that JavaScript in ES3 specified the variable declaration in the `catch` clause of a `try/catch` to be block-scoped to the `catch` block.
>
> For instance:
>
> ```javascript
> try {
>     undefined(); // illegal operation to force an exception!
> }
> catch (err) {
>     console.log( err ); // works!
> }
>
> console.log( err ); // ReferenceError: `err` not found
> ```

---

> The `let` keyword attaches the variable declaration to the scope of whatever block (commonly a `{ .. }` pair) it's contained in. In other words, `let` implicitly hijacks any block's scope for its variable declaration.
>
> ```javascript
> var foo = true;
>
> if (foo) {
>     let bar = foo * 2;
>     bar = something( bar );
>     console.log( bar );
> }
>
> console.log( bar ); // ReferenceError
> ```

引入`let`主要作用就是克服block scope没有独立的namespace的问题，设想下假如JavaScript一开始就设定了block scope有独立的namespace，是不是更好？

> Creating explicit blocks for block-scoping can address some of these concerns, making it more obvious where variables are attached and not. Usually, explicit code is preferable over implicit or subtle code. This explicit block-scoping style is easy to achieve, and fits more naturally with how block-scoping works in other languages:
>
> ```javascript
> var foo = true;
>
> if (foo) {
>     { // <-- explicit block
>         let bar = foo * 2;
>         bar = something( bar );
>         console.log( bar );
>     }
> }
>
> console.log( bar ); // ReferenceError
> ```

至少我们知道了JavaScript里面`{}`是可以任意添加的。

---

> Block-scoping can address this concern, making it clearer to the engine that it does not need to keep `someReallyBigData` around:
>
> ```javascript
> function process(data) {
>     // do something interesting
> }
>
> // anything declared inside this block can go away after!
> {
>     let someReallyBigData = { .. };
>
>     process( someReallyBigData );
> }
>
> var btn = document.getElementById( "my_button" );
>
> btn.addEventListener( "click", function click(evt){
>     console.log("button clicked");
> }, /*capturingPhase=*/false );
> ```

巧妙利用JavaScript的垃圾回收。

---

> A particular case where `let` shines is in the for-loop case as we discussed previously.
>
> ```javascript
> for (let i=0; i<10; i++) {
>     console.log( i );
> }
>
> console.log( i ); // ReferenceError
> ```
>
> Not only does `let` in the for-loop header bind the `i` to the for-loop body, but in fact, it **re-binds it** to each *iteration*of the loop, making sure to re-assign it the value from the end of the previous loop iteration.
>
> Here's another way of illustrating the per-iteration binding behavior that occurs:
>
> ```javascript
> {
>     let j;
>     for (j=0; j<10; j++) {
>         let i = j; // re-bound for each iteration!
>         console.log( i );
>     }
> }
> ```

这里re-bind的好处是什么？

---

> In addition to `let`, ES6 introduces `const`, which also creates a block-scoped variable, but whose value is fixed (constant). Any attempt to change that value at a later time results in an error.
>
> ```javascript
> var foo = true;
>
> if (foo) {
>     var a = 2;
>     const b = 3; // block-scoped to the containing `if`
>
>     a = 3; // just fine!
>     b = 4; // error!
> }
>
> console.log( a ); // 3
> console.log( b ); // ReferenceError!
> ```

所以`const`就是不变版的`let`。

---

## Chapter 4: Hoisting

> When you see `var a = 2;`, you probably think of that as one statement. But JavaScript actually thinks of it as two statements: `var a;` and `a = 2;`. The first statement, the declaration, is processed during the compilation phase. The second statement, the assignment, is left **in place** for the execution phase.

---

> Only the declarations themselves are hoisted, while any assignments or other executable logic are left *in place*. If hoisting were to re-arrange the executable logic of our code, that could wreak havoc.
>
> ```javascript
> foo();
>
> function foo() {
>     console.log( a ); // undefined
>
>     var a = 2;
> }
> ```

这里`foo`和`a`都在各自scope里被hoist了，但`foo()`和`a=2`（编译时）都还在原地。可以理解为hoist的作用就是为了省去C++那样需要在文件开头先声明很多变量和函数的工作（这个工作）。

---

> Function declarations are hoisted, as we just saw. But function expressions are not.
>
> ```javascript
> foo(); // not ReferenceError, but TypeError!
>
> var foo = function bar() {
>     // ...
> };
> ```

这里其实foo也是被hoist的，只不过是以`var`作为关键字来声明的，所以它的默认类型是undefined，而之前的foo是以`function`作为关键字来声明的，它的默认类型是function，而function类型是callable的，undefined则是uncallable的，所以在类型检查时会报`TypeError`的错。

---

> Both function declarations and variable declarations are hoisted. But a subtle detail (that *can* show up in code with multiple "duplicate" declarations) is that functions are hoisted first, and then variables.

知道就行，变量命名应该避免同名。

---

> Function declarations that appear inside of normal blocks typically hoist to the enclosing scope, rather than being conditional as this code implies:
>
> ```javascript
> foo(); // "b"
>
> var a = true;
> if (a) {
>    function foo() { console.log( "a" ); }
> }
> else {
>    function foo() { console.log( "b" ); }
> }
> ```
>
> However, it's important to note that this behavior is not reliable and is subject to change in future versions of JavaScript, so it's probably best to avoid declaring functions in blocks.

尽量避免特意去利用hoist这个特性来搞事情吧。

---

## Chapter 5: Scope Closure

> What I didn't know back then, what took me years to understand, and what I hope to impart to you presently, is this secret: **closure is all around you in JavaScript, you just have to recognize and embrace it.** Closures are not a special opt-in tool that you must learn new syntax and patterns for. No, closures are not even a weapon that you must learn to wield and master as Luke trained in The Force.
>
> Closures happen as a result of writing code that relies on lexical scope. They just happen. You do not even really have to intentionally create closures to take advantage of them. Closures are created and used for you all over your code. What you are *missing* is the proper mental context to recognize, embrace, and leverage closures for your own will.
>
> The enlightenment moment should be: **oh, closures are already occurring all over my code, I can finally see them now.** Understanding closures is like when Neo sees the Matrix for the first time.

文采不错~

---

> ```javascript
> function foo() {
>     var a = 2;
>
>     function bar() {
>         console.log( a );
>     }
>
>     return bar;
> }
>
> var baz = foo();
>
> baz(); // 2 -- Whoa, closure was just observed, man.
> ```
>
> After `foo()` executed, normally we would expect that the entirety of the inner scope of `foo()` would go away, because we know that the *Engine* employs a *Garbage Collector* that comes along and frees up memory once it's no longer in use. Since it would appear that the contents of `foo()` are no longer in use, it would seem natural that they should be considered *gone*.
>
> But the "magic" of closures does not let this happen. That inner scope is in fact *still* "in use", and thus does not go away. Who's using it? **The function bar() itself**.
>
> By virtue of where it was declared, `bar()` has a lexical scope closure over that inner scope of `foo()`, which keeps that scope alive for `bar()` to reference at any later time.
>
> **bar() still has a reference to that scope, and that reference is called closure.**

如果JavaScript的GC是通过指针引用计数来实现的话，也就是说闭包就是内嵌函数对外部函数添加了一次引用，导致GC无法对外部函数对象进行销毁（scope在编译器层面应该是跟对象绑定的，绑定的对象被销毁了，对应的scope里面的所有对象也都会被销毁？（需要深入研究一下编译原理~））。

---

> ```javascript
> for (var i=1; i<=5; i++) {
>     setTimeout( function timer(){
>         console.log( i );
>     }, i*1000 );
> }
> ```
> The spirit of this code snippet is that we would normally expect for the behavior to be that the numbers "1", "2", .. "5" would be printed out, one at a time, one per second, respectively.
>
> In fact, if you run this code, you get "6" printed out 5 times, at the one-second intervals.

看到这个例子突然想到之前疑惑的`let`会在每个loop进行re-bind的好处，原来这里就是它的一个好处了，利用`let`可以使得不同loop时的scope中的循环变量变成独立声明的变量（**It essentially turns a block into a scope that we can close over.**），而closure会记录调用时它所包含的scope，由于循环变量在每个scope是独立的，从而实现这里的输出1到5的目标。（这里用`var`声明循环对象，其实是声明了一个for循环外部的scope内的对象，所以当`timer`被invoke时，它通过自内向外寻找找到的是外部的变量`i`；而改为`let`声明循环对象，这个对象是只存在于每个循环的block scope内部的。）

---

> ```javascript
> function CoolModule() {
>     var something = "cool";
>     var another = [1, 2, 3];
>
>     function doSomething() {
>         console.log( something );
>     }
>
>     function doAnother() {
>         console.log( another.join( " ! " ) );
>     }
>
>     return {
>         doSomething: doSomething,
>         doAnother: doAnother
>     };
> }
>
> var foo = CoolModule();
>
> foo.doSomething(); // cool
> foo.doAnother(); // 1 ! 2 ! 3
> ```
>
> This is the pattern in JavaScript we call *module*. The most common way of implementing the module pattern is often called "Revealing Module", and it's the variation we present here.

感觉和C++或Python里面的“类”有点像啊，难道JavaScript里面没有“类”的概念？但和类比较的话功能又弱了一些，至少module现在没有看到“继承”的概念。从另一个角度看和Python的module或package概念比较像（package通过`__init__.py`文件来暴露函数等接口，类似这里的return）。

---

> To state it more simply, there are two "requirements" for the module pattern to be exercised:
>
> 1. There must be an outer enclosing function, and it must be invoked at least once (each time creates a new module instance).
> 2. The enclosing function must return back at least one inner function, so that this inner function has closure over the private scope, and can access and/or modify that private state.

---

> ES6 adds first-class syntax support for the concept of modules. When loaded via the module system, ES6 treats a file as a separate module. Each module can both import other modules or specific API members, as well export their own public API members.
>
> **Note:** Function-based modules aren't a statically recognized pattern (something the compiler knows about), so their API semantics aren't considered until run-time. That is, you can actually modify a module's API during the run-time (see earlier `publicAPI` discussion).
>
> By contrast, ES6 Module APIs are static (the APIs don't change at run-time).
>
> Consider:
>
> **bar.js**
>
> ```javascript
> function hello(who) {
>     return "Let me introduce: " + who;
> }
>
> export hello;
> ```
>
> **foo.js**
>
> ```javascript
> // import only `hello()` from the "bar" module
> import hello from "bar";
>
> var hungry = "hippo";
>
> function awesome() {
>     console.log(
>         hello( hungry ).toUpperCase()
>     );
> }
> export awesome;
> ```
>
> To use "foo" and "bar" modules:
>
>
> ```javascript
> // import the entire "foo" and "bar" modules
> module foo from "foo";
> module bar from "bar";
>
> console.log(
>     bar.hello( "rhino" )
> ); // Let me introduce: rhino
>
> foo.awesome(); // LET ME INTRODUCE: HIPPO
> ```

哈？越来越像Python的module了。