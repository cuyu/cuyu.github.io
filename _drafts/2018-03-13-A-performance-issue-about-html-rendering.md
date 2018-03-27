---
layout: post
title: "A performance issue about html rendering"
category: Web
tags: [profiler, DOM]
date: 2018-03-13
---

实现一个页面可以实时地打印出来后端一个命令的stdout，结果发现打印了一部分结果之后浏览器的CPU占有率变得很高，即，我碰到了一个前端的性能问题。

我的原版实现大概是这样的：

<p data-height="265" data-theme-id="0" data-slug-hash="JLGwJr" data-default-tab="js,result" data-user="curiousY" data-embed-version="2" data-pen-title="type effect (original)" data-preview="true" class="codepen">See the Pen <a href="https://codepen.io/curiousY/pen/JLGwJr/">type effect (original)</a> by Curtis Yu (<a href="https://codepen.io/curiousY">@curiousY</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

solution 1: do not use border so that only the new added content will be rendered

solution 2: hidden extra content with scroll bar (seems invalid)





Conclusion

1. 使用Chrome的dev console中的Performance工具可以采样测试页面在各个方面的性能；而通过dev console中More tools => Rendering并勾选Paint flashing可以实现显示出页面中哪些元素正在被浏览器绘制。
2. DOM节点的内容（innerText）发生变化时，如果发生变化的内容在当前屏幕内，则整个DOM节点都会重新绘制，如果变化发生在屏幕外（一般是有滚动条的情况），则仅在必要时才会重绘整个DOM节点（比如DOM节点的高度发生了变化且它存在边框样式，这时因为边框要重新绘制，而实际浏览器会重绘整个DOM节点）。
3. ​