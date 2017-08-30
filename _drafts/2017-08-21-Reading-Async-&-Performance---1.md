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

`setTimeout`函数是在一定时间之后将回调函数插入到event loop之中，但其并不保证插入之后便立即得到执行（取决于插入时event loop队列是否为空）。

---

> Because of JavaScript's single-threading, the code inside of `foo()` (and `bar()`) is atomic, which means that once `foo()` starts running, the entirety of its code will finish before any of the code in `bar()` can run, or vice versa. This is called "run-to-completion" behavior.

Javascript是单线程的，所以在一个瞬间只有一段代码会被执行。而由于event loop的机制，所有插入其中的task都自带了原子属性，即一个task完全执行完才会去执行下一个task，即使这两个task被安排到了同一时间执行也是如此（安排在同一时间就按照进入event loop的先后来按顺序执行呗）。有点Python中协程的感觉，

---

> ## Concurrency
>
> 