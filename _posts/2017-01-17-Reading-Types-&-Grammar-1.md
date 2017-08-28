---
layout: post
title: "Reading &lt;Types & Grammar&gt; - 1"
category: Javascript
tags: [读书笔记, You Dont Know JS]
date: 2017-01-17
---

## Chapter 1: Types

> Bah! We're going to use this rough definition (the same one that seems to drive the wording of the spec): a *type* is an intrinsic, built-in set of characteristics that uniquely identifies the behavior of a particular value and distinguishes it from other values, both to the engine **and to the developer**.

---

> Armed with a full understanding of JavaScript types, we're aiming to illustrate why coercion's *bad reputation* is largely overhyped and somewhat undeserved -- to flip your perspective, to seeing coercion's power and usefulness.

We'll see.

---

> If you want to test for a `null` value using its type, you need a compound condition:
>
> ```javascript
> var a = null;
>
> (!a && typeof a === "object"); // true
> ```
>
> `null` is the only primitive value that is "falsy" but that also returns `"object"` from the `typeof` check.

---

> It's tempting for most developers to think of the word "undefined" and think of it as a synonym for "undeclared." However, in JS, these two concepts are quite different.
>
> An "undefined" variable is one that has been declared in the accessible scope, but *at the moment* has no other value in it. By contrast, an "undeclared" variable is one that has not been formally declared in the accessible scope.
>
> Consider:
>
> ```javascript
> var a;
>
> a; // undefined
> b; // ReferenceError: b is not defined
> ```

Error message返回"b is not declared"更准确。

---

> There's also a special behavior associated with `typeof` as it relates to undeclared variables that even further reinforces the confusion. Consider:
>
> ```javascript
> var a;
>
> typeof a; // "undefined"
>
> typeof b; // "undefined"
> ```
>
> The `typeof` operator returns `"undefined"` even for "undeclared" (or "not defined") variables.

可以用`typeof`来检查一个变量是否被声明了（难道没有`try..catch`么）。

---

> Another way of doing these checks against global variables but without the safety guard feature of `typeof` is to observe that all global variables are also properties of the global object, which in the browser is basically the `window`object. So, the above checks could have been done (quite safely) as:
>
> ```javascript
> if (window.DEBUG) {
>     // ..
> }
>
> if (!window.atob) {
>     // ..
> }
> ```
>
> Unlike referencing undeclared variables, there is no `ReferenceError` thrown if you try to access an object property (even on the global `window` object) that doesn't exist.

检查是否被声明的另一个思路，但只能对全局变量有用。

<!--break-->

---

## Chapter 2: Values

> ### Array-Likes
>
> One very common way to make such a conversion is to borrow the `slice(..)` utility against the value:
>
> ```javascript
> function foo() {
>     var arr = Array.prototype.slice.call( arguments );
>     arr.push( "bam" );
>     console.log( arr );
> }
>
> foo( "bar", "baz" ); // ["bar","baz","bam"]
> ```
>
> If `slice()` is called without any other parameters, as it effectively is in the above snippet, the default values for its parameters have the effect of duplicating the `array` (or, in this case, `array`-like).
>
> As of ES6, there's also a built-in utility called `Array.from(..)` that can do the same task:
>
> ```javascript
> ...
> var arr = Array.from( arguments );
> ...
> ```

这个转换方法官方文档也有写，`slice`方法本身会返回一个新的对象，对应Python的`a[1:2]`其实也是返回了一个新的list。

---

> JavaScript `string`s are immutable, while `array`s are quite mutable. Moreover, the `a[1]` character position access form was not always widely valid JavaScript. Older versions of IE did not allow that syntax (but now they do). Instead, the *correct* approach has been `a.charAt(1)`.

Python里面也一样（如果把Array看做是Python的list的话）。

---

> Many of the `array` methods that could be helpful when dealing with `string`s are not actually available for them, but we can "borrow" non-mutation `array` methods against our `string`:
>
> ```javascript
> var a = "foo";
>
> a.join;         // undefined
> a.map;          // undefined
>
> var c = Array.prototype.join.call( a, "-" );
> var d = Array.prototype.map.call( a, function(v){
>     return v.toUpperCase() + ".";
> } ).join( "" );
>
> c;              // "f-o-o"
> d;              // "F.O.O."
> ```

