---
layout: post
title: "Aurora Job被Kill的原因"
category: Framework
tags: [Aurora, 坑]
date: 2016-08-22
---

根据目前实践的情况来看，主要有下面两种原因：

**一**是OOM(out of memory)了，可以通过检查job的schema分配的内存和实际消耗的内存来确定。解决方案是在job schema里面增加内存的分配。

**二**是Cron的job发生冲突了，而且此job的schema中的Collision Policies为`KILL_EXISTING`（default就是这个），那么根据官方文档是会被kill掉的：

> The `cron_collision_policy` field specifies the scheduler’s behavior when a new cron job is triggered while an older run hasn’t finished. The scheduler has two policies available:
>
> - `KILL_EXISTING`: The default policy - on a collision the old instances are killed and a instances with the current configuration are started.
> - `CANCEL_NEW`: On a collision the new run is cancelled.

解决方案是取消所有的同名job，然后重新schedule此job。（注意使用`aurora cron deschedule xxx`会把正在run的job从cron类型变成adhoc类型的job，并不会终止它，还需要使用`aurora job killall xxx`来把active的job终止掉。）