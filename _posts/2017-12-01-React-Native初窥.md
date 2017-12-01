---
layout: post
title: "React Native初窥"
category: Javascript
tags: [React Native]
date: 2017-12-01
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

   <!--break-->

5. 把一个React web app转换成一个React Native app，碰到了以下的问题：

   - CSS不能用了，要使用React Native提供的`StyleSheet`来创建样式对象（类似CSS in JS的做法），且各种属性名称也不太一样（[react-native-css](https://github.com/sabeurthabti/react-native-css)这个库可以把CSS转换成React Native的样式类）。
   - 浏览器中的一些DOM（比如`div`、`input`）不能使用了（React Native强制要求所有的JSX组件名称要以大写字母开头，所以用了这些的话会直接报错）。类似的，可以用`View`代替`div`，`TextInput`代替`input`等等。
   - 一些操作需要替换成更符合触摸屏的操作方式，比如一些按键的操作可能要改为手机左右的滑动。

6. 关于debug，在手机端或模拟器上的`expo`中可以启用remote debugging的模式（模拟器中按`⌘+D`来启用），然后在浏览器中打开对应的页面即可（因为是remote debugging，浏览器中并不会有你的app的界面，你还是要在手机端操作，但可以在浏览器中浏览源码并打断点），注意在Console或Sources中要选择debuggerWorker.js再操作。

7. 想要像React app那样在浏览器中（安装对应的插件）可以很方便地查看React组件以及Redux状态？只需要安装[react-native-debugger](https://github.com/jhen0409/react-native-debugger)：

   ```shell
   $ brew update && brew cask install react-native-debugger
   ```

   然后，可以安装[react-native-debugger-open](https://www.npmjs.com/package/react-native-debugger-open)来修改`react-native`启用remote debugging时的默认行为（从打开浏览器变成打开[react-native-debgger](https://github.com/jhen0409/react-native-debugger)）（注意安装完成后还要执行一下`rndebugger-open`，因为它其实是给`react-native`打了一个patch）。
   <img title="2017-11-20-React-Native初窥.png" src="/images/2017-11-20-React-Native初窥.png" width="2217" />
   <span class="caption">react-native-debugger</span>

8. 要查看各个组件的布局样式，同样是在`expo`中开启Toggle Element Inspector（`⌘+D`再选择该选项），然后你在[react-native-debugger](https://github.com/jhen0409/react-native-debugger)（或浏览器dev console）中选择某个元素时，手机端会联动地显示对应元素的位置：
   <img title="element inspector" src="https://facebook.github.io/react-native/img/ReactDevToolsInspector.gif">

9. React Native使用了flex作为布局的规则，但和网页中的flex布局不同的是，默认情况下`flexDirection`是column，而网页中则是row，并且`flex`属性只能是数字。当然，如果不需要填充满整个父元素的话，不添加`flex`属性即可。

10. 在React Native中可以调用一些移动端特有的API，比如屏幕上手势的滑动。但注意它并没有提供封装好的手势，比如并没有一个专门的API是在手指向左滑动时被调用，而是提供了一个更加原始的函数`PanResponder`，它会追踪手指按压屏幕直到手指离开屏幕的整个过程，并提供了接口可以在这个过程的不同环节做事情。因此，手指向左滑动就可以简化为在手指按压屏幕时记录下坐标，再离开屏幕时再记录下坐标，计算两个坐标之间的关系是否后者在前者的左边。或者，更偷懒一点，直接用第三方封装的组件也可以，比如[react-native-swipe-gestures](https://github.com/glepur/react-native-swipe-gestures)。

