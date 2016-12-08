---
layout: post
title: "Reading &lt;this & Object Prototypes&gt; - 1"
category: Javascript
tags: [读书笔记, You Dont Know JS]
date: 2016-12-08
---

## Chapter 1: `this` Or That?

> Let's try to illustrate the motivation and utility of `this`:
>
> ```javascript
> function identify() {
>     return this.name.toUpperCase();
> }
>
> function speak() {
>     var greeting = "Hello, I'm " + identify.call( this );
>     console.log( greeting );
> }
>
> var me = {
>     name: "Kyle"
> };
>
> var you = {
>     name: "Reader"
> };
>
> identify.call( me ); // KYLE
> identify.call( you ); // READER
>
> speak.call( me ); // Hello, I'm KYLE
> speak.call( you ); // Hello, I'm READER
> ```

`this`指向了函数的调用者，而不是函数自身（C++的`this`/Python的`self`指向类（的实例）自身使得类成员之间可以建立连接，这里一个单独的函数显然不需要这个作用）。

---

> The `this` mechanism provides a more elegant way of implicitly "passing along" an object reference, leading to cleaner API design and easier re-use.
>
> The more complex your usage pattern is, the more clearly you'll see that passing context around as an explicit parameter is often messier than passing around a `this` context. When we explore objects and prototypes, you will see the helpfulness of a collection of functions being able to automatically reference the proper context object.

感觉`this`的作用在JavaScript中有点类似“类”的多态，即根据不同调用者来产生不同的效果，但它比“类”使用范围更广（多态需要基类相同，而这里的调用对调用者没有什么限制）。

---

> It is true that internally, scope is kind of like an object with properties for each of the available identifiers. But the scope "object" is not accessible to JavaScript code. It's an inner part of the *Engine*'s implementation.

---

> We said earlier that `this` is not an author-time binding but a runtime binding. It is contextual based on the conditions of the function's invocation. `this` binding has nothing to do with where a function is declared, but has instead everything to do with the manner in which the function is called.
>
> When a function is invoked, an activation record, otherwise known as an execution context, is created. This record contains information about where the function was called from (the call-stack), *how* the function was invoked, what parameters were passed, etc. One of the properties of this record is the `this` reference which will be used for the duration of that function's execution.

JavaScript的`this`存放在调用栈里（显而易见嘛）。

---

## Chapter 2: `this` All Makes Sense Now!

> ```javascript
> function foo() {
>     console.log( this.a );
> }
>
> var a = 2;
>
> foo(); // 2
> ```
>
> In our snippet, `foo()` is called with a plain, un-decorated function reference. None of the other rules we will demonstrate will apply here, so the *default binding* applies instead.

**规则1**：默认情况`this`指向`global`对象。

---

> If `strict mode` is in effect, the global object is not eligible for the *default binding*, so the `this` is instead set to `undefined`.
>
> ```javascript
> function foo() {
>     "use strict";
>
>     console.log( this.a );
> }
>
> var a = 2;
>
> foo(); // TypeError: `this` is `undefined`
> ```

严格模式下禁用了默认的`this`绑定（默认的这个行为我是暂时没看到啥好处，所以，怎么严格怎么来吧）。

---

> Another rule to consider is: does the call-site have a context object, also referred to as an owning or containing object.
>
> Consider:
>
> ```javascript
> function foo() {
>     console.log( this.a );
> }
>
> var obj = {
>     a: 2,
>     foo: foo
> };
>
> obj.foo(); // 2
> ```

**规则2**：如果被调函数被调用时是作为某个对象的属性存在的，则`this`指向包含被调函数的那个对象。

---

> One of the most common frustrations that `this` binding creates is when an *implicitly bound* function loses that binding, which usually means it falls back to the *default binding*, of either the global object or `undefined`, depending on `strict mode`.
>
> ```javascript
> function foo() {
>     console.log( this.a );
> }
>
> function doFoo(fn) {
>     // `fn` is just another reference to `foo`
>
>     fn(); // <-- call-site!
> }
>
> var obj = {
>     a: 2,
>     foo: foo
> };
>
> var a = "oops, global"; // `a` also property on global object
>
> doFoo( obj.foo ); // "oops, global"
> ```

