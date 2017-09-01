---
layout: post
title: "Reading &lt;Async & Performance&gt; - 1"
category: Javascript
tags: [You Dont Know JS, 读书笔记]
date: 2017-08-21
---

# Chapter 1: Asynchrony: Now & Later

> ## Event Loop
>
> So what is the *event loop*?
>
> Let's conceptualize it first through some fake-ish code:
>
> ```javascript
> // `eventLoop` is an array that acts as a queue (first-in, first-out)
> var eventLoop = [ ];
> var event;
>
> // keep going "forever"
> while (true) {
> 	// perform a "tick"
> 	if (eventLoop.length > 0) {
> 		// get the next event in the queue
> 		event = eventLoop.shift();
>
> 		// now, execute the next event
> 		try {
> 			event();
> 		}
> 		catch (err) {
> 			reportError(err);
> 		}
> 	}
> }
> ```

> It's important to note that `setTimeout(..)` doesn't put your callback on the event loop queue. What it does is set up a timer; when the timer expires, the environment places your callback into the event loop, such that some future tick will pick it up and execute it.
>
> What if there are already 20 items in the event loop at that moment? Your callback waits. It gets in line behind the others -- there's not normally a path for preempting the queue and skipping ahead in line. This explains why `setTimeout(..)` timers may not fire with perfect temporal accuracy. You're guaranteed (roughly speaking) that your callback won't fire *before* the time interval you specify, but it can happen at or after that time, depending on the state of the event queue.

`setTimeout`函数是在一定时间之后将回调函数插入到event loop之中，但其并不保证插入之后便立即得到执行（取决于插入时event loop队列是否为空，比如`setTimeout(..., 0)`并不会在该语句执行完后就立刻执行，而是会在当前整段代码执行完成之后再执行，比如下面的代码）。

```javascript
setTimeout(function () {
    console.log('A')
}, 0);

function demo() {
    setTimeout(function () {
        console.log('B');
    }, 0);
    console.log('C');
}

demo();
console.log('D');
```

最后输出的顺序是`CDAB`，即整块代码中同步的部分会先执行，然后再是异步的部分。或者这样理解，执行上面的代码块本身是一个是atomic task，两个`setTimeout`函数分别又创建了两个task，并安排在当前task执行完之后执行。

---

> Because of JavaScript's single-threading, the code inside of `foo()` (and `bar()`) is atomic, which means that once `foo()` starts running, the entirety of its code will finish before any of the code in `bar()` can run, or vice versa. This is called "run-to-completion" behavior.

Javascript是单线程的，所以在一个瞬间只有一段代码会被执行。而由于event loop的机制，所有插入其中的task都自带了原子属性，即一个task完全执行完才会去执行下一个task，即使这两个task被安排到了同一时间执行也是如此（安排在同一时间就按照进入event loop的先后来按顺序执行呗）。有点Python中协程的感觉。

---

> ## Concurrency
>
> ### Cooperation
>
> Here, the focus isn't so much on interacting via value sharing in scopes (though that's obviously still allowed!). The goal is to take a long-running "process" and break it up into steps or batches so that other concurrent "processes" have a chance to interleave their operations into the event loop queue.
>
> For example, consider an Ajax response handler that needs to run through a long list of results to transform the values. We'll use `Array#map(..)` to keep the code shorter:
>
> ```javascript
> var res = [];
>
> // `response(..)` receives array of results from the Ajax call
> function response(data) {
> 	// add onto existing `res` array
> 	res = res.concat(
> 		// make a new transformed array with all `data` values doubled
> 		data.map( function(val){
> 			return val * 2;
> 		} )
> 	);
> }
>
> // ajax(..) is some arbitrary Ajax function given by a library
> ajax( "http://some.url.1", response );
> ajax( "http://some.url.2", response );
> ```
>
> If `"http://some.url.1"` gets its results back first, the entire list will be mapped into `res` all at once. If it's a few thousand or less records, this is not generally a big deal. But if it's say 10 million records, that can take a while to run (several seconds on a powerful laptop, much longer on a mobile device, etc.).
>
> While such a "process" is running, nothing else in the page can happen, including no other `response(..)` calls, no UI updates, not even user events like scrolling, typing, button clicking, and the like. That's pretty painful.

