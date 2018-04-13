---
layout: post
title: "Debug Python script using PDB"
category: Python
tags: [心得,IPython]
date: 2016-08-11
---

## Why I need to use PDB to debug Python script

现在各种强大的Python IDE都已经很好地实现了debug的功能，那么我们为啥还需要这样一种命令行的工具来进行debug呢。

这是个好问题，因为我也一直是用Pycharm来调试Python脚本的，感觉也非常方便好用。直到最近，在部署一个服务器应用的时候出现了问题，这个问题在本地无法重现。当然，我首先想到的是使用Remote Debugging来进行调试（参见[Remote debugging with Pycharm](/python/2016/07/12/Remote-debugging-with-Pycharm)），毕竟比较熟悉了。然而Remote Debugging有以下问题是比较麻烦的：

- 本地环境和远程环境不一致（包括操作系统、Python编译器版本、Python package版本等）
- 一旦远程或本地的代码有所改动，会影响debug的断点位置
- 需要的配置有些小复杂（比如要配置本地和远程的代码路径的mapping）

因此，在遇到上述问题时（尤其是环境不一致的问题），登陆到远程机器使用PDB来debug是一个不错的选择。

简单的说，PDB有如下优势：

- 不需要安装，源自Python标准库
- 纯命令行操作（这点在没有可视界面的操作系统上非常重要）
- 非常容易上手（虽然相比IDE debug起来不那么直观）

<!--break-->

## How to debug with PDB

### Basic usage

- **l** (list) 显示断点所在的上下文代码。


- **p** (print) 显示某个变量在断点处的内容。
  既然直接输入变量回车就能把这个变量打印出来，为啥还需要用p来打印变量呢？在我debug python的logging lib的时候发现了原因：

  ```python
  def callHandlers(self, record):
      c = self
      found = 0
      while c:
          for hdlr in c.handlers:
              found = found + 1
              if record.levelno >= hdlr.level:
                  hdlr.handle(record)
                  if not c.propagate:
                      c = None    #break out
                      else:
                          c = c.parent
                          if (found == 0) and raiseExceptions and not self.manager.emittedNoHandlerWarning:
                              sys.stderr.write("No handlers could be found for logger"
                                               " \"%s\"\n" % self.name)
                              self.manager.emittedNoHandlerWarning = 1
  ```

  在debug到第二行时，我想知道变量`c`的值时，直接输入c是不行的（会直接到达下一个断点），此时就需要输入`p c`来显示变量c的值了。即，对PDB的关键字和保留字必须用`p`来显示变量内容。

- **n** (next) 单步执行代码，相当于Pycharm的`Step Over`。

- **s** (step) 单步进入断点所在函数，相当于Pycharm的`Step Into`。

- **c** (continue) 直接到达下个断点处，相当于Pycharm的`Resume Program`。

- **b** (break) 动态添加断点，用法为b后面加上行号。

- **u** (up) 进入上一层的stack trace的frame，这在断点停留在抛出的异常时非常有用，使用这个命令我们可以查看抛出异常时的一些变量状态。

- **d** (down) 和上面的命令相反，进入下一层的stack trace的frame。

- **q** (quit) 结束调试。

### Get into debugger when an exception occurs

这个功能在Pycharm中debug时经常会用到，即当程序抛出异常时可以直接进入debug界面。

