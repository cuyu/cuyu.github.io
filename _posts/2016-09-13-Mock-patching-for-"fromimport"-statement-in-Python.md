---
layout: post
title: "Mock patching for 'from/import' statement in Python"
category: Python
tags: [坑, mock]
date: 2016-09-13
---

### 坑

最近研究了下Python的[mock](https://docs.python.org/3/library/unittest.mock.html)库，实际用的时候碰到了这样的坑：

我有三个py文件分别放了测试代码，被测试的代码以及被测试代码中调用的方法：

`mylib.py`:

```python
class Foo(object):
    def print_foo(self):
        return 'foo'
```

`myfunc.py`:

```python
from mylib import Foo

def some_function():
    instance = Foo()
    return instance.print_foo()
```

`test_myfunc.py`:

```python
from myfunc import some_function

def test_some_function():
    # Will create a MagicMock object to replace class `Foo`
    with patch("mylib.Foo") as MockFoo:
        mock_instance = MockFoo.return_value
        mock_instance.print_foo.return_value = 'bar'
        result = some_function()
        assert result == 'bar'
```

然而实际运行时，`some_function`中的`Foo`类仍然是`mylib.Foo`对象，而不是我生成的`MagicMock`对象，也就是说mock在这里并没有起到替换被测代码中对象的作用。

### Why

原因其实和Python的import机制有关（之前也碰到过类似的[问题](/python/2016/07/06/Set-variable-from-other-module-correctly)）：

> 通过`from/import`来import的对象其实是在此模块中创建了一个import对象的引用来指向这个对象

所以上述代码中`myfunc.py`中的`Foo`其实在全局空间是`myfunc.Foo`，而`test_myfunc.py`中我是对`mylib.Foo`进行了patch，所以实际看上去并没有替换被测代码中的`Foo`对象。

### Solution

正确地打好patch即可：

```python
from myfunc import some_function

def test_some_function():
    # Will create a MagicMock object to replace class `Foo`
    with patch("myfunc.Foo") as MockFoo:
        mock_instance = MockFoo.return_value
        mock_instance.print_foo.return_value = 'bar'
        result = some_function()
        assert result == 'bar'
```

### Conclusion

使用mock的patch时一定要注意[where to patch](https://docs.python.org/3/library/unittest.mock.html#where-to-patch)的问题。