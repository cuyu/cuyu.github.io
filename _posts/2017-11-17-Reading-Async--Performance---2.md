---
layout: post
title: "Reading &lt;Async &amp; Performance&gt; - 2"
category: Javascript
tags: [You Dont Know JS, 读书笔记]
date: 2017-11-17
---

# Chapter 4: Generators

> ## Breaking Run-to-Completion
>
> Consider:
>
> ```javascript
> function *foo(x) {
> 	var y = x * (yield);
> 	return y;
> }
>
> var it = foo( 6 );
>
> // start `foo(..)`
> it.next();
>
> var res = it.next( 7 );
>
> res.value;		// 42
> ```
>
> First, we pass in `6` as the parameter `x`. Then we call `it.next()`, and it starts up `*foo(..)`.
>
> Inside `*foo(..)`, the `var y = x ..` statement starts to be processed, but then it runs across a `yield` expression. At that point, it pauses `*foo(..)` (in the middle of the assignment statement!), and essentially requests the calling code to provide a result value for the `yield` expression. Next, we call `it.next( 7 )`, which is passing the `7` value back in to *be* that result of the paused `yield` expression.

注意这里调用了两次`next`函数，第一次只是启动了生成器并到达了第一个`yield`语句（`foo(6)`只是定义了一个生成器，但还没有开始执行其中的代码），第二次输入`yield`的值并到达了最终的`return`语句。

这里还有一个比较tricky的地方在于JavaScript中生成器的`next`函数是可以有一个输入的，**当`next`函数有输入时，会用输入的值来替代整个`yield`表达式的值**，没有输入时，其实相当于传入了`undefined`（作为对比，Python中生成器的next函数是不支持输入参数的）。比如：

```javascript
function* bar() {
    var y = yield 2;
    return y;
}

var it = bar();

console.log(it.next());  // { value: 2, done: false }
console.log(it.next());  // { value: undefined, done: true }

// ==== give a input to next() ====
var it2 = bar();

console.log(it2.next());  // { value: 2, done: false }
console.log(it2.next(3));  // { value: 3, done: true }
```

因此，`yield`表达式可以用在赋值语句当中，并由`next`函数来动态决定其表达式的值。

<!--break-->

---

> And if there **is no return** in your generator -- `return` is certainly not any more required in generators than in regular functions -- there's always an assumed/implicit `return;` (aka `return undefined;`).

函数（生成器）中不写`return`语句，编译器会默认加上一句`return undefined;`。对于生成器而言，return的值会出现在最后一个`next`语句的返回值中，即`{value: <returnValue>, done: true}`。虽然通过`for..in`来遍历时，return的值不会被遍历，但在yield delegation时会起到和调用`next`函数时传入参数一样的效果：

```javascript
function *foo() {
    var a = yield 1;
    console.log(a); // 5
    return 2;
}

function *bar() {
    var b = yield *foo();
    console.log(b); // 2
    var c = yield 3;
    console.log(c); // 6
  	return 4;
}

var it = bar();

it.next();    // {value: 1, done: false}
it.next(5);   // {value: 3, done: false}
it.next(6);   // {value: 4, done: true}
```

---

> ## Generator'ing Values
>
> We could implement the standard *iterator* interface for our number series producer:
>
> ```javascript
> var something = (function(){
> 	var nextVal;
>
> 	return {
> 		// needed for `for..of` loops
> 		[Symbol.iterator]: function(){ return this; },
>
> 		// standard iterator interface method
> 		next: function(){
> 			if (nextVal === undefined) {
> 				nextVal = 1;
> 			}
> 			else {
> 				nextVal = (3 * nextVal) + 6;
> 			}
>
> 			return { done:false, value:nextVal };
> 		}
> 	};
> })();
>
> something.next().value;		// 1
> something.next().value;		// 9
> something.next().value;		// 33
> something.next().value;		// 105
> ```
>
> **Note:** We'll explain why we need the `[Symbol.iterator]: ..` part of this code snippet in the "Iterables" section. Syntactically though, two ES6 features are at play. First, the `[ .. ]` syntax is called a *computed property name* (see the *this & Object Prototypes* title of this series). It's a way in an object literal definition to specify an expression and use the result of that expression as the name for the property. Next, `Symbol.iterator` is one of ES6's predefined special `Symbol` values (see the *ES6 & Beyond* title of this book series).
>
> The `next()` call returns an object with two properties: `done` is a `boolean` value signaling the *iterator's* complete status; `value` holds the iteration value.