注意是只有non-mutation `array` methods才能这么做（不懂为什么标准库没有实现这些~）。

---

> ### Numbers
>
> JavaScript has just one numeric type: `number`. This type includes both "integer" values and fractional decimal numbers. I say "integer" in quotes because it's long been a criticism of JS that there are not true integers, as there are in other languages. That may change at some point in the future, but for now, we just have `number`s for everything.
>
> So, in JS, an "integer" is just a value that has no fractional decimal value. That is, `42.0` is as much an "integer" as `42`.

也是惊了个讶了。不过想想JS的代码内存消耗也就那么些，这么糙的后果可能也不算大。

---

> The most (in)famous side effect of using binary floating-point numbers (which, remember, is true of **all** languages that use IEEE 754 -- not *just* JavaScript as many assume/pretend) is:
>
> ```javascript
> 0.1 + 0.2 === 0.3; // false
> ```
>
> Mathematically, we know that statement should be `true`. Why is it `false`?
>
> Simply put, the representations for `0.1` and `0.2` in binary floating-point are not exact, so when they are added, the result is not exactly `0.3`. It's **really** close: `0.30000000000000004`, but if your comparison fails, "close" is irrelevant.

也算是经典面试题了吧，浮点数没法直接比较值是否相等。

> What if we *did* need to compare two `number`s, like `0.1 + 0.2` to `0.3`, knowing that the simple equality test fails?
>
> The most commonly accepted practice is to use a tiny "rounding error" value as the *tolerance* for comparison. This tiny value is often called "machine epsilon," which is commonly `2^-52` (`2.220446049250313e-16`) for the kind of `number`s in JavaScript.
>
> As of ES6, `Number.EPSILON` is predefined with this tolerance value, so you'd want to use it, but you can safely polyfill the definition for pre-ES6:
>
> ```javascript
> if (!Number.EPSILON) {
>     Number.EPSILON = Math.pow(2,-52);
> }
> ```

所以要比较两个浮点数是否相等，其实是比较他们是否足够接近，足够接近的依据是根据浮点数生成会产生的误差大小来定的，也就是这里的`Number.EPSION`。

---

> The maximum integer that can "safely" be represented (that is, there's a guarantee that the requested value is actually representable unambiguously) is `2^53 - 1`, which is `9007199254740991`. If you insert your commas, you'll see that this is just over 9 quadrillion. So that's pretty darn big for `number`s to range up to.
>
> This value is actually automatically predefined in ES6, as `Number.MAX_SAFE_INTEGER`. Unsurprisingly, there's a minimum value, `-9007199254740991`, and it's defined in ES6 as `Number.MIN_SAFE_INTEGER`.

这里的安全是指编译器在生成这个数字时不会产生误差，这个误差其实和浮点数产生的误差是一个东西（在这里浮点数和整型的区别就是小数点放哪嘛）。注意64位的整数在这里是“不安全”的。

---

> ### Special Values
>
> The expression `void ___` "voids" out any value, so that the result of the expression is always the `undefined` value. It doesn't modify the existing value; it just ensures that no value comes back from the operator expression.
>
> ```javascript
> var a = 42;
>
> console.log( void a, a ); // undefined 42
> ```

`void`的作用就是让本来结果有差别的变成了统一的`undefined`。

---

> `NaN` is a very special value in that it's never equal to another `NaN` value (i.e., it's never equal to itself). It's the only value, in fact, that is not reflexive (without the Identity characteristic `x === x`). So, `NaN !== NaN`. A bit strange, huh?
>
> So how *do* we test for it, if we can't compare to `NaN` (since that comparison would always fail)?
>
> ```javascript
> var a = 2 / "foo";
>
> isNaN( a ); // true
> ```
>
> Easy enough, right? We use the built-in global utility called `isNaN(..)` and it tells us if the value is `NaN` or not. Problem solved!
>
> Not so fast.
>
> The `isNaN(..)` utility has a fatal flaw. It appears it tried to take the meaning of `NaN` ("Not a Number") too literally -- that its job is basically: "test if the thing passed in is either not a `number` or is a `number`." But that's not quite accurate.
>
> ```javascript
> var a = 2 / "foo";
> var b = "foo";
>
> a; // NaN
> b; // "foo"
>
> window.isNaN( a ); // true
> window.isNaN( b ); // true -- ouch!
> ```
>
> Clearly, `"foo"` is literally *not a number*, but it's definitely not the `NaN` value either! This bug has been in JS since the very beginning (over 19 years of *ouch*).
>
> As of ES6, finally a replacement utility has been provided: `Number.isNaN(..)`.

