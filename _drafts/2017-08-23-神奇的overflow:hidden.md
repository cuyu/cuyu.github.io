---
layout: post
title: "神奇的overflow:hidden"
category: CSS
tags: [overflow]
date: 2017-08-23
---

最近用[react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form)重写之前写过的一个表单页面，发现布局上出现了很大的问题，表单行与行之间贴在了一起（包裹每一行元素的DOM高度为0了），如下图所示：

![]()

而重写之前的表单是好的：

![]()

网上简单搜索了下，发现只要把父级元素的`overflow`属性设为`hidden`即可。那么这是怎么样一个机制呢？还有一个问题就是，原先的表单也并没有设置过`overflow`这个属性，为什么就没有问题（都是直接用的bootstrap的样式）？

