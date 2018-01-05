---
layout: post
title: "Where to patch?"
category: Python
tags: [mock, 坑]
date: 2018-01-05
---

在用`mock`这个库的时候碰到一个坑，即“where to patch”的问题。我尝试把问题重现了一下，简化成了如下的版本：

首先有这样一个安装好的package，目录结构如下：

```
mypkg
├── __init__.py
├── lib
│   ├── __init__.py
│   ├── another_lib.py
│   └── mylib.py
└── main.py
```

其中，`another_lib.py`中代码很简单，就一个函数：

```python
def hello():
    print('hello')
```

在`mylib.py`中会调用another_lib.py中的那个函数：

```python
from another_lib import hello

def myfunc():
    hello()
```

而`main.py`中则调用了mylib.py中的函数（两个`__init__.py`都是空的）：

```python
import sys
import os
dirname = os.path.dirname(os.path.normpath(os.path.join(__file__)))
sys.path.append(os.path.join(dirname, "lib"))
from mylib import myfunc

def main():
    myfunc()
```

现在，在我的目标是想要用`mock`来替换函数`hello`。

<!--break-->

按照正常的思路，我是这么做的：

```python
from mypkg.main import main
from mock import patch

@patch('mypkg.lib.mylib.hello')
def demo(mock_func):
    main()

if __name__ == '__main__':
    demo()
```

但实际情况是，"hello"还是被打印出来了，即替换失败了。

正确的做法是这样的：

```python
from mypkg.main import main
from mock import patch

@patch('mylib.hello')
def demo(mock_func):
    main()

if __name__ == '__main__':
    demo()
```

即一开始patch的位置不对，but why？

我们可以看一看所有import的模块，找一找其中名为`mylib`的模块：

```python
import sys

modules = [sys.modules[v] for v in sys.modules.keys() if 'mylib' in v]
print(modules)
# [<module 'mylib' from '/usr/local/lib/python2.7/site-packages/mypkg/lib/mylib.pyc'>, None, <module 'mypkg.lib.mylib' from '/usr/local/lib/python2.7/site-packages/mypkg/lib/mylib.pyc'>]

```

发现了没，这样类似的模块竟然有三个！其中有两个还是指向的同一个文件！

造成这种情况的原因其实就是因为`main.py`中通过修改`sys.path`来import了`mylib.py`中的成员，**在`sys.path`中添加了路径之后，该路径下的所有模块又重新导入了一遍**，又因为相对路径不同，导入的模块名称就变成了`mylib`，而不是原来的`mypkg.lib.mylib`。虽然两者指向的是同一个文件，但在内存中却是两个不同的Python模块对象，在`main.py`中import的是`mylib.myfunc`，执行时自然调用的是`mylib.hello`！