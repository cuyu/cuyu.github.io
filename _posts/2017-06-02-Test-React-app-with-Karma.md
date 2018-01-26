---
layout: post
title: "Test React app with Karma"
category: Javascript
tags: [Karma, React]
date: 2017-06-02
---

![karma-logo](http://karma-runner.github.io/assets/img/banner.png)

### Why Karma?###

前端的工具真的太多了，多的有点让人眼花缭乱。问题是我们真的需要这么多的工具吗？我觉得对于一个成熟的需要长期更新维护的代码库而言，是的，真的需要😂，最起码每一类工具总得需要选择一个来使用。而对于那些“一次性”的作品，我觉得很多工具大可省略不用（它们甚至连测试代码都可以不需要）。而[Karma](http://karma-runner.github.io/)就是属于那一类可用可不用的工具。这类可用可不用的工具有一些共性，它们要么是为了解决因项目复杂度提高而产生的问题（小项目可以不用），要么是为了提高开发的效率（不那么关心效率的话可以不用）。

[Karma](http://karma-runner.github.io/)正是为效率而生。

我们先回忆下现在大部分的后端测试流程，应该是像下面这样：

```
代码改动 => 执行测试 ==Pass=> 发布
   ^          |
   |==Fail====|
```

具体代码改动多少来执行一次测试则各个项目都有所不同了。一个比较普遍的做法是，在产品发布较大的版本变更之前，执行一到两次full regression test（也就是所有测试都要执行）；在代码要合并（或提交）到主要的代码分支上时，执行smoke test（当然如果full regression test耗时短的话，也可以在这里执行full regression）（这里通常是和CI集成在一起的，不需要手动去执行测试）。

<!--break-->

前端的测试流程其实和后端是类似的，它们的主要的区别在于：

- 后端的测试代码往往执行时间要远多于前端的测试代码；
- 一些后端的开发代码编译耗时远大于前端代码；

这也导致了后端的测试的频度不会太高。想象一下，某一个后端的项目编译就需要半个小时，测试代码执行再花个半个小时，如果我仅仅是修改了某个函数中的某行代码，我会愿意去花这一个小时来测试下是否我的这个修改产生了bug吗？即使每一次代码修改都这样做了，虽然保证了代码质量，但效率得多低啊。

而前端测试就没有上面的这个问题，因为我的编译加上测试可能总共也就1分钟，完全可以做到每一次提交代码都执行一遍测试。而[Karma](http://karma-runner.github.io/)则可以将测试的粒度进一步细化：每一次有文件修改都执行一遍测试！这样带来的直接的好处是：原先提交了代码才能发现的bug现在可以立马就发现了，省去了定位bug的时间。所以我说[Karma](http://karma-runner.github.io/)是提高效率的工具。

除此之外，这种以文件修改来执行测试的粒度还有一个好处，它让TDD (Test Driven Develop) 变得非常容易，你完全可以先把测试代码写好，再来写开发代码，直到开发代码可以满足所有的测试代码都通过为止。

另外，[Karma](http://karma-runner.github.io/)是将测试的代码放入真实的浏览器中去执行的，即同时测试了生产环境依赖和兼容性。

以上，**[Karma](http://karma-runner.github.io/)是一种Test Runner工具，它可以让测试在代码发生很少的变动后就执行，从而在保证开发质量的基础上提高了开发的效率。**（如果要和后端类比的话，它有点像是Jenkins的角色）

### Test a React app###

现在，假如我现在想写一个简单的测试函数，就测一下我一个已经实现了的React app（由`create-react-app`生成）能否成功加载到页面上。一个简单直接的想法是直接在测试的代码中import包含React app渲染的那个js文件不就好了？然而，这样做会发现如下错误：

```
Invariant Violation: _registerComponent(...): Target container is not a DOM element.
```

简单说就是不存在对应的DOM，因为React app渲染是依赖一个已有的html文件的（比如html中有一个id为`root`的div，我们的app会渲染到这个div上），而现在我们测试的代码是从完全空白的页面开始的。OK，那么先研究下`create-react-app`是怎么把两者关联起来的：

首先，在执行`npm start`的时候，`create-react-app`会先使用webpack来将所有依赖的代码打包到一个js文件中，所以无论你的React渲染的代码写在哪里，最后执行了打包好的js文件也就执行了渲染的代码。

其次，在打包好js文件之后，`create-react-app`会启动一个web server来host所有的资源，其中它写死了只有在`public`文件夹下的文件会被当做资源加载到server上，因此在这个web server上，我们会打开`public/index.html`页面，并在上面运行我们的渲染React app的js代码。

------

以上，为了避免一开始出现的错误，要么就像下面的代码那样人为创建一个DOM再执行渲染，要么就也把之前的html文件加载到测试的server上（如果用Karma的话，可以用[html2js preprocessor](https://github.com/karma-runner/karma-html2js-preprocessor)来把html文件像js一样加载进来）。

```jsx
import {expect} from "chai";
import React from 'react';
import ReactDOM from 'react-dom';
import App from '../src/App';

describe("app", () => {
    it("loads without problems", () => {
        const div = document.createElement('div');
        document.body.appendChild(div);
        ReactDOM.render(<App />, div);
    });
});
```

### Test React app with Karma###

和Babel需要写一个`.babelrc`配置文件类似，Karma也需要写一个`karma.conf.js`作为它的配置文件。具体怎么写这个配置文件这里不多讲，建议参考[react-karma-webpack-testing](https://github.com/justinwoo/react-karma-webpack-testing)这个项目。

这里提几个碰到的坑：

- 如果项目用到了`react-router`，Karma测试默认打开的页面路径是`/debug.html`，不是`/`哦，这里可能会有问题；
- 项目的入口函数所在的js文件（一般是`index.js`）不要打包加载到Karma的server上，否则除了测试代码以外，项目也会随着加载而执行（如果是想测试整个项目的加载那也是放到测试代码里面）；
- 如果觉得弄Babel的设置比较麻烦，可以直接用`create-react-app`一样的preset，即`react-app`这个preset，前提是需要设定一个环境变量`NODE_ENV=development`；