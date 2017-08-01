---
layout: post
title: "Redux进阶之multiple reducers"
category: Javascript
tags: [React, Redux, 心得]
date: 2017-03-23
---

之前用Redux写应用都是只用一个reducer函数来处理所有的action，对于复杂的应用而言，这样显然是不科学的（不然Redux也没必要特地提供一个`combineRedcuers`函数啊）。

在用Redux之前看到过下面这张图片印象非常深，那篇[文章](http://imweb.io/topic/57711e37f0a5487b05f325b5)是讲Redux和Flux的区别的。

![redux-flow](/images/2017-03-24-redux-flow.png)

那么上面这张图中的树状结构的reducer（nested reducers）到底长什么样子呢？

```javascript

```



之前说到过[^1]Redux中当一个action被dispatch之后，所有注册的reducer都会被执行。这个说法还不够准确，



[^1]: 参考之前写的这篇[入门]。

Reference

1. [Nested redux reducers](http://stackoverflow.com/questions/36786244/nested-redux-reducers)