实现一个JavaScript版本的迭代器（需要定义一个`next`属性的函数以及`[Symbol.iterator]`属性的函数）。

`for..of`类似Python中的`for..in`（为啥不也用`for..in`？），而JavaScript中的`for..in`则只用于遍历对象的属性。

---

> It may seem a strange omission by ES6, but regular `object`s intentionally do not come with a default *iterator*the way `array`s do. The reasons go deeper than we will cover here. If all you want is to iterate over the properties of an object (with no particular guarantee of ordering), `Object.keys(..)` returns an `array`, which can then be used like `for (var k of Object.keys(obj)) { ..`. Such a `for..of` loop over an object's keys would be similar to a `for..in` loop, except that `Object.keys(..)` does not include properties from the `[[Prototype]]` chain while `for..in` does.

`for..in`和`for..of`用于`Object.keys(..)`来遍历对象属性的区别。

---

> As of ES6, the way to retrieve an *iterator* from an *iterable* is that the *iterable* must have a function on it, with the name being the special ES6 symbol value `Symbol.iterator`. When this function is called, it returns an *iterator*. Though not required, generally each call should return a fresh new *iterator*.
>
> ```javascript
> var a = [1,3,5,7,9];
>
> var it = a[Symbol.iterator]();
>
> it.next().value;	// 1
> it.next().value;	// 3
> it.next().value;	// 5
> ..
> ```

`Symbol.iterator`类似Python中的`__iter__`魔术方法。

---

> While a `for..of` loop will automatically send this signal, you may wish to send the signal manually to an *iterator*; you do this by calling `return(..)`.
>
> If you specify a `try..finally` clause inside the generator, it will always be run even when the generator is externally completed. This is useful if you need to clean up resources (database connections, etc.):
>
> ```javascript
> function *something() {
> 	try {
> 		var nextVal;
>
> 		while (true) {
> 			if (nextVal === undefined) {
> 				nextVal = 1;
> 			}
> 			else {
> 				nextVal = (3 * nextVal) + 6;
> 			}
>
> 			yield nextVal;
> 		}
> 	}
> 	// cleanup clause
> 	finally {
> 		console.log( "cleaning up!" );
> 	}
> }
> ```
>
> The earlier example with `break` in the `for..of` loop will trigger the `finally` clause. But you could instead manually terminate the generator's *iterator* instance from the outside with `return(..)`:
>
> ```javascript
> var it = something();
> for (var v of it) {
> 	console.log( v );
>
> 	// don't let the loop run forever!
> 	if (v > 500) {
> 		console.log(
> 			// complete the generator's iterator
> 			it.return( "Hello World" ).value
> 		);
> 		// no `break` needed here
> 	}
> }
> // 1 9 33 105 321 969
> // cleaning up!
> // Hello World
> ```

调用迭代器的`return`函数可以主动结束迭代。

---

