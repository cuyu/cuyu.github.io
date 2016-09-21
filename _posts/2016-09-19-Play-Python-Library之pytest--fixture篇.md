---
layout: post
title: "Play Python Library之pytest--fixture篇"
category: Python
tags: [pytest, Play Python Library]
date: 2016-09-19
---

### Introduction

pytest中，一个fixture其实就是一个函数，函数名就是fixture的名称。关于fixture，pytest在run一个test方法的时候，大概流程如下：

1. 收集该test方法的作用域内的所有fixture；
   这个作用域包括该test case所属的class，module等不同作用域的叠加（遇到同名的fixture，更里层的会覆盖更外层的）：

   > The discovery of fixtures functions starts at test classes, then test modules, then `conftest.py` files and finally builtin and third party plugins.

2. 收集该test方法的pytest参数（通过`pytest.mark.parametrize`来定义）；

3. 对该test方法的输入根据该作用域内的fixture名称或pytest参数（遇到pytest参数和fixture同名的，pytest参数会覆盖fixture）进行填充后执行。

pytest中的fixture提供了一个很好的对象管理方式，我们可以将测试代码中经常用到的一些对象定义为fixture来统一进行管理，而省去了很多重复的代码（这点就像`with-statement`，不但减少了代码量，而且避免了代码中类似资源未正确释放的情况）。

从我的理解而言，fixture会适用于以下几类对象：

- 资源类的对象。比如网络资源，fixture中可以进行网络的连接、断开等操作。
- 全局变量。比如一些test共享的信息，当然通过类的继承也可以达到共享的作用。

关于fixture的样子，这里沿用pytest官方的例子如下：

```python
import smtplib
import pytest

@pytest.fixture(scope="module")
def smtp(request):
    smtp = smtplib.SMTP("smtp.gmail.com")
    yield smtp  # provide the fixture value
    print("teardown smtp")
    smtp.close()
```

其中，在fixture定义中yield之后的语句是会在fixture对象超出定义的scope时执行的。

以上，可以看出一个fixture的几个特点：

- 必须是一个有`pytest.fixture`的装饰器的函数；
- 该函数一般会return或yield一个返回值；
- 该函数在yield/return语句之前的操作都可以看做是对要返回对象的tear up的过程，而在yield（这里return不行）语句之后的操作都可以看做是对返回对象的tear down的过程；
- 该函数可以有一个输入参数，这个输入参数包含一些test方法相关的信息。

<!--break-->

### Fixture's tear down

pytest的fixture有两种tear down的方式，**其一**就是上面例子中那样把tear down的内容写在yield语句后面。其实这里面的magic并不复杂，pytest在处理fixture对象时**大概**是这样的：

刚进入对象的scope：

```python
smtp_generator = smtp(request)
smtp = next(smtp_generator)
```

超出scope进行tear down时：

```python
try:
    next(smtp_generator)
except StopIteration:
    del smtp
```

**另外一种**tear down的方式例子如下：

```python
import smtplib
import pytest

@pytest.fixture(scope="module")
def smtp(request):
    smtp = smtplib.SMTP("smtp.gmail.com")
    def fin():
        print ("teardown smtp")
        smtp.close()
    request.addfinalizer(fin)
    return smtp  # provide the fixture value
```

pytest处理这种fixture**大概**是这样：

刚进去对象的scope：

```python
smtp = smtp(request)
```

超出scope进行tear down时：

```python
while smtp.request.finalizers:
    func = smtp.request.finalizers.pop()
    func()
del smtp
```

以上两种fixture的写法效果是一样的（之所以存在两种方式大部分是兼容旧版本的缘故吧），官方文档更推荐使用yield来tear down的方式，因为更简洁。

### Fixture's scope

关于fixture的scope，它只关乎这个fixture的生命周期，而和作用域无关。fixture的作用域只和定义它的位置有关：定义在一个文件夹的`conftest.py`的fixture的作用域就是整个文件夹，定义在其他文件的fixture作用域就是单个文件。

使用scope的好处是通过不同的生命周期我可以在特定的时候去"renew"这个fixture对象。比如说我可以在每个test开始的时候使用一个全新的fixture，而不必担心上个test对这个fixture的操作（这里的操作指对fixture对象在内存中的操作）会影响到这个test。

#### Example

In **conftest.py**:

