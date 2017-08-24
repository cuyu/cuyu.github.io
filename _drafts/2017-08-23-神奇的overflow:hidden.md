---
layout: post
title: "神奇的overflow:hidden"
category: CSS
tags: [overflow, 坑]
date: 2017-08-23
---

最近用[react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form)重写之前写过的一个表单页面，发现布局上出现了很大的问题，表单行与行之间贴在了一起（包裹每一行元素的DOM高度为0了），如下图所示：

![screenshot1](/images/2017-08-23-神奇的overflow:hidden.png)

而重写之前的表单是好的：

![screenshot2](/images/2017-08-23-神奇的overflow:hidden-1.png)

网上简单搜索了下，发现只要把父级元素的`overflow`属性设为`hidden`即可。那么这是怎么样一个机制呢？还有一个问题就是，原先的表单也并没有手动设置过`overflow`这个属性，为什么就没有问题（都是直接用的bootstrap的样式）？

<!--break-->

Formatting context##

首先要彻底弄明白设置`overflow:hidden`work的原因，就要从formatting context讲起。

Styles in bootstrap##

经过仔细的比对，发现两张表单唯一的区别就是重写之前的表单`form`元素多了一个`form-horizontal`的类，把这个类去掉则和重写后的表达有了一样的问题。但是我用[CSS Diff](https://chrome.google.com/webstore/detail/css-diff/pefnhibkhcfooofgmgoipfpcojnhhljm)来直接比较两个表单的计算后的css并没有得到太大的区别，也是蛮奇怪的。

![CSS Diff](/images/2017-08-23-神奇的overflow:hidden-3.png)

然后我们来看`form-horizontal`带来的应用上的CSS：

![form-horizontal](/images/2017-08-23-神奇的overflow:hidden-2.png)

原来是pseudo element在捣鬼！也就是说[CSS Diff](https://chrome.google.com/webstore/detail/css-diff/pefnhibkhcfooofgmgoipfpcojnhhljm)并没有把伪元素的差别算在内，因为它比较的是计算过后CSS，而伪元素带来的效果在计算过后只是体现在了`height`等属性上，即我们知道结果是有差别的，却不知道是什么导致了这种差别（即导致这种差别的原因并不能体现在计算过后的CSS上，比如`overflow:hidden`是可以在计算后的CSS上看到的）。

即关键在于这个CSS：

```css
.form-horizontal .form-group:before,
.form-horizontal .form-group:after {
  display: table;
  content: " ";
}
```

这个CSS之所以能达到和`overflow:hidden`一样的效果，是因为

当然，`form-horizontal`还影响了一些其他的属性，比如让表单的label靠右对齐，并且竖直方向居中了：

```css
@media (min-width: 768px) {
  .form-horizontal .control-label {
    padding-top: 7px;
    margin-bottom: 0;
    text-align: right;
  }
}
```

