---
layout: post
title: "Terminate multi process/thread in Python correctly and gracefully"
category: Python
tags: [multiprocessing, 坑]
date: 2016-08-15
---

I encountered these problems when I try to use `Mesos` to run my Python scripts as tasks. I found some tasks cannot finish as expect although the main process/thread is terminated.

### Problem 1

See code first:

```python
import multiprocessing
import time


def hang():
    while True:
        print 'hanging..'
        time.sleep(10)


def main():
    p = multiprocessing.Process(target=hang)
    p.start()
    time.sleep(10)
    print 'main process exiting..'


if __name__ == '__main__':
    main()

```

Run the above code by `python myscript.py`, and we can see the output result is:

```
hanging..
hanging..
main process exiting..
hanging..
hanging..
hanging..
```

From the result, we may find the finish of main process will not terminate its subprocesses. And the commandline is blocking until we press `ctrl-c`.

<!--break-->

### Solution

The solution is simple: just use the `terminate()` method of `multiprocess.Process`.

The revised code is as follows:

```python
import multiprocessing
import time


def hang():
    while True:
        print 'hanging..'
        time.sleep(10)


def main():
    p = multiprocessing.Process(target=hang)
    p.start()
    time.sleep(10)
    p.terminate()
    p.join()
    print 'main process exiting..'


if __name__ == '__main__':
    main()

```

### Problem 2

Then we replace the `multiprocess.Process` with `threading.Thread`:

```python
import threading
import time


def hang():
    while True:
        print 'hanging..'
        time.sleep(10)


def main():
    t = threading.Thread(target=hang)
    t.start()
    time.sleep(10)
    print 'main process exiting..'


if __name__ == '__main__':
    main()

```

Here comes the problem: There is no `terminate` or similar method in `threading.Thread`, so we cannot use the solution of first problem. Also, `ctrl-c` cannot break out the python process here (this seems is a bug of Python).

### Solution

We can send some siginal to the threads we want to terminate. The simplest siginal is global variable:

```python
import threading
import time

_FINISH = False


def hang():
    while True:
        if _FINISH:
            break
        print 'hanging..'
        time.sleep(10)


def main():
    global _FINISH
    t = threading.Thread(target=hang)
    t.start()
    time.sleep(10)
    _FINISH = True
    t.join()
    print 'main process exiting..'


if __name__ == '__main__':
    main()

```

Notice that the thread will not terminate until the `t.join()` is execute. (Actually, the global variable `_FINISH` in the thread is still 'False' when we set it to 'True' in the main thread. After we  execute the `t.join()`, it becomes 'True' in the thread.)

### Problem 3

```python
import time
from multiprocessing.pool import ThreadPool


def hang():
    while True:
        print 'hanging..'
        time.sleep(10)


def main():
    pool = ThreadPool(processes=1)
    pool.apply_async(hang)
    time.sleep(10)
    print 'main process exiting..'


if __name__ == '__main__':
    main()

```

This script actually can exit correctly. The threads start by the threadpool will automatically terminated when the main thread is end. However, there should be some more graceful exit method.

### Solution

```python
import time
from multiprocessing.pool import ThreadPool

_FINISH = False


def hang():
    while True:
        if _FINISH:
            break
        print 'hanging..'
        time.sleep(10)


def main():
    global _FINISH
    pool = ThreadPool(processes=1)
    pool.apply_async(hang)
    time.sleep(10)
    _FINISH = True
    pool.terminate()
    pool.join()
    print 'main process exiting..'


if __name__ == '__main__':
    main()

```
Here, the `pool.terminate()` will terminate the threads of thread pool (these threads are used to manage tasks of the pool). After `pool.join()`, the work threads are terminated and there is only main thread left.