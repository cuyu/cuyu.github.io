---
layout: post
title: "Do not use multiprocessing.Queue in multiprocessing.Pool"
category: Python
tags: [multiprocessing, 坑]
date: 2016-06-22
---

### Problem

直接上代码：

```python
from multiprocessing import Process, Value, Array, Manager, Queue, Pool
import time

def func(n, a, q):
    # As stdout is print on this process and we cannot see, we use a file to display outputs.
    with open('/tmp/solution_one.txt', 'w') as f:
        for i in xrange(20):
            time.sleep(1)
            q.put(i)
            f.write(str(n.value))
            f.write(a[0])
            f.write('\n')

def main():
    num = Value('d', 1.1)
    arr = Array('u', ['a'])
    q = Queue()
    pool = Pool(1)
    result = pool.apply_async(func, (num, arr, q,))
    print result.get()


if __name__ == "__main__":
    main()
```

运行发现提示：

```
RuntimeError: Synchronized objects should only be shared between processes through inheritance
```

### Reason

查了下，这些通过inheritance来共享的对象（参见[ftofficer\|张聪的blog » Python multiprocessing 使用手记2 – 跨进程对象共享](http://blog.ftofficer.com/2009/12/python-multiprocessing-2-object-sharing-across-process/)），从实现上是通过管道来传递的，使用管道的一个前提是两个进程必须是父子进程，而进程池中的进程并不是由当前同一个父进程创建的，所以会报这个错误。

### Solution

**一**是不使用进程池，而直接用`Process()`来fork生成一个新进程；**二**是不使用通过inheritance来共享的对象，而用`multiprocessing.Manager().Queue()`，通过proxy的方式来共享对象。