> ## Iterating Generators Asynchronously
>
> We should revisit one of our scenarios from Chapter 3. Let's recall the callback approach:
>
> ```javascript
> function foo(x,y,cb) {
> 	ajax(
> 		"http://some.url.1/?x=" + x + "&y=" + y,
> 		cb
> 	);
> }
>
> foo( 11, 31, function(err,text) {
> 	if (err) {
> 		console.error( err );
> 	}
> 	else {
> 		console.log( text );
> 	}
> } );
> ```
>
> If we wanted to express this same task flow control with a generator, we could do:
>
> ```javascript
> function foo(x,y) {
> 	ajax(
> 		"http://some.url.1/?x=" + x + "&y=" + y,
> 		function(err,data){
> 			if (err) {
> 				// throw an error into `*main()`
> 				it.throw( err );
> 			}
> 			else {
> 				// resume `*main()` with received `data`
> 				it.next( data );
> 			}
> 		}
> 	);
> }
>
> function *main() {
> 	try {
> 		var text = yield foo( 11, 31 );
> 		console.log( text );
> 	}
> 	catch (err) {
> 		console.error( err );
> 	}
> }
>
> var it = main();
>
> // start it all up!
> it.next();
> ```

这里利用了`next`函数传递参数来表示`yield`表达式的值。比较tricky的是这里生成器函数内部调用了自己的实例的`next`函数。

---

> We can even `catch` the same error that we `throw(..)` into the generator, essentially giving the generator a chance to handle it but if it doesn't, the *iterator* code must handle it:
>
> ```javascript
> function *main() {
> 	var x = yield "Hello World";
>
> 	// never gets here
> 	console.log( x );
> }
>
> var it = main();
>
> it.next();
>
> try {
> 	// will `*main()` handle this error? we'll see!
> 	it.throw( "Oops" );
> }
> catch (err) {
> 	// nope, didn't handle it!
> 	console.error( err );			// Oops
> }
> ```

迭代器的`throw`函数会先把异常抛给迭代器内部来处理（内部的`try..catch`语句），同时将迭代器的状态设为`done`（和`return`函数类似），如果内部不处理则会再抛出来到外部。

---

> ## Generators + Promises
>
> Several Promise abstraction libraries provide just such a utility, including my *asynquence* library and its `runner(..)`, which will be discussed in Appendix A of this book.
>
> But for the sake of learning and illustration, let's just define our own standalone utility that we'll call `run(..)`:
>
> ```javascript
> // thanks to Benjamin Gruenbaum (@benjamingr on GitHub) for
> // big improvements here!
> function run(gen) {
> 	var args = [].slice.call( arguments, 1), it;
>
> 	// initialize the generator in the current context
> 	it = gen.apply( this, args );
>
> 	// return a promise for the generator completing
> 	return Promise.resolve()
> 		.then( function handleNext(value){
> 			// run to the next yielded value
> 			var next = it.next( value );
>
> 			return (function handleResult(next){
> 				// generator has completed running?
> 				if (next.done) {
> 					return next.value;
> 				}
> 				// otherwise keep going
> 				else {
> 					return Promise.resolve( next.value )
> 						.then(
> 							// resume the async loop on
> 							// success, sending the resolved
> 							// value back into the generator
> 							handleNext,
>
> 							// if `value` is a rejected
> 							// promise, propagate error back
> 							// into the generator for its own
> 							// error handling
> 							function handleErr(err) {
> 								return Promise.resolve(
> 									it.throw( err )
> 								)
> 								.then( handleResult );
> 							}
> 						);
> 				}
> 			})(next);
> 		} );
> }
> ```

`run`函数接收一个生成器，返回一个Promise对象。注意其中的`handleNext`函数被递归调用了，即每一个Promise对象返回的Promise对象均包含这个`handleNext`函数来处理resolve的状态。

---

> Imagine a scenario where you need to fetch data from two different sources, then combine those responses to make a third request, and finally print out the last response.
>
> The simplest approach:
>
> ```javascript
> function *foo() {
> 	// make both requests "in parallel"
> 	var p1 = request( "http://some.url.1" );
> 	var p2 = request( "http://some.url.2" );
>
> 	// wait until both promises resolve
> 	var r1 = yield p1;
> 	var r2 = yield p2;
>
> 	var r3 = yield request(
> 		"http://some.url.3/?v=" + r1 + "," + r2
> 	);
>
> 	console.log( r3 );
> }
>
> // use previously defined `run(..)` utility
> run( foo );
> ```