又一个JavaScript上古bug！所以，1. 不能用`===`来比较`NaN`；2. 不要用`isNaN`（而是用`Number.isNaN`）。

---

> Once you overflow to either one of the *infinities*, however, there's no going back. In other words, in an almost poetic sense, you can go from finite to infinite but not from infinite back to finite.
>
> It's almost philosophical to ask: "What is infinity divided by infinity". Our naive brains would likely say "1" or maybe "infinity." Turns out neither is true. Both mathematically and in JavaScript, `Infinity / Infinity` is not a defined operation. In JS, this results in `NaN`.
>
> But what about any positive finite `number` divided by `Infinity`? That's easy! `0`. And what about a negative finite `number` divided by `Infinity`? Keep reading!

补习数学常识。

---

> While it may confuse the mathematics-minded reader, JavaScript has both a normal zero `0` (otherwise known as a positive zero `+0`) *and* a negative zero `-0`.
>
> There are certain applications where developers use the magnitude of a value to represent one piece of information (like speed of movement per animation frame) and the sign of that `number` to represent another piece of information (like the direction of that movement).
>
> In those applications, as one example, if a variable arrives at zero and it loses its sign, then you would lose the information of what direction it was moving in before it arrived at zero. Preserving the sign of the zero prevents potentially unwanted information loss.

感觉举的例子其实也就少写两行代码而已，这个特性并没有多必要吧？

---

> As of ES6, there's a new utility that can be used to test two values for absolute equality, without any of these exceptions. It's called `Object.is(..)`:
>
> ```javascript
> var a = 2 / "foo";
> var b = -3 * 0;
>
> Object.is( a, NaN );    // true
> Object.is( b, -0 );     // true
>
> Object.is( b, 0 );      // false
> ```
>
> There's a pretty simple polyfill for `Object.is(..)` for pre-ES6 environments:
>
> ```javascript
> if (!Object.is) {
>     Object.is = function(v1, v2) {
>         // test for `-0`
>         if (v1 === 0 && v2 === 0) {
>             return 1 / v1 === 1 / v2;
>         }
>         // test for `NaN`
>         if (v1 !== v1) {
>             return v2 !== v2;
>         }
>         // everything else
>         return v1 === v2;
>     };
> }
> ```

从polyfill来看（要搞清楚实现多看polyfill~），`Object.is(..)`做的事情就是整合了`-0`和`NaN`这类特殊的对象的比较方法，对大部分对象而言，相当于`===`。

---

> ### Value vs. Reference
>
> A reference in JS points at a (shared) **value**, so if you have 10 different references, they are all always distinct references to a single shared value; **none of them are references/pointers to each other.**
>
> Moreover, in JavaScript, there are no syntactic hints that control value vs. reference assignment/passing. Instead, the *type* of the value *solely* controls whether that value will be assigned by value-copy or by reference-copy.
>
> Let's illustrate:
>
> ```javascript
> var a = 2;
> var b = a; // `b` is always a copy of the value in `a`
> b++;
> a; // 2
> b; // 3
>
> var c = [1,2,3];
> var d = c; // `d` is a reference to the shared `[1,2,3]` value
> d.push( 4 );
> c; // [1,2,3,4]
> d; // [1,2,3,4]
> ```
>
> Simple values (aka scalar primitives) are *always* assigned/passed by value-copy: `null`, `undefined`, `string`, `number`, `boolean`, and ES6's `symbol`.
>
> Compound values -- `object`s (including `array`s, and all boxed object wrappers -- see Chapter 3) and `function`s -- *always* create a copy of the reference on assignment or passing.

在Python里区别是值传递还是引用传递也是类似的（可变对象是引用传递，不可变对象是值传递），当然这只是表象，本质上Python中所有的变量存储的都是引用：

```python
a = 2
b = a
b is a  # True
b += 1  # a=2, b=3

c = [1,2]
d = c
c.append(3) # c=[1,2,3], d=[1,2,3] 
```

