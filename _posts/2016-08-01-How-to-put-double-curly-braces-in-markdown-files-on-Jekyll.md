---
layout: post
title: "How to put double curly braces in markdown files on Jekyll"
category: Web
tags: [Jekyll, 坑]
date: 2016-08-01
---

## Problem

由于Jekyll使用了[liquid]((https://github.com/Shopify/liquid))模板语言来编译生成每个静态页面，这个编译转换的范围也包括了所有的markdown文件（因为每个markdown写的blog要先转换成html才能在网页展示嘛），所以如果我们在markdown文件里面如果包含了liquid的语法，编译时是会出问题的。

比如如标题所言，**{{ "{% variable " }}%}**这样的双花括号是liquid的语法，不能在markdown里面直接这样写的。

## Solutions

基本上是两种思路吧，一种是通过hack Jekyll的编译函数，使得Jekyll对特定的内容不进行liquid语言的编译，而直接展示raw content；另外一种则是利用了liquid语言的特性来work around。

这里主要说第二种解决方法，因为依靠monkey patch来解决第三方库的问题非常依赖于第三方库（这里就是Jekyll）的稳定性，假如第三方库升到新的版本后改动比较大，那monkey patch可能就失效了，维护起来会很麻烦。

### Solution 1

使用liquid中的tag：**{{ "{% raw " }}%}** 和 **{{ "{% endraw " }}%}**，把不需要liquid语法编译的部分放在两者之间即可：

> {{ "{% raw " }}%}
>
> ​    {{ "{{ variable " }}}}
>
> {{ "{% endraw " }}%}

### Solution 2

利用一些escape字符的技巧，可以用{% raw %}**{{ "{% variable " }}%}**{% endraw %}来展示**{{ "{% variable " }}%}**，用{% raw %}**{{ "{{ variable " }}}}**{% endraw %}来展示**{{ "{{ variable " }}}}**。