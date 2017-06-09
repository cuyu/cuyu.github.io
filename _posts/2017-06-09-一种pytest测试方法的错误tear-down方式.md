---
layout: post
title: "一种pytest测试方法的错误tear down方式"
category: Python
tags: [pytest]
date: 2017-06-09
---

最近修改别人写的pytest测试用例还真是涨了不少见识，这里就记录一种新手比较容易犯的错误的tear down方式。

**下面的测试函数是有问题的，why？**

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

执行上面的测试你会发现，两次全都pass了，原因在于assert语句被包裹在了try语句当中，并且没有except语句，tear down部分虽然保证了执行，但测试逻辑本身已经没有意义了。实际当中，由于测试代码比较复杂，这种坑往往会被忽略，其实这就和`assert true`一样是一个invalid的测试。

**为此，我们添加上一个except语句应该就可以了吧？**

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
    except Exception, e:
        raise e
    finally:
        print 'tear down'
```

其实问题只解决了一半，虽然可以有效地报错了，但还存在以下问题：

- 报错的stack trace难以定位真实的抛错位置，永远都是定位到`raise`语句处，比如：

  ```
  =================================== FAILURES ===================================
  ______________________________ test_square[3-10] _______________________________

  a = 3, expected = 10

      @pytest.mark.parametrize("a,expected", test_data)
      def test_square(a, expected):
          try:
              assert a * a == expected
          except Exception, e:
  >           raise e
  E           assert (3 * 3) == 10

  test_fixture_teardown.py:22: AssertionError
  ```

- 容易出现最开始的那个问题。一旦允许了这种tear down的方式，那么很可能出现某个测试方法中没有except语句的情况，而我们很难去注意到。

**我们需要一种更佳的tear down方式。**

一种方式是使用fixture：

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

但使用fixture也有一些缺点，即tear down的部分是无法获取测试方法中的局部变量的（比如例子中的`result`变量），因为这些局部变量随着测试方法执行完成已经被销毁了，而上面的`try..catch..`的方式则没有这种问题。为此，一种work around是将不想被销毁的测试方法局部变量绑定到测试方法上，或者绑定到模块的全局变量上，总之延长它们的生命周期即可：

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