所以上述`b += 1`操作后，其实是给b重新赋予了一个引用到新的对象（因为它指向的对象是不可变的，要发生变化只能是指向另外一个对象）。Javascript这点和Python是一致的。

---

> Since references point to the values themselves and not to the variables, you cannot use one reference to change where another reference is pointed:
>
> ```javascript
> var a = [1,2,3];
> var b = a;
> a; // [1,2,3]
> b; // [1,2,3]
>
> // later
> b = [4,5,6];
> a; // [1,2,3]
> b; // [4,5,6]
> ```
>
> When we make the assignment `b = [4,5,6]`, we are doing absolutely nothing to affect *where* `a` is still referencing (`[1,2,3]`). To do that, `b` would have to be a pointer to `a` rather than a reference to the `array` -- but no such capability exists in JS!

也就是JavaScript（Python也一样）不存在指向某个变量的变量，所有变量均指向某个值。（想起来C++中被指针支配的恐惧了吗。。）

---

## Chapter 3: Natives

> ### Internal [[Class]]
>
> Values that are `typeof` `"object"` (such as an array) are additionally tagged with an internal `[[Class]]` property (think of this more as an internal *class*ification rather than related to classes from traditional class-oriented coding). This property cannot be accessed directly, but can generally be revealed indirectly by borrowing the default `Object.prototype.toString(..)` method called against the value. For example:
>
> ```javascript
> Object.prototype.toString.call( [1,2,3] );          // "[object Array]"
>
> Object.prototype.toString.call( /regex-literal/i ); // "[object RegExp]"
> ```

通过internal [[Class]]属性可以知道对象具体的类型。

---

> ### Boxing Wrappers
>
> In general, there's basically no reason to use the object form directly. It's better to just let the boxing happen implicitly where necessary. In other words, never do things like `new String("abc")`, `new Number(42)`, etc -- always prefer using the literal primitive values `"abc"` and `42`.

原因在于既简洁又高效（编译器早已针对地优化过了）。

---

> ### Unboxing
>
> If you have an object wrapper and you want to get the underlying primitive value out, you can use the `valueOf()`method:
>
> ```javascript
> var a = new String( "abc" );
> var b = new Number( 42 );
> var c = new Boolean( true );
>
> a.valueOf(); // "abc"
> b.valueOf(); // 42
> c.valueOf(); // true
> ```

---

> ### Natives as Constructors
>
> The `Array` constructor has a special form where if only one `number` argument is passed, instead of providing that value as *contents* of the array, it's taken as a length to "presize the array" (well, sorta).
>
> ```javascript
> var a = new Array( 3 );
>
> a.length; // 3
> a;
>
> var b = new Array( 1, 2, 3 );
> b; // [1, 2, 3]
> ```

总之，

1. 不要使用`Array`来新建一个数组对象，而是直接用`[]`。
2. 使用`Array`可以新建一个空的数组（相当于只修改了`a.length`，而其内容仍是`[]`），空数组可能会引发一些奇怪的事情（因为有些方法是根据数组长度来迭代的）。

---

> Bottom line: **never ever, under any circumstances**, should you intentionally create and use these exotic empty-slot arrays. Just don't do it. They're nuts.

好吧，所以记住上面的第一条即可。（另外，`delete`也能把数组的某个元素删掉变成empty-slot，需注意。）

---

> The `Object(..)`/`Function(..)`/`RegExp(..)` constructors are also generally optional (and thus should usually be avoided unless specifically called for).

> The `Function` constructor is helpful only in the rarest of cases, where you need to dynamically define a function's parameters and/or its function body. **Do not just treat Function(..) as an alternate form of eval(..).** You will almost never need to dynamically define a function in this way.

能用literal form就别用constructor来新建对象了。

---

> The `Date(..)` and `Error(..)` native constructors are much more useful than the other natives, because there is no literal form for either.

没有literal form的对象那就只能用对应的constructor来新建对象了。

---

> `Function.prototype` being an empty function, `RegExp.prototype` being an "empty" (e.g., non-matching) regex, and `Array.prototype` being an empty array, make them all nice "default" values to assign to variables if those variables wouldn't already have had a value of the proper type.

了解即可，最好不要使用这个特性（不小心可能会修改到这些原型）。