`request`会返回Promise对象，而直到yield语句才会等待Promise对象变成resolved状态时才会继续调用`next`函数去等待下一个yield的Promise对象。所以，两个请求会并发进行。

试想一下，如果是用async/await要怎么实现类似并行的操作：

```javascript
async function foo() {
	var p1 = request( "http://some.url.1" );
	var p2 = request( "http://some.url.2" );
    
    await p1;
    await p2;
    
    var r3 = yield request(
		"http://some.url.3/?v=" + r1 + "," + r2
	);

	console.log( r3 );
}

foo();
```

其实用`Promise.all`也能实现一样的效果，就不赘述了。

---

> Abstraction is not *always* a healthy thing for programming -- many times it can increase complexity in exchange for terseness.

但这种情况难道不是因为抽象得不够好么？

---

> ## Generator Delegation
>
> It may then occur to you that you might try to call one generator from another generator, using our `run(..)` helper, such as:
>
> ```javascript
> function *foo() {
> 	var r2 = yield request( "http://some.url.2" );
> 	var r3 = yield request( "http://some.url.3/?v=" + r2 );
>
> 	return r3;
> }
>
> function *bar() {
> 	var r1 = yield request( "http://some.url.1" );
>
> 	// "delegating" to `*foo()` via `run(..)`
> 	var r3 = yield run( foo );
>
> 	console.log( r3 );
> }
>
> run( bar );
> ```
>
> But there's an even better way to integrate calling `*foo()` into `*bar()`, and it's called `yield`-delegation. The special syntax for `yield`-delegation is: `yield * __` (notice the extra `*`). Before we see it work in our previous example, let's look at a simpler scenario:
>
> ```javascript
> function *foo() {
> 	console.log( "`*foo()` starting" );
> 	yield 3;
> 	yield 4;
> 	console.log( "`*foo()` finished" );
> }
>
> function *bar() {
> 	yield 1;
> 	yield 2;
> 	yield *foo();	// `yield`-delegation!
> 	yield 5;
> }
>
> var it = bar();
>
> it.next().value;	// 1
> it.next().value;	// 2
> it.next().value;	// `*foo()` starting
> 					// 3
> it.next().value;	// 4
> it.next().value;	// `*foo()` finished
> 					// 5
> ```

通过`yield *`加另外一个生成器，可以将其他生成器串起来，插入到当前的生成器当中。

这其实是一个语法糖，比如我可以这样实现一样的效果：

```javascript
function myBar() {
    var sequence = [1, 2, foo(), 5];
    var index = 0;

    return {
        // needed for `for..of` loops
        [Symbol.iterator]: function () {
            return this;
        },

        // standard iterator interface method
        next: function () {
            if (index >= sequence.length) {
                return {done: true, value: undefined};
            }

            var value = sequence[index];
            // if value is a generator, use its next value and index stay unchanged
            if (value && typeof value.next === "function") {
                var nextVal = value.next();
                if (!nextVal.done) {
                    value = nextVal.value;
                }
                else {
                    // if the generator is done, use the next value of myself
                    index++;
                    value = this.next().value;
                }
            }
            else{
                index++;
            }

            return {done: false, value: value};
        }
    };
}

var myIt = myBar();
for (i of myIt) {
    console.log(i);
}
```

甚至，我还可以实现一个`yieldDelegate`函数来达到和`yield *`一样的功能（其实就是对函数的`next`函数做手脚）。

---

