---
layout: post
title: "A bug of pytest==2.9.2"
category: Python
tags: [pytest]
date: 2017-06-08
---

### Problem

修以前的测试代码的时候碰到的一个老版本pytest的一个bug（或者说与新版pytest不兼容的地方），记录在这里，以防以后再碰到。

在pytest中添加了一个参数需要输入一个路径作为参数的值，像这样：

```
pytest --remote-path /root/tmp /my/tests/folder
```

结果执行时，得到的pytest执行tests的路径却变成了`/`，即根目录。

而把这个参数去掉，则路径是正确的（即上面的`/my/tests/folder`）。

升级到最新版本的pytest是没有这个问题的。

原因在于：老版本的pytest解析命令行参数的代码比较蠢，它会把每一个非`-`开头的参数放到一起，并求取它们共同的根目录作为测试的目录（比如`/tmp/a/test1`和`/tmp/a/test2`就得到`/tmp/a`，具体代码可以看`_pytest/config.py`中的`get_common_ancestor`函数），而实际这里这个参数是紧跟在`--remote-path`这个option后面的，并不是作为路径传递进去的。（根本原因在于命令行参数定义时没有区分每个option后面跟的参数个数，或者是虽然定义了，但pytest根本没有鸟这个定义。）

### Solution

其实很简单。

要么，升级到最新版本的pytest。

要么，option后面的参数以等号来连接，而不是空格：

```
pytest --remote-path=/root/tmp /my/tests/folder
```