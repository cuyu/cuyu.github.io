---
layout: post
title: "Strange: threads not join till the end"
category: Python
tags: [坑, paramiko]
date: 2016-12-29
---

### Appearances

I implement a test process with pytest. The test set interacts with some remote test targets through paramiko. As many test targets are involved, multi-threads are used to do something concurrently. The problem is that the main process sometimes can not terminate successfully (i.e. hangs). When investigating the problem, I also found there are several threads which are not joined to the main thread till the end of the test.

This is so strange because all the multi-threads I used are definitely joined successfully.

### Behind the appearance

So there must be some threads generated not by myself.

After calling `Transport.start_client` method, an extra thread will be generated. Let's see the definition below:

```python
def start_client(self, event=None):
    """
    Negotiate a new SSH2 session as a client.  This is the first step after
    creating a new `.Transport`.  A separate thread is created for protocol
    negotiation.

    If an event is passed in, this method returns immediately.  When
    negotiation is done (successful or not), the given ``Event`` will
    be triggered.  On failure, `is_active` will return ``False``.

    (Since 1.4) If ``event`` is ``None``, this method will not return until
    negotation is done.  On success, the method returns normally.
    Otherwise an SSHException is raised.

    After a successful negotiation, you will usually want to authenticate,
    calling `auth_password <Transport.auth_password>` or
    `auth_publickey <Transport.auth_publickey>`.

    .. note:: `connect` is a simpler method for connecting as a client.

    .. note::
        After calling this method (or `start_server` or `connect`), you
        should no longer directly read from or write to the original socket
        object.

    :param .threading.Event event:
        an event to trigger when negotiation is complete (optional)

    :raises SSHException: if negotiation fails (and no ``event`` was passed
        in)
    """
    self.active = True
    if event is not None:
        # async, return immediately and let the app poll for completion
        self.completion_event = event
        self.start()
        return

    # synchronous, wait for a result
    self.completion_event = event = threading.Event()
    self.start()
    while True:
        event.wait(0.1)
        if not self.active:
            e = self.get_exception()
            if e is not None:
                raise e
            raise SSHException('Negotiation failed.')
        if event.is_set():
            break
```

And look at the class inheritance of `Transport`:

```python
class Transport (threading.Thread, ClosingContextManager):
```

So the truth is that **each paramiko connection will generate an individual thread and this thread lasts all the life period of the paramiko object!**

BTW, a known bug of paramiko is the termination of the main thread may cause the Transport threads throw exceptions like below:

```
Exception in thread Thread-24 (most likely raised during interpreter shutdown):Exception in thread Thread-17 (most likely raised during interpreter shutdown):
```