```python
import pytest


@pytest.fixture(scope='session')
def fixture_session():
    print 'fixture_session tear up'
    yield 'fixture_session'
    print 'fixture_session tear down'


@pytest.fixture(scope='module')
def fixture_module():
    print 'fixture_module tear up'
    yield 'fixture_module'
    print 'fixture_module tear down'


@pytest.fixture(scope='class')
def fixture_class():
    print 'fixture_class tear up'
    yield 'fixture_class'
    print 'fixture_class tear down'


@pytest.fixture(scope='function')
def fixture_function(request):
    print 'fixture_function tear up'
    def fin():
        print 'fixture_function tear down'
    request.addfinalizer(fin)
    return 'fixture_function'
```

In **test_0.py**:

```python
class TestFixtureScope(object):
    def test_one(self, fixture_session, fixture_module, fixture_class, fixture_function):
        assert fixture_session == 'fixture_session'
        assert fixture_module == 'fixture_module'
        assert fixture_class == 'fixture_class'
        assert fixture_function == 'fixture_function'
        assert False

    def test_two(self, fixture_session, fixture_module, fixture_class, fixture_function):
        assert fixture_session == 'fixture_session'
        assert fixture_module == 'fixture_module'
        assert fixture_class == 'fixture_class'
        assert fixture_function == 'fixture_function'
        assert False


def test_three(fixture_session, fixture_module, fixture_class, fixture_function):
    assert fixture_session == 'fixture_session'
    assert fixture_module == 'fixture_module'
    assert fixture_class == 'fixture_class'
    assert fixture_function == 'fixture_function'
    assert False
```

In **test_1.py**:

```python
def test_four(fixture_session, fixture_module, fixture_class, fixture_function, foo):
    assert fixture_session == 'fixture_session'
    assert fixture_module == 'fixture_module'
    assert fixture_class == 'fixture_class'
    assert fixture_function == 'fixture_function'
    assert False
```

使用Pycharm跑的结果如下（用命令行的话需要添加`-s`）：

For **test_0.py**:

```
fixture_session tear up
fixture_module tear up
fixture_class tear up
fixture_function tear up
F
self = <test_0.TestFixtureScope object at 0x105d24150>
fixture_session = 'fixture_session', fixture_module = 'fixture_module'
fixture_class = 'fixture_class', fixture_function = 'fixture_function'

    def test_one(self, fixture_session, fixture_module, fixture_class, fixture_function):
        assert fixture_session == 'fixture_session'
        assert fixture_module == 'fixture_module'
        assert fixture_class == 'fixture_class'
        assert fixture_function == 'fixture_function'
>       assert False
E       assert False

/Users/CYu/Code/Python/python-demo/demo_pytest/test_0.py:16: AssertionError
fixture_function tear down
fixture_function tear up
F
self = <test_0.TestFixtureScope object at 0x105d24650>
fixture_session = 'fixture_session', fixture_module = 'fixture_module'
fixture_class = 'fixture_class', fixture_function = 'fixture_function'

    def test_two(self, fixture_session, fixture_module, fixture_class, fixture_function):
        assert fixture_session == 'fixture_session'
        assert fixture_module == 'fixture_module'
        assert fixture_class == 'fixture_class'
        assert fixture_function == 'fixture_function'
>       assert False
E       assert False

/Users/CYu/Code/Python/python-demo/demo_pytest/test_0.py:23: AssertionError
fixture_function tear down
fixture_class tear down
fixture_class tear up
fixture_function tear up
F
fixture_session = 'fixture_session', fixture_module = 'fixture_module'
fixture_class = 'fixture_class', fixture_function = 'fixture_function'

    def test_three(fixture_session, fixture_module, fixture_class, fixture_function):
        assert fixture_session == 'fixture_session'
        assert fixture_module == 'fixture_module'
        assert fixture_class == 'fixture_class'
        assert fixture_function == 'fixture_function'
>       assert False
E       assert False

/Users/CYu/Code/Python/python-demo/demo_pytest/test_0.py:31: AssertionError
fixture_function tear down
fixture_class tear down
fixture_module tear down
```

For **test_1.py**:

```
fixture_module tear up
fixture_class tear up
fixture_function tear up
F
fixture_session = 'fixture_session', fixture_module = 'fixture_module'
fixture_class = 'fixture_class', fixture_function = 'fixture_function'
foo = 'foo'

    def test_four(fixture_session, fixture_module, fixture_class, fixture_function, foo):
        assert fixture_session == 'fixture_session'
        assert fixture_module == 'fixture_module'
        assert fixture_class == 'fixture_class'
        assert fixture_function == 'fixture_function'
        assert foo == 'foo'
>       assert False
E       assert False

/Users/CYu/Code/Python/python-demo/demo_pytest/test_1.py:21: AssertionError
fixture_function tear down
fixture_class tear down
fixture_module tear down
fixture_session tear down
```

