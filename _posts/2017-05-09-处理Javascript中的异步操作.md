---
layout: post
title: "处理Javascript中的异步操作"
category: Javascript
tags: [Promise, Generator, async]
date: 2017-05-09
---

### 回调函数

我们知道JavaScript和其他语言很大的一点区别就在于其中存在大量的异步函数。所谓异步是指一个函数可能调用它的语句已经执行结束了，但函数内部的语句依然还没有执行，即函数的调用仅仅是一个trigger。比如下图中的`getAccount`函数作为异步操作被调用后，紧接着`fetchGreetings`被调用，它们内部语句的执行几乎是在同时并发进行的。如果我希望`fetchGreetings`函数能在`getAccount`函数执行完成之后再开始执行（比如前者的需要后者的返回结果作为输入），并且仍保持`getAccount`函数是异步的，要怎么办？

![sync vs. async](/images/2017-05-05-sync_vs_async.png)

一个最直接了当的方式就是回调，即把`fetchGreetings`函数本身作为一个参数传递给`getAccount`函数，当`getAccount`内部语句执行完成后，由它去调用`fetchGreetings`函数。

<!--break-->

### 回调地狱

OK，换一个更加简单的例子，假设我们要实现每间隔一秒钟打印出一个字符串，那么主要的函数可能是这样的：

```javascript
function printAsync(str, callback) {
    console.log(str);
    if (callback) setTimeout(callback, 1000);
}
```

实际调用时，需要不断地回调自身，从而可以打印出不同的字符串：

```javascript
printAsync('aaa', function () {
    printAsync('bbb', function () {
        printAsync('ccc', function () {
            printAsync('ddd');
        })
    })
});
```

看到这么多的`})`是不是有点烦躁？这种多个回调函数的多层嵌套会让代码的可读性直线下降，因此又称为回调地狱。