> In fact, `yield`-delegation doesn't even have to be directed to another generator; it can just be directed to a non-generator, general *iterable*. For example:
>
> ```javascript
> function *bar() {
> 	console.log( "inside `*bar()`:", yield "A" );
>
> 	// `yield`-delegation to a non-generator!
> 	console.log( "inside `*bar()`:", yield *[ "B", "C", "D" ] );
>
> 	console.log( "inside `*bar()`:", yield "E" );
>
> 	return "F";
> }
>
> var it = bar();
>
> console.log( "outside:", it.next().value );
> // outside: A
>
> console.log( "outside:", it.next( 1 ).value );
> // inside `*bar()`: 1
> // outside: B
>
> console.log( "outside:", it.next( 2 ).value );
> // outside: C
>
> console.log( "outside:", it.next( 3 ).value );
> // outside: D
>
> console.log( "outside:", it.next( 4 ).value );
> // inside `*bar()`: undefined
> // outside: E
>
> console.log( "outside:", it.next( 5 ).value );
> // inside `*bar()`: 5
> // outside: F
> ```
>
> Notice the differences in where the messages were received/reported between this example and the one previous.
>
> Most strikingly, the default `array` *iterator* doesn't care about any messages sent in via `next(..)` calls, so the values `2`, `3`, and `4` are essentially ignored. Also, because that *iterator* has no explicit `return` value (unlike the previously used `*foo()`), the `yield *` expression gets an `undefined` when it finishes.

`yield *`语法糖可以用于任何可迭代的对象，但`next`函数传入参数就不一定有意义了。

---

> Of course, `yield`-delegation can keep following as many delegation steps as you wire up. You could even use `yield`-delegation for async-capable generator "recursion" -- a generator `yield`-delegating to itself:
>
> ```javascript
> function *foo(val) {
> 	if (val > 1) {
> 		// generator recursion
> 		val = yield *foo( val - 1 );
> 	}
>
> 	return yield request( "http://some.url/?v=" + val );
> }
>
> function *bar() {
> 	var r1 = yield *foo( 3 );
> 	console.log( r1 );
> }
>
> run( bar );
> ```

够花哨。

---

> ## Thunks
>
> In general computer science, there's an old pre-JS concept called a "thunk." Without getting bogged down in the historical nature, a narrow expression of a thunk in JS is a function that -- without any parameters -- is wired to call another function.
>
> In other words, you wrap a function definition around function call -- with any parameters it needs -- to *defer* the execution of that call, and that wrapping function is a thunk. When you later execute the thunk, you end up calling the original function.
>
> For example:
>
> ```javascript
> function foo(x,y) {
> 	return x + y;
> }
>
> function fooThunk() {
> 	return foo( 3, 4 );
> }
>
> // later
>
> console.log( fooThunk() );	// 7
> ```

终于知道`redux-thunk`名称的由来了。

---

# Chapter 5: Program Performance

> ## Web Workers
>
> But an environment like your browser can easily provide multiple instances of the JavaScript engine, each on its own thread, and let you run a different program in each thread. Each of those separate threaded pieces of your program is called a "(Web) Worker." This type of parallelism is called "task parallelism," as the emphasis is on splitting up chunks of your program to run in parallel.
>
> From your main JS program (or another Worker), you instantiate a Worker like so:
>
> ```javascript
> var w1 = new Worker( "http://some.url.1/mycoolworker.js" );
> ```
>
> The URL should point to the location of a JS file (not an HTML page!) which is intended to be loaded into a Worker. The browser will then spin up a separate thread and let that file run as an independent program in that thread.

Javascript语言设计的出发点就是单线程环境下运行的，web worker这种其实更像是多进程，因为各个work是不共享内存的，并且是浏览器的特性，而非JavaScript语言的特性（浏览器每打开一个tab会启一个JS进程，启一个web worker就和打开一个新的tab类似吧）。

---

> Workers do not share any scope or resources with each other or the main program -- that would bring all the nightmares of threaded programming to the forefront -- but instead have a basic event messaging mechanism connecting them.
>
> The `w1` Worker object is an event listener and trigger, which lets you subscribe to events sent by the Worker as well as send events to the Worker.
>
> Here's how to listen for events (actually, the fixed `"message"` event):
>
> ```javascript
> w1.addEventListener( "message", function(evt){
> 	// evt.data
> } );
> ```
>
> And you can send the `"message"` event to the Worker:
>
> ```javascript
> w1.postMessage( "something cool to say" );
> ```
>
> Inside the Worker, the messaging is totally symmetrical:
>
> ```javascript
> // "mycoolworker.js"
>
> addEventListener( "message", function(evt){
> 	// evt.data
> } );
>
> postMessage( "a really cool reply" );
> ```