### Fixture's request

fixture的函数可以有一个输入的对象（通常命名为request），它包含了当前调用该fixture的方法的一些信息。另外，通过`pytest.fixture`的`params`参数可以创建多个不同的fixture对象供test代码调用，这个参数是通过`request.param`传递到fixture函数中的。

比如把上面`fixture_function`的代码修改如下：

```python
@pytest.fixture(scope='function', params=['1st', '2nd'])
def fixture_function(request):
    print 'fixture_function tear up'
    print request.session
    print request.module
    print request.node
    print request.param
    def fin():
        print 'fixture_function tear down'
    request.addfinalizer(fin)
    return 'fixture_function'	
```

使用`pytest demo_pytest -q -s --tb=no`运行结果如下（注意由于fixture有多个参数，用到该fixture的test也被执行了多次）：

```
fixture_session tear up
fixture_module tear up
fixture_class tear up
fixture_function tear up
<Session 'python-demo'>
<module 'test_0' from '/Users/CYu/Code/Python/python-demo/demo_pytest/test_0.py'>
<Function 'test_one[1st]'>
1st
Ffixture_function tear down
fixture_function tear up
<Session 'python-demo'>
<module 'test_0' from '/Users/CYu/Code/Python/python-demo/demo_pytest/test_0.py'>
<Function 'test_one[2nd]'>
2nd
Ffixture_function tear down
fixture_function tear up
<Session 'python-demo'>
<module 'test_0' from '/Users/CYu/Code/Python/python-demo/demo_pytest/test_0.py'>
<Function 'test_two[1st]'>
1st
Ffixture_function tear down
fixture_function tear up
<Session 'python-demo'>
<module 'test_0' from '/Users/CYu/Code/Python/python-demo/demo_pytest/test_0.py'>
<Function 'test_two[2nd]'>
2nd
Ffixture_function tear down
fixture_class tear down
fixture_class tear up
fixture_function tear up
<Session 'python-demo'>
<module 'test_0' from '/Users/CYu/Code/Python/python-demo/demo_pytest/test_0.py'>
<Function 'test_three[1st]'>
1st
Ffixture_function tear down
fixture_class tear down
fixture_class tear up
fixture_function tear up
<Session 'python-demo'>
<module 'test_0' from '/Users/CYu/Code/Python/python-demo/demo_pytest/test_0.py'>
<Function 'test_three[2nd]'>
2nd
Ffixture_function tear down
fixture_class tear down
fixture_module tear down
fixture_module tear up
fixture_class tear up
fixture_function tear up
<Session 'python-demo'>
<module 'test_1' from '/Users/CYu/Code/Python/python-demo/demo_pytest/test_1.py'>
<Function 'test_four[1st]'>
1st
Ffixture_function tear down
fixture_class tear down
fixture_class tear up
fixture_function tear up
<Session 'python-demo'>
<module 'test_1' from '/Users/CYu/Code/Python/python-demo/demo_pytest/test_1.py'>
<Function 'test_four[2nd]'>
2nd
Ffixture_function tear down
fixture_class tear down
fixture_module tear down
fixture_session tear down

8 failed in 0.05 seconds
```

### Fixture's autouse

顾名思义，就是不管test方法中是否有这个fixture的输入，都会自动调用该fixture。至于在什么时候自动调用，看该fixture的scope。比如module的scope的fixture会在执行每个module第一个test之前被调用。

比如在开头的conftest.py中添加：

```python
@pytest.fixture(scope='module', autouse=True)
def fixture_autouse():
    print 'fixture_autouse tear up'
    yield
    print 'fixture_autouse tear down'
```

使用`pytest demo_pytest -q -s --tb=no`运行结果如下：

```
fixture_autouse tear up
fixture_session tear up
fixture_module tear up
fixture_class tear up
fixture_function tear up
Ffixture_function tear down
fixture_function tear up
Ffixture_function tear down
fixture_class tear down
fixture_class tear up
fixture_function tear up
Ffixture_function tear down
fixture_class tear down
fixture_module tear down
fixture_autouse tear down
fixture_autouse tear up
fixture_module tear up
fixture_class tear up
fixture_function tear up
Ffixture_function tear down
fixture_class tear down
fixture_module tear down
fixture_autouse tear down
fixture_session tear down

4 failed in 0.05 seconds
```