这个坑还是要稍微注意一下的，也就是说只有**直接调用**时那个对象包含被调函数时，规则2才生效。把这个例子稍作变化，可以看到为啥强调**直接调用**：

```javascript
function foo() {
    console.log( this.a );
}

function doFoo(fn) {
    // `fn` is just another reference to `foo`
    var obj2 ={
        a: 111,
        fn: fn
    };
    obj2.fn(); // <-- call-site!
}

var obj = {
    a: 2,
    foo: foo
};

var a = "oops, global"; // `a` also property on global object

doFoo( obj.foo ); // "111"
```

---

> But, what if you want to force a function call to use a particular object for the `this` binding, without putting a property function reference on the object?
>
> Consider:
>
> ```javascript
> function foo() {
>     console.log( this.a );
> }
>
> var obj = {
>     a: 2
> };
>
> foo.call( obj ); // 2
> ```
>
> **Note:** With respect to `this` binding, `call(..)` and `apply(..)` are identical. They *do* behave differently with their additional parameters, but that's not something we care about presently.

**规则3**：使用`<func>.call`或`<func>.apply`方法可以显式地绑定`this`到指定对象。这里的`call`和`apply`方法可以理解为类似于Python里的魔法方法（没有特指某个魔法方法，Python的`__call__`显然和这里不一样嘛）。

---

> If you pass a simple primitive value (of type `string`, `boolean`, or `number`) as the `this` binding, the primitive value is wrapped in its object-form (`new String(..)`, `new Boolean(..)`, or `new Number(..)`, respectively). This is often referred to as "boxing".

书上没有例子，我来找一个：

```javascript
function foo() {
    console.log( this instanceof String );
}

var obj = "abc";

console.log(obj instanceof String);  // false

foo.call( obj );  // true
```

可以看到这里在`this`绑定的时候做了隐式的转换。

---

> Consider:
>
> ```javascript
> function foo() {
>     console.log( this.a );
> }
>
> var obj = {
>     a: 2
> };
>
> var bar = function() {
>     foo.call( obj );
> };
>
> bar(); // 2
> setTimeout( bar, 100 ); // 2
>
> // `bar` hard binds `foo`'s `this` to `obj`
> // so that it cannot be overriden
> bar.call( window ); // 2
> ```
>
> Let's examine how this variation works. We create a function `bar()` which, internally, manually calls `foo.call(obj)`, thereby forcibly invoking `foo` with `obj` binding for `this`. No matter how you later invoke the function `bar`, it will always manually invoke `foo` with `obj`. This binding is both explicit and strong, so we call it *hard binding*.

**规则3.1**：使用`<func>.bind`方法来持久地绑定`this`到指定对象（“持久”是相对`<func>.call`（一次性绑定）而言的，即绑定之后无论怎么调用该方法`this`都指向绑定的对象，绑定后再通过`<func>.bind`方法是可以更换绑定对象的）。

<!--break-->

---

> The most typical way to wrap a function with a *hard binding* creates a pass-thru of any arguments passed and any return value received:
>
> ```javascript
> function foo(something) {
>     console.log( this.a, something );
>     return this.a + something;
> }
>
> var obj = {
>     a: 2
> };
>
> var bar = function() {
>     return foo.apply( obj, arguments );
> };
>
> var b = bar( 3 ); // 2 3
> console.log( b ); // 5
> ```
>
> Since *hard binding* is such a common pattern, it's provided with a built-in utility as of ES5: `Function.prototype.bind`, and it's used like this:
>
> ```javascript
> function foo(something) {
>     console.log( this.a, something );
>     return this.a + something;
> }
>
> var obj = {
>     a: 2
> };
>
> var bar = foo.bind( obj );
>
> var b = bar( 3 ); // 2 3
> console.log( b ); // 5
> ```

