---
layout: post
title: "关于pytest测试方法的tear down方式"
category: Python
tags: [pytest]
date: 2017-06-09
---

最近修改别人写的pytest测试方法还真是涨了不少见识，这里主要探讨下pytest测试中怎样写tear down方法。

**下面的测试函数有没有问题？**

```python
import pytest

test_data = [
    (2, 4),
    (3, 10),
]

@pytest.mark.parametrize("a,expected", test_data)
def test_square(a, expected):
    try:
        assert a * a == expected
    finally:
        print 'tear down'
```

<!--break-->

好吧，一开始我是觉得有问题的，我以为执行上面的测试，两次会全都pass了，原因在于assert语句被包裹在了try语句当中，并且没有except语句。但实际测试下来并不是这样的，最后发现我对Python的`try..catch`理解出了问题。

---

Python的`try..catch`有点类似于其他语言的`switch`语句，`try`语句块中如果抛出了异常会去逐个寻找后面的`except`语句，如果找到了匹配的，则进入并执行对应的语句，如果没有找到对应的，则会进入未指定任何异常类型的`except`语句（类似`switch`语句中的`default`），如果连未指定类型的`except`语句也没有呢？我之前的理解是异常不会被抛出，但我错了，如果没有找到定义的对应的`except`语句，Python会使用它默认的异常处理方式来处理这个异常：即继续向上抛出这个异常！

```python
try:
    assert 1 == 0
except AssertionError, e:
    print 'AssertionError'
except:
    print 'Other exception'
else:
    print 'No exception happens'
finally:
    print 'Always executed'
```

---

OK，所以上面这种`try..fianlly`的tear down方式是完全可行的。

**其他的tear down方式？**

另外一种方式是使用fixture：

```python
import pytest

@pytest.fixture(scope='function')
def teardown_square(request):
    def fin():
        print 'tear down'
    request.addfinalizer(fin)

test_data = [
    (2, 4),
    (3, 10),
]

@pytest.mark.parametrize("a,expected", test_data)
def test_square(a, expected, teardown_square):
    result = a * a
    assert result == expected
```

但使用fixture也有一些缺点，即tear down的部分是无法获取测试方法中的局部变量的（比如例子中的`result`变量），因为这些局部变量随着测试方法执行完成已经被销毁了，而上面的`try..finally`的方式则没有这种问题。为此，一种work around是将不想被销毁的测试方法局部变量绑定到测试方法上，或者绑定到模块的全局变量上，总之延长它们的生命周期即可：

```python
import pytest

@pytest.fixture(scope='function')
def teardown_square(request):
    def fin():
        print request.function.result
    request.addfinalizer(fin)

test_data = [
    (2, 4),
    (3, 10),
]

@pytest.mark.parametrize("a,expected", test_data)
def test_square(a, expected, teardown_square):
    test_square.result = a * a
    assert test_square.result == expected
```

还有一种方式是使用[xunit-style](https://docs.pytest.org/en/2.9.1/xunit_setup.html)的tear down方式，其实是殊途同归的：

```python
import pytest

test_data = [
    (2, 4),
    (3, 10),
]

class TestTeardown(object):
    def teardown_method(self, method):
        print self.result

    @pytest.mark.parametrize("a,expected", test_data)
    def test_square(self, a, expected):
        self.result = a * a
        assert self.result == expected
```



以上，总结了三种pytest测试方法tear down的方式，从处理的麻烦程度上来看，`try..finally`的方式应该是最省事的，从代码的清晰程度上来看，[xunit-style](https://docs.pytest.org/en/2.9.1/xunit_setup.html)的方式则最为清晰明了。