autouse参数虽然很好用，但要慎用（算是黑魔法了，会加大理解代码的难度）。官方文档更建议的做法是类似下面的例子（即：用`pytest.mark.usefixtures`对整个class来使用某个需要autouse的fixture。如果要autouse到所有test，把这个class作为所有test class的基类即可）。

```python
import pytest

@pytest.mark.usefixtures('fixture_autouse')
class TestFixture(object):
    def test_one(self):
        pass
    
    def test_two(self):
        pass
```

### Easter egg

1. 使用Pycharm的`Go To Declaration`功能来寻找`pytest.fixture`的定义，你会发现找到`/Applications/PyCharm.app/Contents/helpers/python-skeletons/pytest/__init__.py`中去了，这里面只是定义了一些函数声明而已（只有docstring），真正的fixture代码是在`/usr/local/lib/python2.7/site-packages/_pytest/fixtures.py`里面。所以，**不要过度依赖IDE的一些功能**。
   那么，`pytest.fixture`是如何定位到`_pytest.fixtures.fixture`的呢？
   我们看一下`pytest.py`：

   ```python
   __all__ = [
       'main',
       'UsageError',
       'cmdline',
       'hookspec',
       'hookimpl',
       '__version__',
   ]

   if __name__ == '__main__': # if run as a script or by 'python -m pytest'
       # we trigger the below "else" condition by the following import
       import pytest
       raise SystemExit(pytest.main())

   # else we are imported

   from _pytest.config import (
       main, UsageError, _preloadplugins, cmdline,
       hookspec, hookimpl
   )
   from _pytest import __version__

   _preloadplugins() # to populate pytest.* namespace so help(pytest) works
   ```

   把`fixture`import进来的是最后一句：`_preloadplugins()`。

   之中的过程非常复杂，因为有许多事情要做（比如说init一些pytest自带的fixture）。简单来说它会调用到`_pytest.fixtures`中的`pytest_namespace`方法：

   ```python
   def pytest_namespace():
       scopename2class.update({
           'class': pytest.Class,
           'module': pytest.Module,
           'function': pytest.Item,
       })
       return {
           'fixture': fixture,
           'yield_fixture': yield_fixture,
           'collect': {'_fillfuncargs': fillfixtures}
       }
   ```

   然后通过`setattr(pytest, name, value)`的方式把上述返回的字典中的值添加到pytest这个模块对象中去。

   分析了这么多，pytest为什么要做的这么复杂呢。主要的好处是可以统一地去控制namespace，只暴露出一部分的方法供外界调用；其次是可以动态地绑定模块对象，比如我`pytest.fixture`可以绑定到`_pytest.fixtures.new_fixture`方法上，而外界使用者是不需要修改其调用代码的。

2. 如果你对fixture的实现方式感兴趣的话，看pytest的源码，会发现fixture函数并不是一个装饰器：

   ```python
   def fixture(scope="function", params=None, autouse=False, ids=None, name=None):
       if callable(scope) and params is None and autouse == False:
           # direct decoration
           return FixtureFunctionMarker(
                   "function", params, autouse, name=name)(scope)
       if params is not None and not isinstance(params, (list, tuple)):
           params = list(params)
       return FixtureFunctionMarker(scope, params, autouse, ids=ids, name=name)
   ```

   但其return的`FixtureFunctionMarker`是一个装饰器。是不是学了一招：**通过对装饰器再包一层函数可以返回不同的装饰器。**

3. 如果你手动执行一遍pytest的代码，你会发现在生成你定义的fixture之前，会先生成另外一些fixture。通过查看，可以看到这些名字（按照生成的顺序）：`pytestconfig`, `capsys`, `capfd`, `monkeypatch`, `tmpdir_factory`, `tmpdir`, `record_xml_property`, `doctest_namespace`, `cache`。是不是对这些名称有点熟悉，这些其实就是pytest自带的一些fixture，通过`pytest --fixtures`也可以进行查看（对比会发现这里漏了一个`recwarn`，这个fixture确实也会生成，但是它用的是`pytest.yield_fixture`来生成的，这个装饰器现在已经被deprecated了，也就只有`recwarn`会用到了）。

