---
layout: post
title: "Catch all the exceptions"
category: Python
tags: [stackoverflow, 心得]
date: 2017-03-08
---

### 问题以及一个不够优雅的解决方法

之前写代码碰到过这样一个需求：假设一段程序中有三个语句要执行：

```python
operation_one()
operation_two()
operation_three()
```

而这些语句都有可能抛出某种异常，我希望即使某个语句抛出异常了，之后的语句还能被执行。而把所有语句放在一个`try..catch`语句中是不能满足要求的，因为出现异常后，直接会进入异常处理分支，之后的语句就被跳过了，简单模拟一下就是这样的情形：

```python
class MyException(BaseException):
    pass

def operation_one():
    print 'Operation one executed'
    raise MyException()

def operation_two():
    print 'Operation two executed'
    raise MyException()

def operation_three():
    print 'Operation three executed'
    raise MyException()

if __name__ == '__main__':
    try:
        operation_one()
        operation_two()
        operation_three()
    except MyException:
        print 'Catch MyException'
```

上述代码执行得到的结果为：

```
Operation one executed
Catch MyException
```

显然不能满足需求。

<!--break-->

一个显而易见的解决方法是，对每个语句都进行`try..catch`，也就是把上面的函数执行部分改为：

```python
if __name__ == '__main__':
    try:
        operation_one()
    except MyException:
        print 'Catch MyException'
    finally:
        try:
            operation_two()
        except MyException:
            print 'Catch MyException'
        finally:
            try:
                operation_three()
            except MyException:
                print 'Catch MyException'
```

执行结果为：

```
Operation one executed
Catch MyException
Operation two executed
Catch MyException
Operation three executed
Catch MyException
```

结果令人满意，但实现方式实在不够优雅。那么是否存在这样一种方式，可以像只用一个`try..catch`语句那样，把所有的执行语句包裹起来，同时能达到确保每个语句都能执行到呢？甚至可以是一个装饰器：

```python
@catch_all
def my_operations():
    operation_one()
    operation_two()
    operation_three()
```

或者是一个`with`语句：

```python
with catch_all:
    operation_one()
    operation_two()
    operation_three()
```

### 几个思路

1. 实现一个Exception抑制器，用来包裹每个操作函数（其实就是帮你省去了写`try..catch`的时间）（参考[Python clean way to wrap individual statements in a try except block](http://stackoverflow.com/questions/7271245/python-clean-way-to-wrap-individual-statements-in-a-try-except-block)）。使用的时候大概是这样的：

   ```python
   suppressor(operation_one)
   suppressor(operation_two)
   suppressor(operation_three)
   ```

2. 还是实现一个Exception抑制器，在执行第一个操作前初始化抑制器，每抛出一个指定异常，则抑制器中计数器加一，在执行完最后一个操作后，一次性抛出抑制器中“缓存”的异常。（怎么实现暂时还没想到）实现出来大概长这样：

   ```python
   suppressor.start()
   operation_one()
   operation_two()
   operation_three()
   suppressor.close()
   ```

3. 在源头上去捕获异常。即实现一个装饰器，该装饰器的作用是可以捕获特定的异常，在每个操作的方法定义时使用该装饰器，执行所有操作就和平常执行一样。这种方式的局限在于不灵活，无法满足有时候就是希望操作能抛出异常的情况。

4. 函数一旦执行了就很难再对它做操作了（就只能在编译这一层来做事情了），所以可以实现一个方法，在函数执行之前作为list传递进去，在其中逐个执行这些函数，同时递归地捕获异常。比如下面这样：

   ```python
   def catch_all(functions, exception_type):
       func = functions[0]
       try:
           func()
       except exception_type:
           print 'Catch exception!'
       finally:
           catch_all(functions[1:], exception_type)
   ```

### 除此之外的一些思考

这里通篇讨论了怎样去实现一个连续异常捕获的方法，但其实真的需要去实现这样一个东西吗，我觉得这是要考虑的事情，即一个操作已经抛出异常了，即使再把后面的操作执行了，又怎么能保证就达到预想的结果呢。异常的作用就是告诉你这一步出问题了，后面在错的基础上再操作反而可能是错上加错，所以我们就停留在最先错的这一步好了。而如果这个异常是无关紧要的，那么为什么设计时要抛出它呢。所以，可能一个系统设计得合理了，就根本不需要考虑此文中讨论的那些东西！