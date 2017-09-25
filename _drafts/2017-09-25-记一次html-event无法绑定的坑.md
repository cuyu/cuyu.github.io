---
layout: post
title: "记一次html event无法绑定的坑"
category: CSS
tags: [坑]
date: 2017-09-25
---

接手一个项目，前端用codemirror来展示了一段代码，我想添加一个鼠标点击某一行的事件，却发现怎么都无法绑定。



```css
.CodeMirror {
    /* Disable clicks so that no inconsistent state can be reached.
       `active-line` is only changed via the state viewer's handlers. */
    pointer-events: none;
}
```

一些感想###

前端这CSS和JavaScript有些功能重叠了，其实是挺恶心的，出了问题你都不知道是JavaScript代码的问题还是CSS代码的问题。这类问题，我觉得要么靠丰富的经验可以快速定位，要么就得靠代码规范来规避了。而且某些经验其实会越来越稀缺，毕竟各类库和标准都是在不断翻新变化的，尤其是前端领域。从产品的角度来看，不要把宝压在某些人身上，通过一些规范（不仅仅是代码层面的规范）让任何人都能快速上手并参与到产品开发维护中才是正确的打开方式。