---
layout: post
title: "Set variable from other module correctly"
category: Python
tags: [python-import, 心得]
date: 2016-07-06
---

### Problem

假设有三个python文件，A.py, B.py, C.py。我想在A.py中放一些变量，其他文件会从A中调用其中的变量，从而起到共享全局变量的作用。如果A中的变量定义了就不改变了，这是没有问题的。问题是假设我想在B中改变A中的某个变量，比如A.a，使之重新赋值，然后C中使用A.a的时候是B修改过的值，这时候应该怎样做？

### 坑

这里其实是有一些比较tricky的东西在里面的：比如在B.py中如果我是from A import a或者import A.a as a，那么我在B.py中直接对a赋值其实是不能改变A.a的值的。原因在于上述这两种import方式实际上类似于a=A.a，它在module B的namespace下面创建了一个变量指向了A.a，后续对这个变量重新赋值只是让这个B.a重新指向了一个新的对象，而A.a是没有被改变的（refer: [stackoverflow](http://stackoverflow.com/questions/3536620/how-to-change-a-module-variable-from-another-module)）。

### Solution 1

使用import A的方式来导入模块A，然后在B中直接对A.a进行赋值。但同时必须**注意**的是在其他任何要使用A.a的模块中也必须这样来import A，而不能用其他方式来import（原因和上面讲的一样，比如在C.py中我使用from A import a，那么如果是在我还没运行B.py中对A.a重新赋值的代码时就先执行了这句from A import a，那其实就有了一个C.a，而后执行的对A.a重新赋值的代码就没法影响到这个C.a了）。

### Solution 2

使用可变对象来作为这个全局变量，比如让A.a为一个list，那么无论其他模块中如何import的，都是可以切实地修改到A.a以及得到修改过的A.a的。

从方便维护代码的角度，**solution 2**更好一点。