解决方法就是把一个task拆分成多个：在`response`函数中先拆分data，最后调用`setTimeout()`新创建一个task来处理拆分下来的还没处理的那部分data（具体代码没贴，看[原文](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20performance/ch1.md#cooperation)）。这里的解决方法还是比较有启发性的，比如页面上面有两个分页的表格，使用这种方法就可以把两个表格的第一页内容先渲染出来，而如果不拆分的话，则第二张表格要等第一个表格完全渲染完成后才会开始渲染。

---

>## Jobs
>
>As of ES6, there's a new concept layered on top of the event loop queue, called the "Job queue." The most likely exposure you'll have to it is with the asynchronous behavior of Promises (see Chapter 3).

>So, the best way to think about this that I've found is that the "Job queue" is a queue hanging off the end of every tick in the event loop queue. Certain async-implied actions that may occur during a tick of the event loop will not cause a whole new event to be added to the event loop queue, but will instead add an item (aka Job) to the end of the current tick's Job queue.
>
>It's kinda like saying, "oh, here's this other thing I need to do *later*, but make sure it happens right away before anything else can happen."
>
>Or, to use a metaphor: the event loop queue is like an amusement park ride, where once you finish the ride, you have to go to the back of the line to ride again. But the Job queue is like finishing the ride, but then cutting in line and getting right back on.

ES6为了配合新添加的Promise机制在event loop的基础上添加了job queue的机制，而job queue就像是一个VIP队列，它里面的task永远排在event loop的当前执行的task后面，只有它当中没有task了，才会轮到event loop之后的task去执行。

---

# Chapter 2: Callbacks

>## Sequential Brain
>
>In fact, one way of simplifying (i.e., abusing) the massively complex world of neurology into something I can remotely hope to discuss here is that our brains work kinda like the event loop queue.
>
>If you think about every single letter (or word) I type as a single async event, in just this sentence alone there are several dozen opportunities for my brain to be interrupted by some other event, such as from my senses, or even just my random thoughts.
>
>I don't get interrupted and pulled to another "process" at every opportunity that I could be (thankfully -- or this book would never be written!). But it happens often enough that I feel my own brain is nearly constantly switching to various different contexts (aka "processes"). And that's an awful lot like how the JS engine would probably feel.

不说还真没发觉人的大脑也是“单核”的。

---

> The only thing worse than not knowing why some code breaks is not knowing why it worked in the first place! It's the classic "house of cards" mentality: "it works, but not sure why, so nobody touch it!" You may have heard, "Hell is other people" (Sartre), and the programmer meme twist, "Hell is other people's code." I believe truly: "Hell is not understanding my own code." And callbacks are one main culprit.

真·至理名言！不知道为什么出了问题至少还有迹可循，不知道为什么能正常工作可能想弄明白都无从下手，并且很可能因此产生更多的问题。

---

> ## Trust Issues
>
> If you have code that uses callbacks, especially but not exclusively with third-party utilities, and you're not already applying some sort of mitigation logic for all these *inversion of control* trust issues, your code *has* bugs in it right now even though they may not have bitten you yet. Latent bugs are still bugs.
>
> Hell indeed.

这里作者说了关于回调函数的另一个问题，难以确保你的异步回调的整个流程是正确的，尤其是当你使用了第三方的异步执行的库之后。比如说一个普通的函数，你是可以去验证它的输入类型，在输入类型不正确时可以进行适当地处理，而对于回调函数而言，你要去确保某个回调函数只被执行了一次是比较难的（比如网络请求的回调函数，请求失败可能会retry，但此时回调函数可能被重复执行了，或者一些情况下可能没有被执行，情况比较多也不容易处理）。

当然，现在我们知道JavaScript中新添加的Promise机制（每个异步回调都分了几种情况来处理）可以多多少少降低异步回调出现的这些问题了。

---

# Chapter 3: Promises

