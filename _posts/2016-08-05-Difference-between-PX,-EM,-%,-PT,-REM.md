---
layout: post
title: "Difference between PX, EM, %, PT, REM"
category: Web
tags: [CSS]
date: 2016-08-05
---

### 定义

对于一个给定的显示器而言，**PX**, **PT**衡量的是绝对大小（static measurements），而**%**, **EM**和**REM**衡量的都是相对大小（relative measurements），其中前两者都是相对于父元素（parent element）中定义的尺寸的相对大小，而REM是相对于根元素（root element）中定义的尺寸的相对大小。（所以说，根元素总是要定义一个绝对大小，这样其他元素才能根据它把相对大小转换成绝对大小。）

而对于不同分辨率(准确说是不同dpi)的显示器而言，上述的绝对大小也变成了相对大小了:

> the CSS `px` unit **does not** equal one physical display pixel. This has *always* been true – even in the 1996 [CSS 1 spec](http://www.w3.org/TR/2008/REC-CSS1-20080411/#length-units).
>
> CSS defines the *reference pixel*, which measures the size of a pixel on a 96 dpi display. On a display that has a dpi substantially different than 96dpi (like Retina displays), the user agent rescales the `px` unit so that its size matches that of a reference pixel. In other words, this rescaling is exactly why 1 CSS pixel equals 2 physical Retina display pixels.

<!--break-->

### 互相转换

假设我设定了如下的css：

```css
html {
  font-size: 20px;
}
body {
  font-size: 16px;
}
body div {
  font-size: 12px;
}
```

那么对于body里面的div的字体大小，除了设为12px以外，还等价于以下的设置：

**PX to EM**

Formula: size in pixels / parent size in pixels

Example: 12px / 16px = .75em

**PX to %**

Formula: size in pixels / parent size in pixels * 100

Example: 12px / 16px * 100 = 75%

**PX to PT**

Formula: size in pixels * (points per inch / pixels per inch)

Example: 12px * (72pt / 96px) = 9pt

**EM to PX**

Formula: size in EMs * parent size in pixels

Example: .75em * 16px = 12px

**EM to %**

Formula: size in EMs * 100

Example: .75em * 100 = 75%

**PX to REM**

Formula: size in pixels / root size in pixels

Example: 12px / 20px = 0.6rem

### 怎样选择

个人建议：尽量使用`rem`作为单位，尤其是字体（这样如果我需要调整整个页面字体大小的话只需要修改根元素就可以了），对于一些固定大小的元素可以使用`px`作为单位（比如一些图片），`em`和`%`一般不需要用。

如果要考虑一些旧的浏览器的兼容性，可以用如下的方法设置css（如果浏览器不支持`rem`则会使用前面设置的`px`单位的属性，否则后面的`rem`的属性会覆盖前面的）：

```css
html { font-size: 62.5%; }
body { font-size: 14px; font-size: 1.4rem; } /* =14px */
h1   { font-size: 24px; font-size: 2.4rem; } /* =24px */
```
