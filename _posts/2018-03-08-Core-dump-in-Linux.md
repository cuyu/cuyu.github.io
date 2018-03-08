---
layout: post
title: "Core dump in Linux"
category: Other
tags: [Linux, docker]
date: 2018-03-08
---

## How to enable core dump ##

### Enable core dump ###

使用`ulimit`命令，比如：

- 设置生成的core dump文件大小不受限制：`ulimit -c unlimited`
- 查看当前的core dump限制（默认为0，即不生成core dump）：`ulimit -c`

修改`/etc/security/limits.conf`设置文件中下面这一行，以保证重启后core dump设置依然生效：

```
*               soft    core            unlimited
```

### Set the location/format of core dump file ###

修改`/proc/sys/kernel/core_pattern`文件即可。比如：

```
echo "/corefile/core-%e-%p-%t" > /proc/sys/kernel/core_pattern
```

其中，%后面的为特殊的格式：

> ```
> 	%p	pid
> 	%P	global pid (init PID namespace)
> 	%i	tid
> 	%I	global tid (init PID namespace)
> 	%u	uid (in initial user namespace)
> 	%g	gid (in initial user namespace)
> 	%d	dump mode, matches PR_SET_DUMPABLE and
> 		/proc/sys/fs/suid_dumpable
> 	%s	signal number
> 	%t	UNIX time of dump
> 	%h	hostname
> 	%e	executable filename (may be shortened)
> 	%E	executable path
> ```

<!--break-->

### A simple test ###

随便执行一段错误的代码即可，比如：

```
kill -s SIGSEGV $$
```

## Why can't I find my core dump file ##

除去设置的因素外，还有一种原因是，core dump通过管道传输到某个程序中了：

> [/proc/sys/kernel/]core_pattern is used to specify a core dumpfile pattern name.
>
> - If the first character of the pattern is a '|', the kernel will treat the rest of the pattern as a command to run. The core dump will be written to the standard input of that program instead of to a file.

比较常见的程序有apport，它在`/proc/sys/kernel/core_pattern`中的设置是这样的：

```
|/usr/share/apport/apport %p %s %c %d %P
```

## About apport ##

apport的文档在[这](https://wiki.ubuntu.com/Apport)。这里找到了一些比较有意思的点：

> Note that even if `ulimit` is set to disabled core files (by specyfing a core file size of zero using `ulimit -c 0`), apport will *still* capture the crash.

前提是先要enable apport。

> For intercepting Python crashes it installs a `/etc/python*/sitecustomize.py` to call apport on unhandled exceptions.

Python这一段，我[之前](/python/2017/12/12/Inject-python-code-before-__main__-function)也有用到过类似的手段来注入代码。

## Core dump in docker container ##

目前docker容器中enable core dump会比较麻烦，因为kernel并没有被隔离，所以你会发现`/proc/sys/kernel/core_pattern`是以只读的形式挂载的，无法修改，且同一个宿主机上所有的容器都共享这同一份kernel配置文件。

目前的解决方法似乎只有修改宿主机器的`/proc/sys/kernel/core_pattern`文件这一种方法。当然，docker社区也有[issue](https://github.com/moby/moby/issues/19289)准备改善这个问题，试图通过对每个container都单独创建一个独立的kernel配置文件再挂载来解决。

## Reference ##

- [https://www.jianshu.com/p/5549a6e71a1d](https://www.jianshu.com/p/5549a6e71a1d)
- [https://stackoverflow.com/questions/2065912/core-dumped-but-core-file-is-not-in-current-directory](https://stackoverflow.com/questions/2065912/core-dumped-but-core-file-is-not-in-current-directory)
- [https://wiki.ubuntu.com/Apport](https://wiki.ubuntu.com/Apport)
- [https://zhuanlan.zhihu.com/p/24311785](https://zhuanlan.zhihu.com/p/24311785)
- [https://github.com/moby/moby/issues/19289](https://github.com/moby/moby/issues/19289)

