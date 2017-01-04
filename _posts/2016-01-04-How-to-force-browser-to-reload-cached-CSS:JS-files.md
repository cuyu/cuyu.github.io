---
layout: post
title: "How to force browser to reload cached CSS/JS files"
category: Web
tags: [CSS, 心得, stackoverflow]
date: 2017-01-04
---

### Problem

在已运行的web server上更新了一个css文件，结果在用户端由于缓存的缘故，该css文件并没有被更新，反复刷新页面也没有用，只有清楚掉缓存再打开网页才成功加载了新的css文件。问题是能否从服务端入手，迫使客户端来加载更新的资源文件？

### Solution

解决方法是用stackoverflow上提到的一个方案：

在页面的资源加载语句中在资源文件后加上`?`以及一个版本号。即：

```html
<script type="text/javascript" src="myfile.js?$$REVISION$$"></script>
```

实验了下确实可行。

答案中还提到这种给资源添加版本号的行为是可以持续集成到代码提交时自动执行的（判断资源文件改变了再修改版本号），有空可以再研究下web开发的CI。

此外，值得一提的是，这个方法有一个小缺点，即会占用更多客户端的缓存空间：

> For awareness: this is considered to be a hack. This method tricks the browser into thinking that a new file is being specified, as it simply looks at the full file name without interpreting it. foo.js?1 is not the same name as foo.js?2, so the browser will think they are two different files. One downside is that both files will simultaneously exist in the users' cache, taking up unnecessary space.

### Reference

http://stackoverflow.com/questions/32414/how-can-i-force-clients-to-refresh-javascript-files

http://stackoverflow.com/questions/118884/how-to-force-browser-to-reload-cached-css-js-files