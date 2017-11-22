---
layout: post
title: "React Native初窥"
category: Javascript
tags: [React Native]
date: 2017-11-20
---

1. 类似于`create-react-app`，React Native也有一款用来快速创建项目的工具，叫`create-react-native-app`。使用该工具来初始化一个项目，你会发现项目比用`create-react-app`创建的还要简洁，查看`package.json`，里面的依赖除了`react`和`react-native`，还有一个叫作`expo`的库。

2. `expo`对手机端的一些API做了一些封装，从而可以使用JavaScript来调用这些API（比如打开照相机）。它的工作原理其实就是在原有API上添加了一个中间层，这个中间层（就是`expo`）来和底层的API打交道，而我们的代码只需要和中间层打交道即可。因此，不同的手机端系统上，`expo`的实现应该是不同的，但保证了应用层代码的一致性。

3. 使用`expo`的话，在手机上必须要安装对应的app，在电脑上`npm start`之后扫打印出来的码就可以在手机上调试写的app了，非常的方便。当然，也可以用电脑上的手机模拟器来调试，不过需要安装Xcode（iOS）。它的工作原理是电脑端启动了一个http server，然后手机端作为client来下载代码并执行，所以电脑和手机必须要在同一个子网内才能工作。

4. 使用`create-react-native-app`创建的项目的入口在`App.js`，但查看`App.js`却并不能看到类似`register(App)`之类的语句，而只是简单的export了一个React组件。似乎入口是`App.js`是被hard code的。查看`package.json`，可以看到这么一行：

   ```
     "main": "./node_modules/react-native-scripts/build/bin/crna-entry.js",
   ```

   其实这个文件才是真正的入口，继续查看该文件，可以看到：

   ```javascript
   var _App = require('../../../../App');
   ```

   的确是hard code的，之所以要hard code是因为JavaScript目前不支持动态加载（see [https://github.com/react-community/create-react-native-app/issues/152](https://github.com/react-community/create-react-native-app/issues/152)）。

   回想一下React的项目为什么没有这种限制，是因为它是用Webpack把所有后缀是`js`和`jsx`的文件打包起来了最后放到浏览器中一起执行，所以只要这其中某一个文件中包含一个入口即可。

