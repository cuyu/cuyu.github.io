---
layout: post
title: "Taking all remaining space"
category: CSS
tags: [flex, grid, W3C spec]
date: 2017-10-23
---

假设页面上有两个元素，一个很经典的CSS布局问题是：如何指定一个元素的宽（高）度，并让另一个元素的宽（高）度占满浏览器。正好之前做的项目中的前端部分碰到了这个问题，这里就来好好研究一下几个解决方法以及它们是如何达到这个效果的。

## Use float ##

> Since a float is not in the flow, non-positioned block boxes created before and after the float box flow vertically as if the float did not exist. However, the current and subsequent line boxes created next to the float are shortened as necessary to make room for the margin box of the float.

float的元素虽然说是脱离文档流了（out of flow），但脱离得并不彻底，在同一个容器内的line boxes还是能看得到浮动的box，并且在布局时会让出空间给浮动的元素。作为对比，`position: absolute`的元素是彻底脱离文档流的，即其他任何元素在布局时都会对它视而不见。

w3c中关于line box的定义如下：

> In an inline formatting context, boxes are laid out horizontally, one after the other, beginning at the top of a containing block. Horizontal margins, borders, and padding are respected between these boxes. The boxes may be aligned vertically in different ways: their bottoms or tops may be aligned, or the baselines of text within them may be aligned. The rectangular area that contains the boxes that form a line is called a [line box]().

一个例子如下：

<p data-height="285" data-theme-id="0" data-slug-hash="eGXvYJ" data-default-tab="css,result" data-user="curiousY" data-embed-version="2" data-pen-title="float - 1" class="codepen">See the Pen <a href="https://codepen.io/curiousY/pen/eGXvYJ/">float - 1</a> by Curtis Yu (<a href="https://codepen.io/curiousY">@curiousY</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

可以看到，`#right`元素其实和左边的浮动元素发生了重叠，即block level box在布局时无视了浮动的元素，而`#right`其中的文字部分却挤在了浮动元素的右侧，即line box是能“看到”浮动的元素的。

浮动属性最初的目的就是如此：文字之类的inline-box可以围绕浮动的box进行分布。

<!--break-->

而由于早期的CSS规范中缺少来定义布局的属性，因此float也被拿来作为布局的workaround了。

同样是上面的例子，如果我们希望`#right`元素不要无视左边的浮动元素，该如何做？

一种思路是把`#right`变成line box，就和那些文字一样，它们是能看到浮动的元素的：

<p data-height="265" data-theme-id="0" data-slug-hash="VMNobM" data-default-tab="css,result" data-user="curiousY" data-embed-version="2" data-pen-title="float - 2" class="codepen">See the Pen <a href="https://codepen.io/curiousY/pen/VMNobM/">float - 2</a> by Curtis Yu (<a href="https://codepen.io/curiousY">@curiousY</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

这种方式虽然浮动元素是被“看见”了，但设定的宽度是不起作用的。

另外一个方法是将`#right`元素也设置为浮动的，因为浮动的元素之间彼此是能看得到的（其实本质上似乎是BFC之间是能看到彼此的，所以只要任意一种方式把`#right`变成可以形成BFC即可，参考[神奇的overflow:hidden](http://cuyu.github.io/css/2017/08/29/%E7%A5%9E%E5%A5%87%E7%9A%84overflowhidden)），所以就达到了目的：

<p data-height="265" data-theme-id="0" data-slug-hash="gGyVwz" data-default-tab="css,result" data-user="curiousY" data-embed-version="2" data-pen-title="float - 3" class="codepen">See the Pen <a href="https://codepen.io/curiousY/pen/gGyVwz/">float - 3</a> by Curtis Yu (<a href="https://codepen.io/curiousY">@curiousY</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

为了达到两栏的布局，第一步已经达到了，第二步就是希望右侧的宽度能够占满所有剩余的空间。由于左边浮动的元素已经占用了一部分空间，所以`width: 100%`肯定是不行的，因此要用`width: auto`，即让浏览器来计算并选择一个宽度。这里绕过复杂的计算方法说明（参考[Computing_widths_and_margins](https://www.w3.org/TR/CSS2/visudet.html#Computing_widths_and_margins)），直接给出答案：

<p data-height="265" data-theme-id="0" data-slug-hash="VMNoxQ" data-default-tab="css,result" data-user="curiousY" data-embed-version="2" data-pen-title="float - 4" class="codepen">See the Pen <a href="https://codepen.io/curiousY/pen/VMNoxQ/">float - 4</a> by Curtis Yu (<a href="https://codepen.io/curiousY">@curiousY</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

## Use flex ##

使用float来达到布局的目的其实是非常tricky的，也让人非常不好理解（了解它主要是为了能理解以前的代码），现在使用专门用于布局的flex属性显然是更佳的选择，并且实践中使用一些CSS的框架/库会可以进行polyfill来兼容一些老的浏览器（其实就是IE啦），所以请放心大胆地用这些新的东西。

这里就直接看代码了：

<p data-height="265" data-theme-id="0" data-slug-hash="wrEGeO" data-default-tab="css,result" data-user="curiousY" data-embed-version="2" data-pen-title="taking remaining width - flex" class="codepen">See the Pen <a href="https://codepen.io/curiousY/pen/wrEGeO/">taking remaining width - flex</a> by Curtis Yu (<a href="https://codepen.io/curiousY">@curiousY</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

## Use grid ##

除了flex以外，用grid也可以非常方便地实现一样的效果：

<p data-height="265" data-theme-id="0" data-slug-hash="LzoYpK" data-default-tab="css,result" data-user="curiousY" data-embed-version="2" data-pen-title="taking remaining width - grid" class="codepen">See the Pen <a href="https://codepen.io/curiousY/pen/LzoYpK/">taking remaining width - grid</a> by Curtis Yu (<a href="https://codepen.io/curiousY">@curiousY</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

由此可以看出，flex布局和grid布局是有一些功能上重叠的部分的，但从大部分功能上来说，grid更偏重整体的布局，而flex则更加擅长处理局部的布局。

## Easter egg ##

最后，我们来做一个简易的拖拽条：

<p data-height="265" data-theme-id="0" data-slug-hash="oGRvZa" data-default-tab="js,result" data-user="curiousY" data-embed-version="2" data-pen-title="drag and drop" class="codepen">See the Pen <a href="https://codepen.io/curiousY/pen/oGRvZa/">drag and drop</a> by Curtis Yu (<a href="https://codepen.io/curiousY">@curiousY</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>