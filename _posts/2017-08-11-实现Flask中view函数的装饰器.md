---
layout: post
title: "实现Flask中view函数的装饰器"
category: Python
tags: [Flask, decorator, 坑]
date: 2017-08-11
---

### 问题一

下面的代码会报错：

```python
from flask import Flask, request, Response, redirect
import time

app = Flask(__name__)

def check_cookie(func):
    def wrapper():
        if not request.cookies:
            return redirect('/login')
        else:
            func()
    return wrapper

@app.route('/')
@check_cookie
def hello_world():
    return 'hello world'

@app.route('/show')
@check_cookie
def show():
    return request.cookies.__str__()
```

错误提示为：

```
AssertionError: View function mapping is overwriting an existing endpoint function: wrapper
```

原因在于，上述经过`@check_cookie`装饰过的函数的函数名称都叫做`wrapper`了，而Flask会维护一个dict存放rule和对应的endpoint，这里所有的endpoint在Flask看来都叫做`wrapper`。问题是我这里只是函数名称叫`wrapper`，怎么就变成了endpoint也叫`wrapper`了？

<!--break-->

因为默认情况下，Flask正是看函数名称的：

```python
def _endpoint_from_view_func(view_func):
    """Internal helper that returns the default endpoint for a given
    function.  This always is the function name.
    """
    assert view_func is not None, 'expected view func if endpoint ' \
                                  'is not provided.'
    return view_func.__name__
```

另一个问题是，Flask维护这么一个dict的意义何在？为何不直接用函数对象本身做mapping？我的理解是为了并发，因为如果用函数对象做mapping，那是不是我启用多个进程的话来处理请求的话，每个进程起来要先收集这些view函数，制作rule和view函数的映射，再处理请求。而用view函数名做mapping则可以将该rule和函数名（endpoint）的映射反复用于所有的进程。（没仔细看Flask源码，以上推测不保证其正确性-_-）

### 解决问题

好了，知道了出错的原因，我们就可以对症下药了。

**解决方案一**，那就把每个`wrapper.__name__`设成唯一的呗：

```python
def check_cookie(func):
    def wrapper():
        if not request.cookies:
            return redirect('/login')
        else:
            func()
    wrapper.__name__ = func.__name__
    return wrapper
```

**解决方案二**，显式设置每个view函数的endpoint名称：

```python
from flask import Flask, request, Response, redirect
import time

app = Flask(__name__)

def check_cookie(func):
    def wrapper():
        if not request.cookies:
            return redirect('/login')
        else:
            func()
    return wrapper

@app.route('/', endpoint='hello_world')
@check_cookie
def hello_world():
    return 'hello world'

@app.route('/show', endpoint='show')
@check_cookie
def show():
    return request.cookies.__str__()
```

**解决方案三**，使用`functools.wraps`来装饰下`wrapper`函数（其实做的事情和方案一是差不多的，只不过除了`__name__`以外它还把`__module__`、`__doc__`和`__dict__`也复制到`wrapper`上去了）：

```python
from functools import wraps

def check_cookie(func):
    @wraps(func)
    def wrapper():
        if not request.cookies:
            return redirect('/login')
        else:
            func()
    return wrapper
```

### 问题二

下面的代码是不work的，`@check_cookie`这个装饰器返回的函数永远都不会被执行到：

```python
@check_cookie
@app.route('/')
def hello_world():
    return 'hello world'
```

必须把`@app.route`装饰器放在最上面（即最外层）才能正确工作，why？

要弄清楚这个问题，首先需要知道一个函数上面使用了多个装饰器时发生了什么。比如：

```python
def deco(n):
    def inner_decorator(f):
        print n, 'inner'
        def wrapper():
            print n, f.__name__
            f()
        return wrapper
    return inner_decorator

@deco(n=1)
@deco(n=2)
def demo():
    print 'hello world'
```

执行`demo`方法后会打印出什么样的结果？

结论是：

```
2 inner
1 inner
1 wrapper
2 demo
hello world
```

也就是说它的执行其实相当于`deco(n=1)(deco(n=2)(demo))()`（这里的`demo`方法上没有挂载装饰器），所以它会先执行最外面的`deco(n=1)`得到一个装饰器方法并以`deco(n=2)(demo)`作为输入，里面也一样是先执行`deco(n=2)`得到一个装饰器方法并以`demo`作为输入，最后得到一个被装饰过的函数，并执行。

如果上面的看起来还是有点晕，那么我们简化一下，变成下面这样不带参数的装饰器：

```python
def deco2(f):
    print 'inner', f.__name__
    def wrapper():
        print f.__name__
        f()
    return wrapper

@deco2
@deco2
def demo():
    print 'hello world'
```

以上相当于`deco2(deco2(demo))()`（不带装饰器的`demo`），它可以分成两个阶段，在装饰阶段，会执行前半段`deco2(deco2(demo))`得到一个装饰过的函数，这一阶段，内层装饰器会先执行返回对应的装饰函数（对应就是放在下面的那个`@deco2`会先被执行），而在函数运行阶段，即执行装饰过的`demo`函数时，外层的装饰器内部的`wrapper`函数会被先执行（也很好理解，因为编译阶段最后返回得到的就是最外层的装饰器中的`wrapper`函数嘛）。

以上，可以说，当一个函数被多个装饰器装饰时：

- 在装饰阶段，最下面的装饰器会被先调用，并返回对应的装饰过的函数，而上面的装饰器会以下面的装饰器装饰过的函数作为输入，并再次装饰下面装饰器装饰过的函数，返回一个装饰了多次的函数，以此类推；
- 在函数执行阶段，最上面的装饰器中的返回的多次装饰过的函数会先执行，在其执行当中会调用下面的装饰器返回的装饰过的函数，以此类推。

回到最开始的问题，为什么放在`@app.route`装饰器上面的装饰器没有作用？因为在装饰阶段，Flask会去把rule和其对应的函数方法绑定起来，如果`@app.route`放在了下面，那么它绑定的就是未经装饰的view函数本身（这里就是`hello_world`函数），请求过来时根据rule最终调用的也是未经装饰的函数了。而将`@app.route`放在最上面，则可以在Flask进行绑定时，绑定最终装饰过的函数。

### 解决问题

把`@app.route`装饰器放在其他所有装饰器的上面。