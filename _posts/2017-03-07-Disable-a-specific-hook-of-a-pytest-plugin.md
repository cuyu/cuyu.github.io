---
layout: post
title: "单独禁用pytest插件中的某个hook方法"
category: Python
tags: [pytest, 心得]
date: 2017-03-07
---

### 问题

需求很简单：我安装了一个pytest的插件，其中大部分功能都是我需要的，但唯独其中某个hook我不希望生效，该如何单独禁用掉这一个hook？

### 解决方法

首先尝试了Python中最常用的hack别人代码的方式：即定义一个新的函数，然后尽早地去把指定hook函数替换为这个新建的函数。比如，我想把`pytest-pep8`插件中的`pytest_collection` hook给禁用掉，那么就需要尽可能早地执行下面的代码：

```python
from pytest_pep8 import plugin

def hacked_pytest_collection():
    pass

plugin.pytest_collection = hacked_pytest_collection
```

但实验下来，该方法并不好用，原因在于你很难在pytest注册各个插件的hook之前去替换掉指定的hook方法。

---

因此，换个思路，直接修改pytest注册的插件的hook不就可以了嘛，这个修改的代码只要在要被禁用的hook执行之前被执行即可。

比如下面这样，在自己的pytest插件的`pytest_sessionstart` hook中进行修改操作：

```python
def pytest_sessionstart(session):
    # Disable pytest-pep8's `pytest_collection` hook in pytest.config
    for hook in pytest.config.hook.pytest_collection._nonwrappers:
        if hook.plugin_name == 'pep8':
            pytest.config.hook.pytest_collection._nonwrappers.remove(hook)
            break
    for hook in pytest.config.hook.pytest_collection._wrappers:
        if hook.plugin_name == 'pep8':
            pytest.config.hook.pytest_collection._wrappers.remove(hook)
            break
```

以上，由于`pytest_sessionstart`会在`pytest_collection`之前执行，所以轮到执行`pytest_collection`的hook时，`pytest-pep8`的该方法已经被移除掉了。