避免重复造轮子，`<func>.bind`返回的是原函数基础上绑定了一个对象的新的函数。注意第一个例子里的`arguments`是JavaScript的关键字，JavaScript里每个函数都有这么一个叫`arguments`的对象，它记录了函数的输入，并且与函数声明时的输入参数无关（JavaScript对于函数输入这么不严谨也是蛮奇怪的~）：

```javascript
function foo(a, b) {
    console.log(arguments);
}

foo('abc');  // { '0': 'abc' }
foo(1, 2, 3);  // { '0': 1, '1': 2, '2': 3 }
```

---

> Many libraries' functions, and indeed many new built-in functions in the JavaScript language and host environment, provide an optional parameter, usually called "context", which is designed as a work-around for you not having to use `bind(..)` to ensure your callback function uses a particular `this`.
>
> For instance:
>
> ```javascript
> function foo(el) {
>     console.log( el, this.id );
> }
>
> var obj = {
>     id: "awesome"
> };
>
> // use `obj` as `this` for `foo(..)` calls
> [1, 2, 3].forEach( foo, obj ); // 1 awesome  2 awesome  3 awesome
> ```
>
> Internally, these various functions almost certainly use *explicit binding* via `call(..)` or `apply(..)`, saving you the trouble.

这里例子里的`<Array>.forEach`方法帮你做了绑定的工作。脑补下它的实现（机智如我）：

```javascript
function foo(el) {
    console.log( el, this.id );
}

var obj = {
    id: "awesome"
};

function forEach2(func, obj) {
    for (let i=0;i<this.length;i++){
        let item = this[i];
        func.apply(obj, [item]);
    }
}

var array = [1, 2, 3];
array.forEach2 = forEach2;
array.forEach2( foo, obj ); // 1 awesome  2 awesome  3 awesome
```

---

> JavaScript has a `new` operator, and the code pattern to use it looks basically identical to what we see in those class-oriented languages; most developers assume that JavaScript's mechanism is doing something similar. However, there really is *no connection* to class-oriented functionality implied by `new` usage in JS.
>
> First, let's re-define what a "constructor" in JavaScript is. In JS, constructors are **just functions** that happen to be called with the `new` operator in front of them. They are not attached to classes, nor are they instantiating a class. They are not even special types of functions. They're just regular functions that are, in essence, hijacked by the use of `new` in their invocation.
>
> This is an important but subtle distinction: there's really no such thing as "constructor functions", but rather construction calls *of* functions.

JavaScript的`new`和C++的`new`或Python的`__new__`可不一样。

---

> When a function is invoked with `new` in front of it, otherwise known as a constructor call, the following things are done automatically:
>
> 1. a brand new object is created (aka, constructed) out of thin air
> 2. *the newly constructed object is [[Prototype]]-linked*
> 3. the newly constructed object is set as the `this` binding for that function call
> 4. unless the function returns its own alternate **object**, the `new`-invoked function call will *automatically* return the newly constructed object.
>
> Consider this code:
>
> ```javascript
> function foo(a) {
>     this.a = a;
> }
>
> var bar = new foo( 2 );
> console.log( bar.a ); // 2
> ```

这么看来JavaScript的`new`和其他语言唯一相同的点是也会生成一个新的对象。

**规则4**：使用`new`来绑定`this`到新生成的对象。

---

> By that reasoning, it would seem obvious to assume that *hard binding* (which is a form of *explicit binding*) is more precedent than *new binding*, and thus cannot be overridden with `new`.
>
> Let's check:
>
> ```javascript
> function foo(something) {
>     this.a = something;
> }
>
> var obj1 = {};
>
> var bar = foo.bind( obj1 );
> bar( 2 );
> console.log( obj1.a ); // 2
>
> var baz = new bar( 3 );
> console.log( obj1.a ); // 2
> console.log( baz.a ); // 3
> ```
>
> Whoa! `bar` is hard-bound against `obj1`, but `new bar(3)` did **not** change `obj1.a` to be `3` as we would have expected. Instead, the *hard bound* (to `obj1`) call to `bar(..)` **is** able to be overridden with `new`. Since `new` was applied, we got the newly created object back, which we named `baz`, and we see in fact that `baz.a` has the value `3`.

