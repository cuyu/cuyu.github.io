---
layout: post
title: "The 'url_for' in the Flask"
category: Python
tags: [Flask, 心得]
date: 2016-09-02
---

一直没太明白为啥Flask中import站内的资源需要写成这样：

{% raw %}

```html
<link rel="stylesheet" type="text/css" href="{{url_for('static',filename='css/main.css')}}">
```

{% endraw %}

直到最近用`Jinja2`和`Twisted`写一个web server，才发现这样做是有道理的。

一开始我是直接import相对路径的：

```html
<link rel="stylesheet" type="text/css" href="static/css/main.css">
```

这样看着很舒服。BUT，接下去就发现问题了。

假设我访问的是`http://localhost:5000`，import这些资源是没有问题的，因为相对路径解析下来正好是`http://localhost:5000/static/css/main.css`。但如果访问`http://localhost:5000/pathA`，会发现路径解析为了`http://localhost:5000/pathA/static/css/main.css`，也就是说相对路径永远是加在当前访问的路径后面。

OK，那我就用绝对路径吧，把上述import改写为：

```html
<link rel="stylesheet" type="text/css" href="http://myhostname:5000/static/css/main.css">
```

这样肯定是没有问题的，但问题是这里的hostname和port都被hard code到了页面里，比较蠢。

所以Flask就提供了一个`url_for`方法，用来把相对路径转换为绝对路径，再import站内资源。又因为html本身是静态的，所以需要把`url_for`方法放在`Jinja2`的模板里面，经过处理后把绝对路径再填到html里面。