> Usually the main page application creates the Workers, but a Worker can instantiate its own child Worker(s) -- known as subworkers -- as necessary. Sometimes this is useful to delegate such details to a sort of "master" Worker that spawns other Workers to process parts of a task. Unfortunately, at the time of this writing, Chrome still does not support subworkers, while Firefox does.
>
> To kill a Worker immediately from the program that created it, call `terminate()` on the Worker object (like `w1` in the previous snippets). Abruptly terminating a Worker thread does not give it any chance to finish up its work or clean up any resources. It's akin to you closing a browser tab to kill a page.

web worker支持在启动的线程中再启子线程。

---

> What are some common uses for Web Workers?
>
> - Processing intensive math calculations
> - Sorting large data sets
> - Data operations (compression, audio analysis, image pixel manipulations, etc.)
> - High-traffic network communications

---

> If you pass an object, a so-called "Structured Cloning Algorithm" (<https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/The_structured_clone_algorithm>) is used to copy/duplicate the object on the other side. This algorithm is fairly sophisticated and can even handle duplicating objects with circular references. The to-string/from-string performance penalty is not paid, but we still have duplication of memory using this approach. There is support for this in IE10 and above, as well as all the other major browsers.
>
> An even better option, especially for larger data sets, is "Transferable Objects" (<http://updates.html5rocks.com/2011/12/Transferable-Objects-Lightning-Fast>). What happens is that the object's "ownership" is transferred, but the data itself is not moved. Once you transfer away an object to a Worker, it's empty or inaccessible in the originating location -- that eliminates the hazards of threaded programming over a shared scope. Of course, transfer of ownership can go in both directions.
>
> There really isn't much you need to do to opt into a Transferable Object; any data structure that implements the Transferable interface (<https://developer.mozilla.org/en-US/docs/Web/API/Transferable>) will automatically be transferred this way (support Firefox & Chrome).

目前主流有两种方式来进行web worker之间的数据交换，一种是使用浏览器自带的"Structured Cloning Algorithm"来对数据进行序列化后传递，注意不是所有的数据类型都能复制的，比如函数就不行；另外一种是将数据的拥有者进行转移，而数据本身不进行复制，这种适合于数据量较大的情况。总之，看上去就是要避免资源发生竞争的情况。

---

> ## SIMD
>
> Single instruction, multiple data (SIMD) is a form of "data parallelism," as contrasted to "task parallelism" with Web Workers, because the emphasis is not really on program logic chunks being parallelized, but rather multiple bits of data being processed in parallel.
>
> With SIMD, threads don't provide the parallelism. Instead, modern CPUs provide SIMD capability with "vectors" of numbers -- think: type specialized arrays -- as well as instructions that can operate in parallel across all the numbers; these are low-level operations leveraging instruction-level parallelism.

有点像是利用GPU多核心并行计算那一套东西。

---

> ## asm.js
>
> "asm.js" (<http://asmjs.org/>) is a label for a highly optimizable subset of the JavaScript language. By carefully avoiding certain mechanisms and patterns that are *hard* to optimize (garbage collection, coercion, etc.), asm.js-styled code can be recognized by the JS engine and given special attention with aggressive low-level optimizations.

这就是源自那个著名的要在网页上运行C++写的游戏的项目，它的原理简单来说是将各种语言（包括JavaScript）编译成一种中间字节码，然后在浏览器中执行运行编译过后的代码。因为编译和运行可以分离了（原生的JavaScript编译和运行都是在浏览器中进行的），因此浏览器中执行的性能能得到提升。（试想一下，在浏览器中运行C++代码，那速度就不谈了，以后还有什么事情是前端不能做的？）

asm.js现在衍生出了非常有名的[WebAssembly](https://developer.mozilla.org/zh-CN/docs/WebAssembly)，可以理解为各大厂商对asm.js进行了标准化和优化之后的项目。

---

# Chapter 6: Benchmarking & Tuning

> ## Context Is King
>
> What this boils down to is that testing *not real* code gives you *not real* results. In so much as is possible and practical, you should test actual real, non-trivial snippets of your code, and under as best of real conditions as you can actually hope to. Only then will the results you get have a chance to approximate reality.
>
> Microbenchmarks like `++x` vs `x++` are so incredibly likely to be bogus, we might as well just flatly assume them as such.

这里作者想说的是，只有在真实的环境中测试真实的代码（性能）才是有意义的，因为代码运行频率不同、编译器会有优化等各种因素影响着性能，几乎不可能只从理论上去静态分析得到两段代码性能的优劣（当然算法的性能还是能分析出来的）。

---

> ## Microperformance
>
> So I'm very cautious about making wide ranging performance optimizations in my JS code based purely on engine implementation details, **especially if those details are only true of a single engine**.

针对某个特定的编译器做性能优化应该是最后的选择了吧，那真是要把性能优化到极致了。

---

> "There is nothing more permanent than a temporary hack." Chances are, the code you write now to work around some performance bug will probably outlive the performance bug in the browser itself.

精辟！

---

> Ever heard the admonition, "that's premature optimization!"? It comes from a famous quote from Donald Knuth: "premature optimization is the root of all evil.". Many developers cite this quote to suggest that most optimizations are "premature" and are thus a waste of effort. The truth is, as usual, more nuanced.
>
> Here is Knuth's quote, in context:
>
> > Programmers waste enormous amounts of time thinking about, or worrying about, the speed of **noncritical** parts of their programs, and these attempts at efficiency actually have a strong negative impact when debugging and maintenance are considered. We should forget about small efficiencies, say about 97% of the time: premature optimization is the root of all evil. Yet we should not pass up our opportunities in that **critical** 3%. [emphasis added]
>
> (<http://web.archive.org/web/20130731202547/http://pplab.snu.ac.kr/courses/adv_pl05/papers/p261-knuth.pdf>, Computing Surveys, Vol 6, No 4, December 1974)
>
> I believe it's a fair paraphrasing to say that Knuth *meant*: "non-critical path optimization is the root of all evil." So the key is to figure out if your code is on the critical path -- you should optimize it! -- or not.

名言的出处。

---

> ## Tail Call Optimization (TCO)
>
> Briefly, a "tail call" is a function call that appears at the "tail" of another function, such that after the call finishes, there's nothing left to do (except perhaps return its result value).
>
> For example, here's a non-recursive setup with tail calls:
>
> ```javascript
> function foo(x) {
> 	return x;
> }
>
> function bar(y) {
> 	return foo( y + 1 );	// tail call
> }
>
> function baz() {
> 	return 1 + bar( 40 );	// not tail call
> }
>
> baz();						// 42
> ```
>
> `foo(y+1)` is a tail call in `bar(..)` because after `foo(..)` finishes, `bar(..)` is also finished except in this case returning the result of the `foo(..)` call. However, `bar(40)` is *not* a tail call because after it completes, its result value must be added to `1` before `baz()` can return it.
>
> Without getting into too much nitty-gritty detail, calling a new function requires an extra amount of reserved memory to manage the call stack, called a "stack frame." So the preceding snippet would generally require a stack frame for each of `baz()`, `bar(..)`, and `foo(..)` all at the same time.
>
> However, if a TCO-capable engine can realize that the `foo(y+1)` call is in *tail position* meaning `bar(..)` is basically complete, then when calling `foo(..)`, it doesn't need to create a new stack frame, but can instead reuse the existing stack frame from `bar(..)`. That's not only faster, but it also uses less memory.

之所以能reuse是因为已经到外层函数的结尾了，对frame的改变并不会再影响外层函数了。这点对递归比较重要，递归函数转换为尾递归之后就没有递归深度的限制了。