这边看得有点晕，简单说就是`bar`方法通过bind绑定后其中的`this`是一直指向`obj1`的，所以每次调用`bar`方法，`obj1.a`也跟着改变，而`baz`对象通过new和`bar`方法绑定时，可以看到这次`obj1.a`并没有继续跟着改变，也就是说通过`new`来绑定时，`this`会暂时指向新建的对象，而非之前持久绑定的对象（但也仅限`new`这一句话，后面再调用`bar`，`obj1`还是会跟着变的）。

---

> Why is `new` being able to override *hard binding* useful?
>
> The primary reason for this behavior is to create a function (that can be used with `new` for constructing objects) that essentially ignores the `this` *hard binding* but which presets some or all of the function's arguments. One of the capabilities of `bind(..)` is that any arguments passed after the first `this` binding argument are defaulted as standard arguments to the underlying function (technically called "partial application", which is a subset of "currying").
>
> For example:
>
> ```javascript
> function foo(p1, p2) {
>     this.val = p1 + p2;
> }
>
> // using `null` here because we don't care about
> // the `this` hard-binding in this scenario, and
> // it will be overridden by the `new` call anyway!
> var bar = foo.bind( null, "p1" );
>
> var baz = new bar( "p2" );
>
> baz.val; // p1p2
> ```

这里要注意的是bind函数的函数声明是`Function.prototype.bind = function(thisArg,arg) {};`，也就是说它的输入除了第一个为要绑定的对象外，还可以放入绑定函数的参数，而这些参数也是被持久绑定的。有了这个特性，使用bind就像是把原来的函数变成了“元函数”（meta function）一样（这概念我编的，近似Python的meta class），用一个函数就可以派生出许多和原函数有关的函数（又感觉有点像类的继承嘛）。