下面的例子是stackoverflow的[一个回答](http://stackoverflow.com/questions/242485/starting-python-debugger-automatically-on-error)，当执行这段脚本时，会直接进入PDB的debug页面并且break在`print a[0]`这一行。

```python
import pdb, traceback, sys

def bombs():
    a = []
    print a[0]

if __name__ == '__main__':
    try:
        bombs()
    except:
        type, value, tb = sys.exc_info()
        traceback.print_exc()
        pdb.post_mortem(tb)
```

## Enhance PDB

### Enhance PDB with IPython

既然用到了命令行操作，第一个想到的就是[IPython](https://ipython.org)。如果能在PDB的时候用上IPython的丰富的色彩和提示功能启不是很爽？

#### 使用ipdb

原本以为只要把原来的`python myscript.py`改成`ipython myscript.py`就行了，结果并没有变化。搜了一下，已经有人做了PDB和IPython的整合，项目就叫[ipdb](https://github.com/gotcha/ipdb)，可以直接使用`pip install ipdb`来安装，然后把原来代码中的所有`pdb`都改为`ipdb`即可。比如说上面debug exception的例子，变成如下就可以了：

```python
import ipdb, traceback, sys

def bombs():
    a = []
    print a[0]

if __name__ == '__main__':
    try:
        bombs()
    except:
        type, value, tb = sys.exc_info()
        traceback.print_exc()
        ipdb.post_mortem(tb)
```

当然[ipdb](https://github.com/gotcha/ipdb)还对pdb做了一些其他的enhancement，可以到它的github页面查看。

#### 直接使用IPython

如果并不想安装ipdb，直接用IPython来debug也是可以的（毕竟ipdb主要也只是整合了IPython和pdb而已）。参考IPython的[官方文档](https://ipython.org/ipython-doc/2/interactive/reference.html#using-the-python-debugger-pdb)，可以在进入IPython的交互界面后，使用`%run -d myscript`命令来debug一个脚本。

**举个例子**，这是我们要执行的脚本`myscript.py`的内容：

```python
def bombs():
    a = []
    print a[0]


if __name__ == '__main__':
    bombs()
```

进入IPython的交互界面后，执行`%run -d myscript.py`，即可直接进入带有IPython功能的PDB的界面，且断点在代码第一行：

```python
In [1]: %run -d myscript.py
Breakpoint 1 at /Users/CYu/Code/Python/python-demo/myscript.py:1
NOTE: Enter 'c' at the ipdb>  prompt to continue execution.
> /Users/CYu/Code/Python/python-demo/myscript.py(1)<module>()
1---> 1 def bombs():
      2     a = []
      3     print a[0]
      4 
      5 

ipdb> 
```

注意到上面的debug界面pdb也被替换成了ipdb，但其实和之前说的`ipdb`没啥关系。

在IPython中想要debug exception也很方便，完全不需要在`myscript.py`中添加任何代码，直接使用`%run`执行脚本后，再使用`%debug`就能“恢复”进入到异常所在处进行PDB：

```python
In [1]: %run myscript.py
---------------------------------------------------------------------------
IndexError                                Traceback (most recent call last)
/Users/CYu/Code/Python/python-demo/myscript.py in <module>()
      5 
      6 if __name__ == '__main__':
----> 7     bombs()

/Users/CYu/Code/Python/python-demo/myscript.py in bombs()
      1 def bombs():
      2     a = []
----> 3     print a[0]
      4 
      5 

IndexError: list index out of range

In [2]: %debug
> /Users/CYu/Code/Python/python-demo/myscript.py(3)bombs()
      1 def bombs():
      2     a = []
----> 3     print a[0]
      4 
      5 

ipdb> 

```

如果觉得每次有异常了输入`%debug`也有点麻烦，可以使用`%pdb`命令来打开自动debug异常的模式（相当于每次有异常了自动帮你打`%debug`）:

```python
In [1]: %pdb
Automatic pdb calling has been turned ON

In [2]: %run demo_pdb.py
---------------------------------------------------------------------------
IndexError                                Traceback (most recent call last)
/Users/CYu/Code/Python/python-demo/demo_pdb.py in <module>()
      5 
      6 if __name__ == '__main__':
----> 7     bombs()

/Users/CYu/Code/Python/python-demo/demo_pdb.py in bombs()
      1 def bombs():
      2     a = []
----> 3     print a[0]
      4 
      5 

IndexError: list index out of range
> /Users/CYu/Code/Python/python-demo/demo_pdb.py(3)bombs()
      1 def bombs():
      2     a = []
----> 3     print a[0]
      4 
      5 

ipdb> 
```

### Enhance PDB to debug multiprocess

PDB不够强大的一点就在于它没法debug multiprocess的代码，强行debug也是报错，原因是其他进程的stdin/out/err等文件对主进程而言是关闭的，pdb无法调用。而Pycharm之所以可以debug multiprocess的代码是因为它使用了Remote Debugging的技术，通过远程通信来进行debug（所以debug一个multiprocess的程序和debug一个远程机器上的代码技术实现上是一样的）。

如果还是想使用PDB来debug multiprocess的话，可以参考[最简单方法远程调试Python多进程子程序](http://blog.ptsang.net/debugging_python_multiprocessing)和[PDB远程调试Python多进程子程序](http://blog.ptsang.net/rm_pdb_module_for_debugging_multiprocessing)这两篇文章。简单的说，就是通过管道或socket来传递debug的信息，从而使得PDB跨进程也可以使用（感觉近似于自己实现了类似Remote Debugging的功能）。

如果觉得这样做比较麻烦的话，就要移步使用别的带有Remote Debugging功能的库了。

## 小结

如果想要快速地在远程服务器上debug Python代码，请使用PDB。

如果想舒服地使用PDB，请使用IPython。

如果想debug multiprocess的代码，需要更复杂的设置（但debug起来并不复杂）或是使用其他已经实现了Remote Debugging的工具。