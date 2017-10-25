---
layout: post
title: "babel-node VS babel-register"
category: Javascript
tags: [babel, Webstorm]
date: 2017-10-25
---

最近尝试用了下[react-starter-kit](https://github.com/kriasoft/react-starter-kit)，其中进行polyfill的方式是直接使用`babel-node`来执行Node.js脚本，比如`npm start`对应的命令为：

```
babel-node tools/run start
```

这个命令本身并没有什么问题，问题在于使用`babel-node`的方式无法用Webstorm进行debug，作为替代，官方建议使用如下的方式来执行脚本（见[How to make Webstorm 2016.2 debug work with ES6 and babel](https://intellij-support.jetbrains.com/hc/en-us/community/posts/203373470-How-to-make-Webstorm-2016-2-debug-work-with-ES6-and-babel)）：

```
node -r babel-register tools/run start
```

然后问题就来了，在我尝试用后者来执行同样的脚本时冒出了下面的错误：

```
ReferenceError: regeneratorRuntime is not defined
```

这个错误的原因是async/await这类的生成器语句没有被polyfill因而编译器执行时不认识这些语句了。但为什么后者会出现这样的问题呢？以及究竟要怎样做才能成功地使用Webstorm结合Babel进行debug呢？

<!--break-->

## babel-node VS babel-register ##

首先来解释为什么。

`node -r babel-register`其实相当于在执行后面指定的JS脚本之前先加载了`babel-register`（`-r`等同于`--require`）。因此上面发生错误的命令类似于使用node执行了下面的代码：

```javascript
require('babel-register');
require('./run.js');
```

加载了`babel-register`之后，所有的JS代码就会在run time时先预编译（默认根据项目中的`.babelrc`配置）再执行（其实现的原理是它对`require`函数添加了一个hook使得每次加载模块时会先预编译）。由于预编译是run time的，因此会比先预编译好所有代码在执行要效率低些，因此不建议在生产环境中使用这种方式（`babel-node`也同理）。

另外，`babel-register`可以显式指定Babel配置：

```javascript
var babelConfig = require('../.babelrc.js');
require('babel-register')(babelConfig);
```

而`babel-node`其实内部的实现也是用到了`babel-register`的，参考[stackoverflow](https://stackoverflow.com/questions/42335924/babel-node-vs-babel-register-in-development)：

> `babel-node` basically calls `babel-register` internally. see [source](https://github.com/babel/babel/blob/master/packages/babel-cli/src/_babel-node.js#L30-L36). The differences are
>
> 1. when using `babel-node` the entry-point itself will also run through babel vs. `babel-register`only files required after `babel-register` is required will be run through babel.
> 2. if you need `babel-polyfill` (for eg. generators) `babel-node` will pull it in automatically, vs. `babel-register` you'd need to do that yourself. This is something to keep in mind when building for production. If you need `babel-polyfill` and you are using `babel-node` in development, you'd need to make sure you are building w/ `babel-polyfill` when building for production.

所以，主要的区别在于，`babel-node`默认就用了`babel-polyfill`！这也是为什么前面使用`babel-register`的命令会报错的原因，并且错误恰好也是缺少了`babel-polyfill`导致的。

## Why babel-polyfill? ##

这里顺便解释下为什么Babel都已经根据配置进行预编译了，却还是需要`babel-polyfill`。原因其实很简单，（以ES6代码预编译为ES5环境可运行为例）因为Babel只是把之前不支持的**语法**进行了转换，比如ES5中并没有生成器的概念，以下面的代码为例：

```javascript
function* foo() {
    yield 1;
}
```

使用Babel设置为（当然现在建议使用`babel-preset-env`，更加省心一些）：

```json
{
  "presets": ["es2015"]
}
```

就得到了：

```javascript
"use strict";

var _marked = /*#__PURE__*/regeneratorRuntime.mark(foo);

function foo() {
    return regeneratorRuntime.wrap(function foo$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.next = 2;
                    return 1;

                case 2:
                case "end":
                    return _context.stop();
            }
        }
    }, _marked, this);
}
```

在ES5的运行环境中运行上述脚本，会发现报错了，且错误和开头的时候一样：

```
ReferenceError: regeneratorRuntime is not defined
```

也就是说**`babel-preset-es2015`等只是对语法做了转换，而并不会管转换后用到的函数是否在指定的环境被标准库所支持**，因此这里就需要`babel-polyfill`来将之前不支持的函数进行注入。又比如说`Object.assign`这个函数是ES6中新添加进标准库的一个函数，经过`babel-preset-es2015`转换后，Babel并没有去理这个函数，因为它并不是什么全新的语法，看上去就是一个正常的函数，而使用了`babel-polyfill`之后，它会对`Object`的原型链进行注入，添加一个`assign`属性的函数，从而在ES5的环境中也可以正常执行`Object.assign`函数了。

## Why not babel-polyfill? ##

从上面的表述也能知道`babel-polyfill`会把所有之前不存在的函数通过原型链注入的方式注入到运行环境中，这样做看上去并没有什么不妥，但实际上可能会产生一些问题：

- 它污染了标准库，如果进行库开发的话必须要考虑到这一点；
- 因为对所有不支持的函数都进行了注入，polyfill之后的文件可能会包含一部分没用上的代码，导致文件体积较大。

但对于大部分的前端应用来说，上面两个缺点影响其实不大，所以通常就直接用`babel-polyfill`解决了事，很方便。

以下介绍一个**可能**的替代方案：`babel-plugin-transform-runtime`。

安装好该插件并把之前的`.babelrc`改为：

```json
{
  "presets": ["es2015"],
  "plugins": ["transform-runtime"]
}
```

上面同样的代码就转换为了：

```javascript
"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _marked = /*#__PURE__*/_regenerator2.default.mark(foo);

function foo() {
    return _regenerator2.default.wrap(function foo$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.next = 2;
                    return 1;

                case 2:
                case "end":
                    return _context.stop();
            }
        }
    }, _marked, this);
}
```

可以看到之前通过注入的`regeneratorRuntime`现在变成了从`babel-runtime/regenerator`中import进来了，也就没有污染原先的全局空间。但同时一些**标准库中原型链上的函数就没办法转换了**，比如`Array.prototype.includes`函数，我在代码中创建了一个列表，它并不会转换`a.includes(1)`中的`includes`函数（毕竟用import的方式管不了原型链啊）。

## Solve the problem ##

回到开始的那个问题，解决的方法就是引入`babel-polyfill`，即在`.babelrc`中加入这个plugin即可：

```json
{
  "presets": ["es2015"],
  "plugins": ["module:babel-polyfill"]
}
```

然后就可以愉快的执行命令了：

```
node -r babel-register tools/run start
```

当然，这样用Webstorm来debug也不是事儿了。

## Reference ##

1. [http://guoyongfeng.github.io/my-gitbook/03/toc-babel-polyfill.html](http://guoyongfeng.github.io/my-gitbook/03/toc-babel-polyfill.html)
2. [Babel polyfill 知多少](https://zhuanlan.zhihu.com/p/29058936)
3. [How are generators transpiled to ES5](http://cmichel.io/how-are-generators-transpiled-to-es5/)