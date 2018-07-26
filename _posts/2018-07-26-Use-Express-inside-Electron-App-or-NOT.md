---
layout: post
title: "Use Express inside Electron App, or NOT"
category: Javascript
tags: [Electron]
date: 2018-07-26
---

前端js代码在浏览器中运行时是放在沙盒中的，因此有很多的限制，比如不能直接访问本地的文件。而Electron虽然是基于浏览器内核，但移除了这些限制，所以完全可以在前端的代码中使用Node.js的库（某种意义上来说，这里已经不区分前端和后端了，但事实上许多代码是重用/按照原先前端的代码来写的）。

在Electron的世界里，你完全可以在React的组件中直接读取本地的文件并显示出来！那为什么我们还要在Electron中放一个后端的http server？

### Why

从我的角度来看，首先是因为这样的开发体验是统一的。大多数的前端开发者已经习惯了通过向后端发送请求来获取资源的方式，而在前端代码中夹杂Node.js代码则让人有点“膈应”。其次，是为了减少代码的开发和维护。有些项目原本是使用C/S架构的，但又想提供一个桌面的本地应用，将整个前后端打包放到一起是最省事的。

### Why not

恰好社区也有人问了这个[问题](https://discuss.atom.io/t/would-you-use-express-in-an-electron-app/39936/2)，这里是一些答案：

> You could and some people have, but bear in mind that this would incur the overhead of HTTP protocol and the full networking stack. So it would have lower performance than the simple pipe used for IPC. It depends on what you want to do and whether you would be running it on devices with weaker processors.

> Another thing to keep in mind is that any website the user loads in an external browser can access the Express server you spin up on the user’s machine. I suspect a lot of people spinning up Express on user machines have given little thought to the associated security concerns.

总结一下：

- HTTP协议会增加数据传输的开销，降低性能。
- Electron中打包的web server可能被外部访问，有安全隐患。