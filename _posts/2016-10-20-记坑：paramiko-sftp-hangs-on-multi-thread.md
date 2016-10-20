---
layout: post
title: "记坑：paramiko sftp hangs on multi-thread"
category: Python
tags: [坑,paramiko]
date: 2016-10-20
---

### Problem

问题代码如下：

```python
class NodeLogCollector(object):
    LOG_FILES = frozenset(['audit.log',
                           'metrics.log',
                           'mongod.log',
                           'scheduler.log'])

    def __init__(self, node):
        self.node = node
        self._sftp = self.node.ssh_connection._client.open_sftp()
        self._logs = {}  # A dict to record the collected logs from log files.
        for name in self.LOG_FILES:
            self._logs[name] = []
        self._terminate = False
        self._tail_threads = []

    def __del__(self):
        self._sftp.close()

    def tail_log(self, file_name):
        file_path = os.path.join(self.node.home_path, 'var', 'log', file_name)
        with self._sftp.file(file_path, 'r') as f:
            f.seek(0, os.SEEK_END)
            while not self._terminate:
                for line in f:
                    self._logs[file_name].append((time.time(), line,))
                time.sleep(0.1)
                offset = f.tell()
                f.seek(offset)

    def start_tail_all_logs(self):
        for name in self.LOG_FILES:
            t = threading.Thread(target=self.tail_log, args=(name,))
            self._tail_threads.append(t)
            t.start()

    def stop_tail_all_logs(self):
        self._terminate = True
        for t in self._tail_threads:
            t.join()
```

这是一个用于收集远程机器上的指定log文件内容的类，用于初始化的`node`包含一个paramiko对象，通过sftp可以直接读取远端的某个文件，这个功能在单线程下是测试成功了的。问题在于使用多线程后，线程总是会hang住，通过打log发现是hang在了`stop_tail_all_logs`中的`t.join()`语句，why？

### Reason

进一步研究发现，在多线程时，执行时线程会hang在`with self._sftp.file(file_path, 'r') as f:`这一句上，也就是说线程并没有进入里面的循环，所以也不会受到结束信号来结束了。而当我只开了一个线程时，不会有hang住的问题。

hang在with语句上一般只有一个原因，那就是资源被锁住了，线程一直无法获取资源所以一直在等待。因此可以推断：**一个`paramiko.sftp`对象只能打开一个文件，而不能同时打开多个文件！**

### Solution

解决方法就是针对每个要读取的文件申请一个`paramiko.sftp`对象来单独监控即可。