关于“currying”和“partial application”的区别，可以参考这篇[文章](https://medium.com/javascript-scene/curry-or-partial-application-8150044c78b8#.2bwxlftpd)。

---

> Ask these questions in this order, and stop when the first rule applies.
>
> 1. Is the function called with `new` (**new binding**)? If so, `this` is the newly constructed object.
>
>    `var bar = new foo()`
>
> 2. Is the function called with `call` or `apply` (**explicit binding**), even hidden inside a `bind` *hard binding*? If so, `this`is the explicitly specified object.
>
>    `var bar = foo.call( obj2 )`
>
> 3. Is the function called with a context (**implicit binding**), otherwise known as an owning or containing object? If so, `this` is *that* context object.
>
>    `var bar = obj1.foo()`
>
> 4. Otherwise, default the `this` (**default binding**). If in `strict mode`, pick `undefined`, otherwise pick the `global`object.
>
>    `var bar = foo()`

很好的总结。

---

> ## Binding Exceptions
>
> If you pass `null` or `undefined` as a `this` binding parameter to `call`, `apply`, or `bind`, those values are effectively ignored, and instead the *default binding* rule applies to the invocation.
>
> It's quite common to use `apply(..)` for spreading out arrays of values as parameters to a function call. Similarly, `bind(..)` can curry parameters (pre-set values), which can be very helpful.
>
> ```javascript
> function foo(a,b) {
>     console.log( "a:" + a + ", b:" + b );
> }
>
> // spreading out array as parameters
> foo.apply( null, [2, 3] ); // a:2, b:3
>
> // currying with `bind(..)`
> var bar = foo.bind( null, 2 );
> bar( 3 ); // a:2, b:3
> ```

想要用一个array作为函数的输入居然要这样做，再次感叹Python的函数参数特性的强大。

而且使用`null`绑定到`this`可能会导致global scope的对象发生变化，产生风险，因此（非严格模式下）不推荐这样做。严格模式下因为默认绑定为一个`undefined`对象，所以倒还好。

---

> ES6 has the `...` spread operator which will let you syntactically "spread out" an array as parameters without needing `apply(..)`, such as `foo(...[1,2])`, which amounts to `foo(1,2)` -- syntactically avoiding a `this` binding if it's unnecessary. Unfortunately, there's no ES6 syntactic substitute for currying, so the `this` parameter of the `bind(..)` call still needs attention.

`...`都成为语法了！为啥不学Python的`foo(*[1,2])`呢。

---

> Perhaps a somewhat "safer" practice is to pass a specifically set up object for `this` which is guaranteed not to be an object that can create problematic side effects in your program.
>
> Whatever you call it, the easiest way to set it up as **totally empty** is `Object.create(null)` (see Chapter 5). `Object.create(null)` is similar to `{ }`, but without the delegation to `Object.prototype`, so it's "more empty" than just `{ }`.
>
> ```javascript
> function foo(a,b) {
>     console.log( "a:" + a + ", b:" + b );
> }
>
> // our DMZ empty object
> var ø = Object.create( null );
>
> // spreading out array as parameters
> foo.apply( ø, [2, 3] ); // a:2, b:3
>
> // currying with `bind(..)`
> var bar = foo.bind( ø, 2 );
> bar( 3 ); // a:2, b:3
> ```

这里为了既不影响全局作用域又要柯理化也是蛮拼的。注意JavaScript里面可以用unicode作为变量名的，正如这里的空集符号`ø` (type with option+`o`)。

---

> One of the most common ways that *indirect references* occur is from an assignment:
>
> ```javascript
> function foo() {
>     console.log( this.a );
> }
>
> var a = 2;
> var o = { a: 3, foo: foo };
> var p = { a: 4 };
>
> o.foo(); // 3
> (p.foo = o.foo)(); // 2
> ```
>
> The *result value* of the assignment expression `p.foo = o.foo` is a reference to just the underlying function object. As such, the effective call-site is just `foo()`, not `p.foo()` or `o.foo()` as you might expect.

这里有一个要注意的点是JavaScript里面赋值语句居然有返回值！这可是在Python或C++闻所未闻的（至少Python里面对赋值语句再赋值是非法操作）。

好吧，实验了下，我大概理解了，这个效果其实就类似于连等号，不过这个语法看着像是赋值语句的返回值。

```javascript
var a;
var b = (a = 2);
console.log(b); // 2
```

---

> Normal functions abide by the 4 rules we just covered. But ES6 introduces a special kind of function that does not use these rules: arrow-function.
>
> Arrow-functions are signified not by the `function` keyword, but by the `=>` so called "fat arrow" operator. Instead of using the four standard `this` rules, arrow-functions adopt the `this` binding from the enclosing (function or global) scope.
>
> Let's illustrate arrow-function lexical scope:
>
> ```javascript
> function foo() {
>     // return an arrow function
>     return (a) => {
>         // `this` here is lexically adopted from `foo()`
>         console.log( this.a );
>     };
> }
>
> var obj1 = {
>     a: 2
> };
>
> var obj2 = {
>     a: 3
> };
>
> var bar = foo.call( obj1 );
> bar.call( obj2 ); // 2, not 3!
> ```
> The arrow-function created in `foo()` lexically captures whatever `foo()`s `this` is at its call-time. Since `foo()` was `this`-bound to `obj1`, `bar` (a reference to the returned arrow-function) will also be `this`-bound to `obj1`. The lexical binding of an arrow-function cannot be overridden (even with `new`!).

“arrow-function”中的`this`是和它所属的scope的`this`绑定的，且无法被覆盖。但这个特性其实打破了之前关于`this`的规则，所以书中不建议这两种规则混用（“arrow-function”这个语法糖不好吃啊）。
