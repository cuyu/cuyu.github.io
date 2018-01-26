---
layout: post
title: "About 'deque mutated during iteration'"
category: Python
tags: [坑]
date: 2018-01-26
---

写代码用到Python标准库中的deque数据结构，结果在遍历时出现了如下的异常：

```
RuntimeError: deque mutated during iteration
```

一开始我理解为了在遍历deque时不能修改队列中的元素，尝试了一下发现不是这样子的:

```python
from collections import deque

q = deque()
q.append(1)
q.append({'a': 1})
q.append(3)
v = iter(q)
next(v)  # 1
q[1]['b'] = 2
next(v)  # {'a': 1, 'b': 2}
next(v)  # 3
```

上面的代码可以正常运行。所以，这个异常也许表示在遍历时，deque长度不能发生变化？

```python
from collections import deque

q = deque()
q.append(1)
q.append({'a': 1})
q.append(3)
v = iter(q)
next(v)  # 1
q.append(4)
next(v)  # raise RuntimeError: deque mutated during iteration
```

THAT'S IT!

所以，如果你的队列在遍历时的同时可能还会有新的元素插入进来的话，可以考虑使用list或是Queue.Queue，而不是deque。