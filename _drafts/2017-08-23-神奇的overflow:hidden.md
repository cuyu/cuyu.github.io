---
layout: post
title: "神奇的overflow:hidden"
category: CSS
tags: [formatting context, 坑]
date: 2017-08-23
---

最近用[react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form)重写之前写过的一个表单页面，发现布局上出现了很大的问题，表单行与行之间贴在了一起（包裹每一行元素的DOM高度为0了），如下图所示：

![screenshot1](/images/2017-08-23-神奇的overflow:hidden.png)

而重写之前的表单是好的：

![screenshot2](/images/2017-08-23-神奇的overflow:hidden-1.png)

网上简单搜索了下，发现只要把父级元素的`overflow`属性设为`hidden`即可。那么这是怎么样一个机制呢？还有一个问题就是，原先的表单也并没有手动设置过`overflow`这个属性，为什么就没有问题（都是直接用的bootstrap的样式）？

<!--break-->

##Formatting context##

首先要彻底弄明白设置`overflow:hidden`work的原因，就要从formatting context讲起（参考[w3c标准](https://www.w3.org/TR/CSS2/visuren.html#normal-flow)）。首先，每个DOM元素都有一个formatting context，它要么是block formatting context，要么是inline formatting context。元素的formatting context类型决定了该元素内部的元素是怎样堆叠排列的，比如在block formatting context中：

> In a block formatting context:
>
> - boxes are laid out one after the other, vertically, beginning at the top of a containing block. The vertical distance between two sibling boxes is determined by the ['margin'](https://www.w3.org/TR/CSS2/box.html#propdef-margin) properties. Vertical margins between adjacent block-level boxes in a block formatting context [collapse](https://www.w3.org/TR/CSS2/box.html#collapsing-margins).
> - each box's left outer edge touches the left edge of the containing block (for right-to-left formatting, right edges touch). This is true even in the presence of floats (although a box's *line boxes* may shrink due to the floats), unless the box establishes a new block formatting context (in which case the box itself [*may* become narrower](https://www.w3.org/TR/CSS2/visuren.html#bfc-next-to-float) due to the floats).

而在inline formatting context中，规则要复杂一些：

> In an inline formatting context:
>
> - boxes are laid out horizontally, one after the other, beginning at the top of a containing block. Horizontal margins, borders, and padding are respected between these boxes. The boxes may be aligned vertically in different ways: their bottoms or tops may be aligned, or the baselines of text within them may be aligned. The rectangular area that contains the boxes that form a line is called a [line box]().
> - The width of a line box is determined by a [containing block](https://www.w3.org/TR/CSS2/visuren.html#containing-block) and the presence of floats. The height of a line box is determined by the rules given in the section on [line height calculations](https://www.w3.org/TR/CSS2/visudet.html#line-height).
> - ...

和我们现在问题相关的，在于其中的高度计算那部分：

> The height of a line box is determined as follows:
>
> 1. The height of each inline-level box in the line box is calculated. For replaced elements, inline-block elements, and inline-table elements, this is the height of their margin box; for inline boxes, this is their 'line-height'. (See ["Calculating heights and margins"](https://www.w3.org/TR/CSS2/visudet.html#Computing_heights_and_margins) and the [height of inline boxes](https://www.w3.org/TR/CSS2/visudet.html#inline-box-height) in ["Leading and half-leading"](https://www.w3.org/TR/CSS2/visudet.html#leading).)
> 2. The inline-level boxes are aligned vertically according to their ['vertical-align'](https://www.w3.org/TR/CSS2/visudet.html#propdef-vertical-align) property. In case they are aligned 'top' or 'bottom', they must be aligned so as to minimize the line box height. If such boxes are tall enough, there are multiple solutions and CSS 2.1 does not define the position of the line box's baseline (i.e., the position of the [strut, see below](https://www.w3.org/TR/CSS2/visudet.html#strut)).
> 3. The line box height is the distance between the uppermost box top and the lowermost box bottom. (This includes the [strut,](https://www.w3.org/TR/CSS2/visudet.html#strut) as explained under ['line-height'](https://www.w3.org/TR/CSS2/visudet.html#propdef-line-height) below.)

这样理下来原因就有一些明朗了，在出现问题的表单中，包裹表单的label和input元素的父元素应该是inline formatting context，而由于label和input元素（均为block-level element）都不会产生inline-level box，所以它们的高度都没有被计算在内，最终它们父元素的高度就是0了。而对该父元素设置`overflow:hidden`，便把它转换为了block formatting context，它计算高度自然会把其中的block-level element高度都计算在内，自然就不为0了。

至于到底哪些元素会形成block formatting context，可以参考如下规则：

> A block formatting context is a box that satisfies at least one of the following:
>
> - the value of "float" is not "none",
> - the used value of "overflow" is not "visible",
> - the value of "display" is "table-cell", "table-caption", or "inline-block",
> - the value of "position" is neither "static" nor "relative".

而不满足上面任何一条的就是inline formatting context。

##Block-level box VS. block-level element VS. block formatting context##

因为上面出现了这些概念，这里稍微做个梳理。

> [Block-level elements]() are those elements of the source document that are formatted visually as blocks (e.g., paragraphs). The following values of the ['display'](https://www.w3.org/TR/CSS2/visuren.html#propdef-display) property make an element block-level: 'block', 'list-item', and 'table'.
>
> [Block-level boxes]() are boxes that participate in a [block formatting context.](https://www.w3.org/TR/CSS2/visuren.html#block-formatting) Each block-level element generates a [principal block-level box]() that contains descendant boxes and generated content and is also the box involved in any positioning scheme. Some block-level elements may generate additional boxes in addition to the principal box: 'list-item' elements. These additional boxes are placed with respect to the principal box.

简单来说，一个元素是block-level element还是inline-level element仅仅是由它的`display`属性决定的。而一个block-level element可以产生一个或多个block-level box（这里的box是一个虚拟的概念，它主要用于formatting context中的计算）。但反过来说，是否所有能产生block-level box的都是block-level element呢？答案是否定的。比如`display:inline-block`的元素同样会生成block-level box（存个疑，不完全确定~）:

> - [**block**]()
>
>   This value causes an element to generate a block box.
>
> - [**inline-block**]()
>
>   This value causes an element to generate an inline-level block container. The inside of an inline-block is formatted as a block box, and the element itself is formatted as an atomic inline-level box.
>
> - [**inline**]()
>
>   This value causes an element to generate one or more inline boxes.
>
> - [**list-item**]()
>
>   This value causes an element (e.g., LI in HTML) to generate a principal block box and a marker box. For information about lists and examples of list formatting, please consult the section on [lists](https://www.w3.org/TR/CSS21/generate.html#lists).
>
> - **none**
>
>   [This value]() causes an element to not appear in the [formatting structure](https://www.w3.org/TR/CSS21/intro.html#formatting-structure) (i.e., in visual media the element generates no boxes and has no effect on layout). Descendant elements do not generate any boxes either; the element and its content are removed from the formatting structure entirely. This behavior **cannot** be overridden by setting the ['display'](https://www.w3.org/TR/CSS21/visuren.html#propdef-display) property on the descendants.Please note that a display of 'none' does not create an invisible box; it creates no box at all. CSS includes mechanisms that enable an element to generate boxes in the formatting structure that affect formatting but are not visible themselves. Please consult the section on [visibility](https://www.w3.org/TR/CSS21/visufx.html#visibility) for details.
>
> - [table](https://www.w3.org/TR/CSS21/tables.html#value-def-table), [inline-table](https://www.w3.org/TR/CSS21/tables.html#value-def-inline-table), [table-row-group](https://www.w3.org/TR/CSS21/tables.html#value-def-table-row-group), [table-column](https://www.w3.org/TR/CSS21/tables.html#value-def-table-column), [table-column-group](https://www.w3.org/TR/CSS21/tables.html#value-def-table-column-group), [table-header-group](https://www.w3.org/TR/CSS21/tables.html#value-def-table-header-group), [table-footer-group](https://www.w3.org/TR/CSS21/tables.html#value-def-table-footer-group), [table-row](https://www.w3.org/TR/CSS21/tables.html#value-def-table-row), [table-cell](https://www.w3.org/TR/CSS21/tables.html#value-def-table-cell), and [table-caption](https://www.w3.org/TR/CSS21/tables.html#value-def-table-caption)
>
>   These values cause an element to behave like a table element (subject to restrictions described in the chapter on [tables](https://www.w3.org/TR/CSS21/tables.html)).

那么，block-level element和block formatting context又有什么关系呢？是否所有的block-level element都会形成一个block formatting context？又是否能形成block formatting context的都是block-level element？答案是都不一定。比如`display: block; overflow: visible; float: none; position: static`的元素就不会形成block formatting context；而`display:inline-block`的元素就可以形成block formatting context，但它是一个inline-level element。

最后，需要提一点，一个元素最终的CSS属性（computed value）可能是由多方面共同决定的，并不是说你设了什么就是什么，比如说`display`属性，它是由`display`、`position`、`float`属性共同决定的：

> The three properties that affect box generation and layout — ['display'](https://www.w3.org/TR/CSS21/visuren.html#propdef-display), ['position'](https://www.w3.org/TR/CSS21/visuren.html#propdef-position), and ['float'](https://www.w3.org/TR/CSS21/visuren.html#propdef-float) — interact as follows:
>
> 1. If ['display'](https://www.w3.org/TR/CSS21/visuren.html#propdef-display) has the value 'none', then ['position'](https://www.w3.org/TR/CSS21/visuren.html#propdef-position) and ['float'](https://www.w3.org/TR/CSS21/visuren.html#propdef-float) do not apply. In this case, the element generates no box.
> 2. Otherwise, if ['position'](https://www.w3.org/TR/CSS21/visuren.html#propdef-position) has the value 'absolute' or 'fixed', the box is absolutely positioned, the computed value of ['float'](https://www.w3.org/TR/CSS21/visuren.html#propdef-float) is 'none', and display is set according to the table below. The position of the box will be determined by the ['top'](https://www.w3.org/TR/CSS21/visuren.html#propdef-top), ['right'](https://www.w3.org/TR/CSS21/visuren.html#propdef-right), ['bottom'](https://www.w3.org/TR/CSS21/visuren.html#propdef-bottom) and ['left'](https://www.w3.org/TR/CSS21/visuren.html#propdef-left) properties and the box's containing block.
> 3. Otherwise, if 'float' has a value other than 'none', the box is floated and 'display' is set according to the table below.
> 4. Otherwise, if the element is the root element, 'display' is set according to the table below, except that it is undefined in CSS 2.1 whether a specified value of 'list-item' becomes a computed value of 'block' or 'list-item'.
> 5. Otherwise, the remaining ['display'](https://www.w3.org/TR/CSS21/visuren.html#propdef-display) property values apply as specified.
>
> | Specified value                          | Computed value    |
> | ---------------------------------------- | ----------------- |
> | inline-table                             | table             |
> | inline, table-row-group, table-column, table-column-group, table-header-group, table-footer-group, table-row, table-cell, table-caption, inline-block | block             |
> | others                                   | same as specified |

##Styles in bootstrap##

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
  clear: both;
}
```

根据[w3c](https://www.w3.org/TR/CSS2/generate.html#before-after-content)，一个元素拥有`:before`或`:after`的伪元素相当于在该元素内最前面或最后面插入了一个元素。比如上面的CSS的结果相当于：

```html
<form class="form-horizontal">
  <div class="form-group">
    <span id="before"></span>
    ...
    <span id="after"></span>
  </div>
</form>
```

```css
#before,
#after {
  display: table;
  content: " ";
  clear: both;
}
```

所以，这个CSS之所以能达到和`overflow:hidden`一样的效果，是因为



小结##



##Reference##

1. [w3c - §9](https://www.w3.org/TR/CSS2/visuren.html)
2. [w3c - §10](https://www.w3.org/TR/CSS21/visudet.html)
3. [Block Level Element vs Block Formatting Context](https://stackoverflow.com/questions/35111906/block-level-element-vs-block-formatting-context)
4. [CSS中为什么overflow:hidden能清除浮动(float)的影响？原理是什么？ - 知乎](https://www.zhihu.com/question/30938856)