提高这种回调地狱代码可读性的方法有很多，比如将嵌套的函数定义拿出来，或者使用Promise、generator等新语法，具体可以参考[这篇文章](http://callbackhell.com/)。

### Promise

> 什么是[Promise](http://www.html5rocks.com/en/tutorials/es6/promises/)呢？在[纸牌屋](http://zh.wikipedia.org/zh/%E7%BA%B8%E7%89%8C%E5%B1%8B)的第一季第一集中，当琳达告诉安德伍德不能让他做国务卿后，他说：“所谓Promise，就是说它不会受不断变化的情况影响。”
>
> Promise不仅去掉了嵌套，它连回调都去掉了。因为按照Promise的观点，回调一点也不符合函数式编程的精神。回调函数什么都不返回，没有返回值的函数，执行它仅仅是因为它的副作用。所以用回调函数编程天生就是指令式的，是以副作用为主的过程的执行顺序，而不是像函数那样把输入映射到输出，可以组装到一起。

> **Promise** 对象是一个代理对象（代理一个值），被代理的值在Promise对象创建时可能是未知的。它允许你为异步代码执行结果的成功和失败分别绑定相应的处理方法（handlers ）。

这里以官方的例子为例：

```javascript
var myFirstPromise = new Promise(function(resolve, reject){
    //当异步代码执行成功时，我们才会调用resolve(...), 当异步代码失败时就会调用reject(...)
    //在本例中，我们使用setTimeout(...)来模拟异步代码，实际编码时可能是XHR请求或是HTML5的一些API方法.
    setTimeout(function(){
        resolve("成功!"); //代码正常执行！
    }, 250);
});

myFirstPromise.then(function(successMessage){
    //successMessage的值是上面调用resolve(...)方法传入的值.
    //successMessage参数不一定非要是字符串类型，这里只是举个例子
    console.log("Yay! " + successMessage);
});
```

可以看到其实Promise的本质还是利用了回调函数，并不是什么全新的东西。上面的`new Promise()`中传递进去的函数就是我们的异步操作，当这一句执行后，即创建了Promise对象后，该函数就会开始执行。这个函数的输入包含两个参数，`resolve`和`reject`，它们其实就是异步操作的回调函数，Promise规定了`resolve`应该在操作成功后执行，而`reject`应该在操作失败后执行。`myFirstPromise.then()`其实就是定义了`resolve`函数的模样，对应的`myFirstPromise.catch()`用来定义`reject`回调函数。

因此**Promise只是定义了一套规则（或者叫模式）来使用回调函数**，当大家都使用这套规则来处理回调函数时，代码就会显得比较清晰。

### Generator

生成器，回忆下Python里面的生成器，是的，JavaScript里的和那个是一个东西，当然定义的方式稍微有些区别（注意function后面的星号）：

```javascript
function* simpleGenerator(){
  yield "first";
  yield "second";
  yield "third";
}
const g = simpleGenerator();
const print = console.log;
print(g.next()); // { value: 'first', done: false }
print(g.next()); // { value: 'second', done: false }
print(g.next()); // { value: 'third', done: false }
print(g.next()); // { value: undefined, done: true }
```

那么要怎样利用生成器来完成异步操作的串联呢？其实就是类似递归。**当嵌套的函数都是一个模式时，递归再适合不过了。**

这里还是以最开始的例子为例，为了方便使用生成器，我们把除了回调函数以外的参数放在了外层函数中，该函数最终返回一个需要回调函数作为输入的函数（类似装饰器的做法）：

```javascript
function printAsync(str) {
    return function fn(callback) {
        console.log(str);
        setTimeout(callback, 1000);
    }
}
```

接着定义我们的生成器，目标是它每yield一个函数都会等之前yield的函数执行完成之后再执行（即后一个函数是前一个的回调函数）：

```javascript
function* gen() {
    yield printAsync('aaa');
    yield printAsync('bbb');
    yield printAsync('ccc');
    yield printAsync('ddd');
}
```

为了实现上述目标，我们实现了一个简易的函数：

```javascript
function generatorCall(genFunc) {
    let generator = genFunc();
    next();
    function next() {
        // 从生成器中拿一个函数
        let ret = generator.next();
        // 如果生成器还没迭代完，就继续迭代，并且将next函数本身作为回调函数输入到目标函数中
        if (!ret.done) return ret.value(next);
    }
}

generatorCall(gen);  // Will print 'aaa', 'bbb', 'ccc', 'ddd' with 1 second interval
```

以上，函数的执行顺序可以概括为：执行printAsync('aaa')中的内容=>next()=>执行printAsync('bbb')中的内容=>next()=>…，`next`函数作为一个桥梁，以回调函数的身份连接了多个操作。当然，这里只是一个简单地模拟。其他类似的实现可以参考[Co](https://github.com/tj/co)这个lib，或者[这篇文章](http://www.alloyteam.com/2015/04/solve-callback-hell-with-generator/)。

**使用生成器的好处就在于，它让异步的操作可以像同步操作一样进行编程**，即`yield printAsync('bbb')`写在`yield printAsync('aaa')`之后，就可以保证`printAsync('bbb')`在`printAsync('aaa')`执行完成之后再执行，即使它们都是异步的操作。

最后需要注意，生成器本身也是一种迭代器，而上面的功能其实只要是一种迭代器就可以实现，比如可以用一个Array来表示顺序执行的函数也能实现类似的效果（当然上面的`generatorCall`也要相应修改下）：

```javascript
const operations = [printAsync('aaa'), printAsync('bbb'), printAsync('ccc'), printAsync('ddd')];
```

但生成器本身是有一些特性的，比如它是延迟计算的（lazy calculate），再比如它拥有独立的scope，这是其他迭代器所不具备的，对于一些更复杂的操作，使用生成器来处理异步操作可能是更优的选择。

### async/await##

首先，**async/await也不是什么全新的东西，它只是生成器的语法糖而已**。

先来看看同样的代码我们用async/await来实现会是什么样子：

```javascript
function timeoutPrint(str) {
    console.log(str);
    return new Promise((resolve) => {
        setTimeout(resolve, 1000);
    });
}

async function asyncCall() {
    await timeoutPrint('aaa');
    await timeoutPrint('bbb');
    await timeoutPrint('ccc');
    await timeoutPrint('ddd');
}

asyncCall();
```

以上，我们可以看到async函数的一些特点：

- `function`前面需要有`async`关键字，表面这是一个串联异步操作的函数；
- 使用`await`关键字来串联各个异步操作函数，它的作用类似于之前Generator实现中的`yield`；
- 各个异步操作的函数需要返回一个Promise对象，执行完一个`await`语句后，会自动调用返回的Promise对象的resolve函数，等其执行结束后再执行后面的`await`语句；

此外：

- `await`语句也可以接受一个普通的函数（即不返回Promise对象的函数），在这种情况下，该函数会被调用，并立即进入下一个`await`语句。

从这些特点，以及和Generator方式的比较可以看到，两者确实非常相似，async函数可以看成是官方实现的一个"[Co](https://github.com/tj/co)"来解析异步操作，并且制定了略有不同的规则（模式）的一套东西，达到的效果是类似的：即使用像同步编程一样的方式来编写异步操作流程，增强了代码的可读性。