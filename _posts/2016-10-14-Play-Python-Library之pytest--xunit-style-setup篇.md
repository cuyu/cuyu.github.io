---
layout: post
title: "Play Python Library之pytest--xunit-style setup篇"
category: pytest,Play Python Library
tags: [Python]
date: 2016-10-14
---

### Is 'xunit-style setup' a fixture?

关于什么是'xunit-style setup'请看[官方文档](http://doc.pytest.org/en/latest/xunit_setup.html)。

之所以觉得'xunit-style setup'是pytest fixture，是因为官方文档上有提到：

> This section describes a classic and popular way how you can implement fixtures (setup and teardown test state) on a per-module/class/function basis.

先看pytest的代码中'xunit-style setup'是如何实现的：

```python
class Class(PyCollector):
    """ Collector for test methods. """
    def collect(self):
        if hasinit(self.obj):
            self.warn("C1", "cannot collect test class %r because it has a "
                "__init__ constructor" % self.obj.__name__)
            return []
        elif hasnew(self.obj):
            self.warn("C1", "cannot collect test class %r because it has a "
                            "__new__ constructor" % self.obj.__name__)
            return []
        return [self._getcustomclass("Instance")(name="()", parent=self)]

    def setup(self):
        setup_class = _get_xunit_func(self.obj, 'setup_class')
        if setup_class is not None:
            setup_class = getattr(setup_class, 'im_func', setup_class)
            setup_class = getattr(setup_class, '__func__', setup_class)
            setup_class(self.obj)

        fin_class = getattr(self.obj, 'teardown_class', None)
        if fin_class is not None:
            fin_class = getattr(fin_class, 'im_func', fin_class)
            fin_class = getattr(fin_class, '__func__', fin_class)
            self.addfinalizer(lambda: fin_class(self.obj))
```

上面代码是`setup_class`和`teardown_class`的实现代码。可以看到虽然它的实现和fixture有点像，但肯定不是一个fixture（不光它们的类型不同，调用它们的pytest hook也不同，前者是`pytest_runtest_setup`，而fixture用的pytest hook是`pytest_fixture_setup`）。

需要注意的是'xunit-style setup'针对的scope有module, class和method, 是没有session这个scope的。假如你有一个需求是所有tests执行前进行setup，所有tests执行完后teardown，则'xunit-style setup'无法满足这种需求（即使你通过设置基类中的`setup_class`和`teardown_class`方法，再通过测试类来继承这个类，实际是会在每个测试类执行前都执行一次`setup_class`的（`teardown_class`也一样））。要实现这种需求只有以下两种方式：

- 使用pytest fixture。在测试类的基类上放一个scope=session的fixture（使用`@pytest.mark.usefixtures`来放）。
- 使用pytest hooks。写一个pytest plugin来实现比如`pytest_runtestloop`这样的hook，在其中进行setup的工作（参考[pytest hook spec](http://doc.pytest.org/en/latest/_modules/_pytest/hookspec.html)）。

### Relation between pytest fixture and pytest hook

首先，pytest fixture本身就是通过hook来实现的。fixture的setup是通过`pytest_fixture_setup`这个hook来实现的，而teardown则是通过`pytest_runtest_teardown`来实现的。

再者，从fixture的定义来看，也和hook方法非常像，只是它们的注册方式不一样：即pytest定义了一套hook方法的规则（方法名要以`pytest_`开头等），fixture又自己定义了一套规则（要有`@pytest.fixture`装饰器），两套规则可以完全兼容，并形成了现在pytest的样子。

### Conclusion

从用户角度来看，根本不需要关心'xunit-style setup'是怎么实现的，只要知道这种方式好用就行。你可以把它理解为一种特殊的fixture（不需要fixture装饰器，scope天然绑定且setup和teardown分开定义了）或者是一种特殊的hook方法（ 只不过没有以`pytest_`开头，也不会被注册为pytest plugin）。总之，在design你的测试框架时知道有这样一个好用的东西就行。