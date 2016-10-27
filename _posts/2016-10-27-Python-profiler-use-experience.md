---
layout: post
title: "Python profiler use experience"
category: Python
tags: [Pycharm,profiler]
date: 2016-10-27
---

### [cProfile]( https://docs.python.org/2/library/profile.html#module-cProfile)###

Python标准库自带的profile工具库的C语言版本，可以用于简单程序的profile，但对多线程的程序使用起来不够友好。

#### Usage example

Refer to https://docs.python.org/2/library/profile.html#module-cProfile。注意cProfile得到的结果文件没法直接查看，需要通过pstats来展现分析的结果。

### [yappi](https://pypi.python.org/pypi/yappi)###

这个profiler的命名挺有意思(**y**et **a**nother **p**ython **p**rofiler)。

yappi支持三种输出：pstat，ystat和callgrind。pstat和标准库cProfile生成的文件格式是一样的；ystat是把它自己的结果直接`pickle.dump`的文件，供它自己再load分析使用（但我折腾了一下怎么load都出错，不知道为啥）；callgrind就是给[Callgrind](http://valgrind.org/docs/manual/cl-manual.html)使用的。

可以认为yappi是cProfile的加强版，不仅添加了对多线程profile的支持，还有许多不错的功能（但我想说它的文档真的很糟）：

> - Ability to analyze per-thread information. (*new in 0.94*)
> - Ability to hook underlying threading model events/properties. (*new in 0.92*)
> - Decorator to profile individual functions easily. (*new in 0.92*)
> - Profiler results can be saved in callgrind and pstat formats. (new in 0.82)
> - Profiler results can be merged from different sessions on-the-fly. (new in 0.82)
> - Profiler results can be easily converted to pstats. (new in 0.82)
> - Supports profiling per-thread CPU time. See [http://en.wikipedia.org/wiki/CPU_time](http://en.wikipedia.org/wiki/CPU_time) for details. (new in 0.62)
> - Profiling of multithreaded Python applications transparently.
> - Profiler can be started from any thread at any time.
> - Ability to get statistics at any time without even stopping the profiler.
> - Various flags to arrange/sort profiler results.

但我实际使用的感觉是，它的profiling per-thread CPU time的功能似乎还有问题？（所有线程的时间总是非常接近）

#### Result glossary

From[官方文档](https://code.google.com/archive/p/yappi/wikis/usageyappi.wiki)：

> The first one is **function stats**:
>
> - **name**: name of the function being profiled
> - **ncall**: is the total callcount of the function.
> - **tsub**: total spent time in the function minus the total time spent in the other functions called from this function.
> - **ttot**: total time spent in the function.
> - **tavg**: is same as ttot/ccnt. Average total time.
>
> the **thread stats** field gives information about the threads in the profiled application.
>
> - **name**: class name of the threading.thread object.
> - **tid**: thread identifier.
> - **fname**: name of the last executed function in this thread.
> - **ttot**: total time spent in this thread.
> - **scnt**: number of times the thread is scheduled.

#### Usage example

Use in terminal：

```
python -m yappi -o profile.pstat -f pstat your_script.py
```

Use in python code:

```python
import yappi
import threading


def func():
    for i in range(1000000):
        pass


def func2():
    for i in range(2):
        func()


def main():
    threads = []
    for i in range(3):
        t = threading.Thread(target=func)
        threads.append(t)
        t.start()

    for t in threads:
        t.join()


if __name__ == '__main__':
    yappi.start()
    main()
    yappi.get_func_stats().strip_dirs().print_all()
    yappi.get_thread_stats().print_all()
```

<!--break-->

### [Plop](https://github.com/bdarnell/plop)

**P**ython **L**ow-**O**verhead **P**rofiler。这个profiler的作用是可以查看程序运行时CPU的使用情况。它的工作原理是每隔一段时间对CPU运行的栈进行采样，最后统计各个Python方法被采样到的数目，从而可以近似认为是CPU在各个方法上的总耗时。

#### Usage example

Use in terminal:

```
python -m plop.collector -f flamegraph your_script.py
```

Then you can use [Flamegraph](https://github.com/brendangregg/FlameGraph) to visualise the result.

### [memory_profiler](https://pypi.python.org/pypi/memory_profiler)

用于profile内存使用情况的库。

#### Usage example

In Python code (memory_profiler only profiles the codes under the `memory_profiler.profile` decorator):

```python
from memory_profiler import profile
import threading


LARGE_NUMBER = 1000000 * 100


def func():
    for i in range(LARGE_NUMBER):
        pass


def func2():
    for i in range(2):
        func()


def func3():
    result = []
    a = 0
    for i in range(LARGE_NUMBER):
        a += i
    result.append(a)


@profile(precision=4)
def main():
    t = threading.Thread(target=func)
    t2 = threading.Thread(target=func2)
    t3 = threading.Thread(target=func3)

    t.start()
    t2.start()
    t3.start()

    t.join()
    t2.join()
    t3.join()


if __name__ == '__main__':
    main()
```

然后使用`python -m memory_profiler your_script.py`来执行此脚本即可。上述代码可以得到如下结果：

```
Line #    Mem usage    Increment   Line Contents
================================================
    33  18.6367 MiB   0.0000 MiB   @profile(precision=4)
    34                             def main():
    35  18.6445 MiB   0.0078 MiB       t = threading.Thread(target=func)
    36  18.6523 MiB   0.0078 MiB       t2 = threading.Thread(target=func2)
    37  18.6523 MiB   0.0000 MiB       t3 = threading.Thread(target=func3)
    38                             
    39 3126.9414 MiB 3108.2891 MiB       t.start()
    40 3126.9531 MiB   0.0117 MiB       t2.start()
    41 7440.2930 MiB 4313.3398 MiB       t3.start()
    42                             
    43 7699.1914 MiB 258.8984 MiB       t.join()
    44 6936.3203 MiB -762.8711 MiB       t2.join()
    45 6936.3242 MiB   0.0039 MiB       t3.join()
```

除此以外，memory_profiler还提供了分析整体程序运行时的内存使用情况（通过每隔一段时间来对使用内存采样）:

```
mprof run your_script.py
```

结束后使用如下命令可以得到刚分析的结果中内存消耗随时间的图像（需要额外安装`matplotlib`库）：

```
mprof plot
```

### [line_profiler](https://github.com/rkern/line_profiler)

#### Usage example

Python代码和上述的memory_profiler非常相似，只不过这里的`@profile`装饰器不需要import，它只是起到一个标示的作用，告诉line_profiler这个方法需要profile而已。

```python
import threading

LARGE_NUMBER = 1000000 * 100


def func():
    for i in range(LARGE_NUMBER):
        pass


def func2():
    for i in range(2):
        func()


def func3():
    result = []
    a = 0
    for i in range(LARGE_NUMBER):
        a += i
    result.append(a)


@profile
def main():
    t = threading.Thread(target=func)
    t2 = threading.Thread(target=func2)
    t3 = threading.Thread(target=func3)

    t.start()
    t2.start()
    t3.start()

    t.join()
    t2.join()
    t3.join()


if __name__ == '__main__':
    main()
```

而后再命令行中使用如下命令来分析此脚本：

```
kernprof -lv your_script.py
```

上述代码得到的分析结果如下：

```
Wrote profile results to your_script.py.lprof
Timer unit: 1e-06 s

Total time: 2.9593 s
File: profile_use_line_profiler.py
Function: main at line 31

Line #      Hits         Time  Per Hit   % Time  Line Contents
==============================================================
    31                                           @profile
    32                                           def main():
    33         1           56     56.0      0.0      t = threading.Thread(target=func)
    34         1           29     29.0      0.0      t2 = threading.Thread(target=func2)
    35         1           27     27.0      0.0      t3 = threading.Thread(target=func3)
    36                                           
    37         1       168499 168499.0      5.7      t.start()
    38         1       161554 161554.0      5.5      t2.start()
    39         1       225595 225595.0      7.6      t3.start()
    40                                           
    41         1      2081744 2081744.0     70.3      t.join()
    42         1       321784 321784.0     10.9      t2.join()
    43         1           11     11.0      0.0      t3.join()
```

### Profile with Pycharm###

Pycharm原生支持对你的python code进行profile（其实就是帮你写了几个命令行而已），怎么操作的可以参考它的[官方文档](https://www.jetbrains.com/help/pycharm/2016.2/profiler.html)，这里强调一点：Pycharm默认会使用标准库中的[cProfile](https://docs.python.org/2/library/profile.html#module-cProfile)来进行profile，虽然也能用，但**建议**安装了[yappi](https://pypi.python.org/pypi/yappi)再进行profile（如果你安装了这个库，Pycharm会优先使用它来profile）。

使用Pycharm进行profile的另外一个好处是，profile结束Pycharm会自动打开一个窗口里面有profile的pstat结果表格和类似Callgrind的图表（可以理解为all in one了）。

此外，通过Pycharm的[Thread Concurrency Visualization](https://www.jetbrains.com/help/pycharm/2016.2/thread-concurrency-visualization.html)，可以查看运行多线程的程序时，每个线程在各个时间段的状态（Running, Waitting for lock, Running with lock or Deadlock）。各个状态的解释：

- Waitting for lock：线程处于等待锁资源中；
- Running with lock：线程正在运行，并且携带了至少一把线程锁；
- Deadlock：线程处于等待状态，且是死锁（Pycharm是怎么确定是否是死锁的？）；
- Running：除以上三种状态，线程就算是在正常运行。

使用Thread Concurrency Visualization我们主要是查看了线程锁的使用情况（我们可以除去一些不必要的锁以提高性能），而无法知晓线程切换的情况，以及每个线程占用的CPU等资源情况。

### Conclusion

当你需要：

- 查看每个方法的调用和耗时：使用Pycharm的profile工具（cProfile, yappi）。
- 查看线程锁的使用情况：使用Pycharm的Thread Concurrency Visualization。
- 查看多线程下的CPU使用情况：使用yappi或plop（推荐后者）。
- 查看某个方法中运行到各个语句时内存使用情况：使用memory_profiler。
- 查看具体某个方法的耗时分布：使用line_profiler。