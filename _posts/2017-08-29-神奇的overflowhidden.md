---
layout: post
title: "神奇的overflow:hidden"
category: CSS
tags: [W3C spec, clearfix, 坑]
date: 2017-08-29
---

最近用[react-jsonschema-form](https://github.com/mozilla-services/react-jsonschema-form)重写之前写过的一个表单页面，发现布局上出现了很大的问题，表单行与行之间贴在了一起（包裹每一行元素的DOM高度为0了），如下图所示：

![screenshot1](/images/2017-08-23-神奇的overflow:hidden.png)

而重写之前的表单是好的：

![screenshot2](/images/2017-08-23-神奇的overflow:hidden-1.png)

网上简单搜索了下，发现只要把父级元素的`overflow`属性设为`hidden`即可。那么这是怎么样一个机制呢？还有一个问题就是，原先的表单也并没有手动设置过`overflow`这个属性，为什么就没有问题（都是直接用的bootstrap的样式）？

<!--break-->

##Visual formatting model##

要彻底弄明白设置`overflow:hidden`work的原因，就要从CSS的visual formatting model讲起。

###Normal flow###

> An element is called [out of flow]() if it is floated, absolutely positioned, or is the root element. An element is called [in-flow]() if it is not out-of-flow. 

即一个元素符合以下条件之一，那么它称之为“out of flow”，否则就是“in flow”（这里的flow即指normal flow）：

- `float`属性不为`none`
- `position:absolute`
- `position:fixed` 
- `<html>`（大部分情况下的根元素）

> The [flow of an element]() A is the set consisting of A and all in-flow elements whose nearest out-of-flow ancestor is A.

“flow of an element”可以理解为多个元素组成的一个flow集合，简单地说就是根据上面的flow概念可以把元素进行一个集合的划分，其中，如果这个元素是“in flow”的，那么它的flow集合就是它自己；如果这个元素是“out of flow”的（假设为元素A），那么它的flow集合就是它自己以及所有它内部的满足一定条件的“in flow”的元素，这个条件是指该“in flow”元素自底向上遍历找到的第一个“out of flow”元素就是元素A。（参考[In the CSS Visual Formatting Model, what does “the flow of an element” mean?](https://stackoverflow.com/questions/40325236/in-the-css-visual-formatting-model-what-does-the-flow-of-an-element-mean)）

###Formatting context###

> Boxes in the normal flow belong to a [formatting context](), which may be block or inline, but not both simultaneously. [Block-level](https://www.w3.org/TR/CSS2/visuren.html#block-level) boxes participate in a [block formatting](https://www.w3.org/TR/CSS2/visuren.html#block-formatting) context. [Inline-level boxes](https://www.w3.org/TR/CSS2/visuren.html#inline-level) participate in an [inline formatting](https://www.w3.org/TR/CSS2/visuren.html#inline-formatting) context.

元素可以形成formatting context，它要么是block formatting context (BFC)，要么是inline formatting context (IFC)（最近添加了FFC和GFC，分别对应flex和grid两种模型）。这里并不是说只有属于normal flow的box才会参与formatting context，它只是单纯的引出了formatting context的概念。比如一个`display: block;float: left`的元素会产生block-level box，自然可以参与block formatting context。另外注意这里的动词是**参与**，后面还会讲到**形成**formatting context。

一个BFC中包含了inline-level box，那么这个inline-level box是不会参与该BFC的咯？是的，它会往上去寻找祖先节点，直到找到一个IFC并参与进去。如果一直往上找都没有找到能形成IFC的元素呢？那它可能会会变成一个anonymous block box（参考[W3C - 9.2.1.1](https://www.w3.org/TR/CSS2/visuren.html#anonymous-block-level)）。反过来，一个IFC钟包含的block-level box也同理，它会往祖先节点去找到第一个BFC并参与进去（根节点会形成BFC，所以不存在找不到的情况，参考[what is mean of “participate” in definition of normal flow in w3 spec?](https://stackoverflow.com/questions/43215834/what-is-mean-of-participate-in-definition-of-normal-flow-in-w3-spec)）。

formatting context本身也像一个“盒子”，它内部排列好对应类型的box后，内部的相应类型的box就和外部隔离了，之后它本身也会参与到包含它的对应的formatting context中的。

> Floats, absolutely positioned elements, block containers (such as inline-blocks, table-cells, and table-captions) that are not block boxes, and block boxes with 'overflow' other than 'visible' (except when that value has been propagated to the viewport) establish new block formatting contexts for their contents.

一个元素只要满足下面任何一个条件就会**形成**block formatting context，若都不满足则**形成**inline formatting context（形成formatting context后，该元素中的所有属于normal flow的box才会参与到该formatting context中）：

- `float`属性不是`none`
- `overflow`属性不是`visible`
- `display`属性是`table-cell`、`table-caption`或`inline-block`
- `position`属性不是`static` 或`relative`

> In a block formatting context, boxes are laid out one after the other, vertically, beginning at the top of a containing block. The vertical distance between two sibling boxes is determined by the ['margin'](https://www.w3.org/TR/2011/REC-CSS2-20110607/box.html#propdef-margin) properties. Vertical margins between adjacent block-level boxes in a block formatting context [collapse](https://www.w3.org/TR/2011/REC-CSS2-20110607/box.html#collapsing-margins).
>
> In a block formatting context, each box's left outer edge touches the left edge of the containing block (for right-to-left formatting, right edges touch). This is true even in the presence of floats (although a box's *line boxes* may shrink due to the floats), unless the box establishes a new block formatting context (in which case the box itself [*may* become narrower](https://www.w3.org/TR/2011/REC-CSS2-20110607/visuren.html#bfc-next-to-float) due to the floats).

元素的formatting context类型决定了该元素内部的元素是怎样堆叠排列的。参与BFC的block-level box会自上而下排列，在同一个BFC中的两个block-level box竖直方向上的margin会坍塌（即margin较小的那个不会生效）。

> In an inline formatting context:
>
> - boxes are laid out horizontally, one after the other, beginning at the top of a containing block. Horizontal margins, borders, and padding are respected between these boxes. The boxes may be aligned vertically in different ways: their bottoms or tops may be aligned, or the baselines of text within them may be aligned. The rectangular area that contains the boxes that form a line is called a [line box]().
> - The width of a line box is determined by a [containing block](https://www.w3.org/TR/CSS2/visuren.html#containing-block) and the presence of floats. The height of a line box is determined by the rules given in the section on [line height calculations](https://www.w3.org/TR/CSS2/visudet.html#line-height).
> - ...

对于IFC中的inline-level box（block-level box不会参与进来），它们是自左向右水平排列的。

> For calculating the values of ['top'](https://www.w3.org/TR/CSS21/visuren.html#propdef-top), ['margin-top'](https://www.w3.org/TR/CSS21/box.html#propdef-margin-top), ['height'](https://www.w3.org/TR/CSS21/visudet.html#propdef-height), ['margin-bottom'](https://www.w3.org/TR/CSS21/box.html#propdef-margin-bottom), and ['bottom'](https://www.w3.org/TR/CSS21/visuren.html#propdef-bottom) a distinction must be made between various kinds of boxes:
>
> 1. inline, non-replaced elements
> 2. inline, replaced elements
> 3. block-level, non-replaced elements in normal flow
> 4. block-level, replaced elements in normal flow
> 5. floating, non-replaced elements
> 6. floating, replaced elements
> 7. absolutely positioned, non-replaced elements
> 8. absolutely positioned, replaced elements
> 9. 'inline-block', non-replaced elements in normal flow
> 10. 'inline-block', replaced elements in normal flow

在计算上面的那几个属性的值时（属性值设为auto才需要计算，否则就是用设定的值了），不同类型的box的计算方式是不一样的（似乎和该box形成的formatting context无关，后面可以看到如果是BFC，计算方法是一种，而对于IFC，计算方法则还要细分成更多种）。

对于Block-level non-replaced elements in normal flow when 'overflow' computes to 'visible'，它的计算方式是这样的：

> The element's height is the distance from its top content edge to the first applicable of the following:
>
> 1. the bottom edge of the last line box, if the box establishes a inline formatting context with one or more lines
> 2. the bottom edge of the bottom (possibly collapsed) margin of its last in-flow child, if the child's bottom margin does not collapse with the element's bottom margin
> 3. the bottom border edge of the last in-flow child whose top margin doesn't collapse with the element's bottom margin
> 4. zero, otherwise
>
> Only children in the normal flow are taken into account (i.e., floating boxes and absolutely positioned boxes are ignored, and relatively positioned boxes are considered without their offset). Note that the child box may be an [anonymous block box.](https://www.w3.org/TR/CSS21/visuren.html#anonymous-block-level)

对于BFC，它的计算方式是这样的：

> If it only has inline-level children, the height is the distance between the top of the topmost line box and the bottom of the bottommost line box.
>
> If it has block-level children, the height is the distance between the top margin-edge of the topmost block-level child box and the bottom margin-edge of the bottommost block-level child box.
>
> Absolutely positioned children are ignored, and relatively positioned boxes are considered without their offset. Note that the child box may be an [anonymous block box.](https://www.w3.org/TR/CSS21/visuren.html#anonymous-block-level)
>
> In addition, if the element has any floating descendants whose bottom margin edge is below the element's bottom content edge, then the height is increased to include those edges. Only floats that participate in this block formatting context are taken into account, e.g., floats inside absolutely positioned descendants or other floats are not.

---

这样理下来原因就有一些明朗了，在出现问题的表单中，包裹表单的label和input元素的父元素形成了IFC，且其`display: block;overflow: visible`，计算高度时套用上面的计算方法，由于label和input元素均为float元素，所以它们的高度都没有被计算在内，最终它们父元素的高度就是0了。而对该父元素设置`overflow:hidden`，便把它转换为了BFC，它计算高度的方法就变成了把其中的float元素高度也计算在内的了，自然就不为0了。

##Block-level box VS. block-level element VS. block formatting context##

因为上面出现了这些概念，这里稍微做个梳理。

> [Block-level elements]() are those elements of the source document that are formatted visually as blocks (e.g., paragraphs). The following values of the ['display'](https://www.w3.org/TR/CSS2/visuren.html#propdef-display) property make an element block-level: 'block', 'list-item', and 'table'.
>
> [Block-level boxes]() are boxes that participate in a [block formatting context.](https://www.w3.org/TR/CSS2/visuren.html#block-formatting) Each block-level element generates a [principal block-level box]() that contains descendant boxes and generated content and is also the box involved in any positioning scheme. Some block-level elements may generate additional boxes in addition to the principal box: 'list-item' elements. These additional boxes are placed with respect to the principal box.
>
> Except for table boxes, which are described in a later chapter, and replaced elements, a block-level box is also a block container box. A [block container box]() either contains only block-level boxes or establishes an inline formatting context and thus contains only inline-level boxes. Not all block container boxes are block-level boxes: non-replaced inline blocks and non-replaced table cells are block containers but not block-level boxes. Block-level boxes that are also block containers are called [block boxes]().

简单来说，**一个元素是block-level element还是inline-level element仅仅是由它的`display`属性决定的。**而一个block-level element可以产生一个或多个block-level box（这里的box是一个虚拟的概念，它主要用于formatting context中的计算）。但反过来说，是否所有能产生block-level box的都是block-level element呢？答案是否定的。比如`display:inline-block`的元素同样会生成block-level box（存个疑，不完全确定~）:

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

<img title="CSS Diff" src="/images/2017-08-23-神奇的overflow:hidden-3.png" width="500"/>

然后我们来看`form-horizontal`带来的应用上的CSS：

<img title="form-horizontal" src="/images/2017-08-23-神奇的overflow:hidden-2.png" width="500" />

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

所以，这个CSS之所以能达到和`overflow:hidden`一样的效果，是因为它在当前元素内部插入了两个拥有`clear: both`属性的元素，也就意味着这两个元素会在元素内部最上边和最下边单独占用一行空间，而这两个元素又拥有`display: table`属性，也就是说它们是“’in flow”的block-level box，根据上面的`display: block;overflow: visible`高度的计算方法，最终高度即为当前元素包含的最下边的“in flow”的元素底部到当前元素最上边的距离。

根据这个计算方法，只要插入的元素是“in flow”的且位置在所有float元素下面，就可以达到高度包裹所有float元素的效果，所以上面的`display: table`改为`display: block`等也是可以的（只要保证是block-level box即可，否则根据IFC的排列规则，inline-level box会放置在上一个inline-level box右边，而这个位置不一定是在最下面的float元素下面）。

这个解决方案其实是很早之前Nicolas Gallagher在[A new micro clearfix hack](http://nicolasgallagher.com/micro-clearfix-hack/)中提出来的。

##小结##

- DOM元素的formatting context决定了其中的元素是怎样排列的，BFC是从上往下排列的，IFC是从左往右排列的；
- 在元素的`height`属性为`auto`时，如果该元素形成BFC，则最终高度会包裹其中所有的浮动元素，否则，最终高度不会把浮动元素计算在内；
- 通过把元素改为BFC或是在元素内末尾插入“in flow”的block-level元素可以达到clearfix的效果，即最终高度包含其中的浮动元素。

float的元素布局由于会产生本文所阐述的问题，往往就需要使用clearfix之类的hack的方式来达到预期的布局效果，如果不考虑支持较老的浏览器，建议使用Flex布局来屏蔽掉这些麻烦的问题（参考[What is a clearfix?](https://stackoverflow.com/questions/8554043/what-is-a-clearfix)）。另外，要感谢Bootstrap这些样式库，原来好多问题已经被它们屏蔽了，这几天光看了两章W3C的CSS标准就看得我想哭。

##Reference##

1. [w3c - §9](https://www.w3.org/TR/CSS2/visuren.html)
2. [w3c - §10](https://www.w3.org/TR/CSS21/visudet.html)
3. [Block Level Element vs Block Formatting Context](https://stackoverflow.com/questions/35111906/block-level-element-vs-block-formatting-context)
4. [CSS中为什么overflow:hidden能清除浮动(float)的影响？原理是什么？ - 知乎](https://www.zhihu.com/question/30938856)
5. [A new micro clearfix hack](http://nicolasgallagher.com/micro-clearfix-hack/)
6. [CSS清浮动处理（Clear与BFC）](http://www.cnblogs.com/dolphinX/p/3508869.html)
7. [css-101](http://css-101.org/index.php)
8. [what is mean of “participate” in definition of normal flow in w3 spec?](https://stackoverflow.com/questions/43215834/what-is-mean-of-participate-in-definition-of-normal-flow-in-w3-spec)