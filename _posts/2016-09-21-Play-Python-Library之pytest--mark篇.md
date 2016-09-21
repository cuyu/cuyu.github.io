---
layout: post
title: "Play Python Library之pytest--mark篇"
category: Python
tags: [pytest, Play Python Library]
date: 2016-09-21
---

### Introduction

`pytest.mark`主要是用来对test方法进行标记用的一个装饰器。标记的作用就是在使用pytest跑测试代码的时候可以选择性地执行部分test方法。

比如test代码如下：

```python
import pytest


@pytest.mark.old_test
def test_one():
    assert False


@pytest.mark.new_test
def test_two():
    assert False


@pytest.mark.not_run
def test_three():
    assert False
```

通过使用`-m`参数可以让pytest选择性的执行部分test方法：

```shell
➜  python-demo git:(master) ✗ pytest demo_pytest/test_mark_0.py -m "not not_run"
==================================== test session starts ====================================
platform darwin -- Python 2.7.11, pytest-3.0.2, py-1.4.31, pluggy-0.3.1
rootdir: /Users/CYu/Code/Python/python-demo/demo_pytest, inifile: pytest.ini
plugins: pep8-1.0.6, splunk-rack-1.1.6
collected 3 items

demo_pytest/test_mark_0.py FF

========================================= FAILURES ==========================================
_________________________________________ test_one __________________________________________

    @pytest.mark.old_test
    def test_one():
>       assert False
E       assert False

demo_pytest/test_mark_0.py:13: AssertionError
_________________________________________ test_two __________________________________________

    @pytest.mark.new_test
    def test_two():
>       assert False
E       assert False

demo_pytest/test_mark_0.py:18: AssertionError
==================================== 1 tests deselected =====================================
========================== 2 failed, 1 deselected in 0.03 seconds ===========================
```

<!--break-->

### Use markers in a better way

虽然像上面的例子那样，pytest的marker不需要事先定义好就能使用，但从方便维护的角度，**建议把所有要创建的marker都[注册](http://doc.pytest.org/en/latest/example/markers.html#registering-markers)到`pytest.ini`中，并且pytest执行时添加`--strict`参数**。

所以可以把上述例子修改一下：

In **pytest.ini**:

```ini
[pytest]
markers =
    old_test: run as old tests.
    new_test: run as new tests.
    not_run: will not run the tests.
```

In **pytest_markers.py**:

```python
import pytest

OldTest = pytest.mark.old_test
NewTest = pytest.mark.new_test
NotRun = pytest.mark.not_run
```

In **test_mark_0.py**:

```python
from pytest_markers import OldTest, NewTest, NotRun


@OldTest
def test_one():
    assert False


@NewTest
def test_two():
    assert False


@NotRun
def test_three():
    assert False
```

以上做法已经比较好了，但`pytest.mark`还可以变得更强大，这点放到讲pytest的plugin的时候再说。

### Build-in markers

除了自己定义marker外，pytest官方提供了几个mark来使用（可以使用`pytest --markers`来查看）：

- `skip` — pytest执行时会跳过所在的test方法。


- `skipif` — 传递一个条件判断式，满足时会跳过所在方法。
- `xfail` — 如果test fail了则认为是pass的，反之亦然。
- `parametrize` — 给test方法添加参数，供跑测试时填充到test方法中。这个参数可以是多组参数组成的列表，并且可以用多个`pytest.mark.parametrize`装饰器来装饰test方法，pytest会组合所有的参数可能性来执行test方法；如果parametrize的参数名称和fixture名称一样，会覆盖掉fixture。
- `usefixtures` — 对给定test方法执行给定的fixtures（和直接用fixture一样，只不过不需要把fixture名称作为参数放在方法声明当中，并且可以对class使用（fixture暂时不能用于class））。
- `tryfirst` — 使所在test方法可以尽早地被执行（实际情况下如果有fixture的parametrize，执行顺序会比较复杂）。
- `trylast` — 和上面相反。

### Select tests without markers

pytest除了使用marker来选择性地过滤掉一些test以外，还可以直接[指定特定的node](http://doc.pytest.org/en/latest/example/markers.html#selecting-tests-based-on-their-node-id)或者[使用`-k`参数](http://doc.pytest.org/en/latest/example/markers.html#using-k-expr-to-select-tests-based-on-their-name)来选择名称中包含指定字符串的test。

当然，由于marker实在是强大许多，**建议**仅仅是在临时需要调试执行某个（或某几个）test的时候使用这两种方式。