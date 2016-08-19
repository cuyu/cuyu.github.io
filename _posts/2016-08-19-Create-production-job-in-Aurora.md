---
layout: post
title: "Create production job in Aurora"
category: Framework
tags: [Aurora, 坑]
date: 2016-08-19
---

### Problem

想create一个Aurora job，其中production=True，发现如下error message：

```
[root@pica-service bin]# aurora job create main/root/devel/source_datapump_datapump_task_systest-auto-master1901forecast_weather14714300361 /tmp/aurora_708374195

 INFO] Creating job source_datapump_datapump_task_systest-auto-master1901forecast_weather14714300361

Job creation failed due to error:

        Insufficient resource quota: CPU quota exceeded by 1.00 core(s); RAM quota exceeded by 1000.00 MB; DISK quota exceeded by 1000.00 MB
```

但我的资源明明是够的啊。

### Reason

然后在官方文档上看到这么一句：

> To grant quota to a particular role in production, an operator can use the command `aurora_admin set_quota`.

虽然说的不是很清楚，推测一下就是我要先设置一个quota供production的job使用。

然后我用aurora的命令查了下root role的quota，果然没设置都是0：

```
[root@pica-service bin]# aurora quota get main/root

 INFO] Getting quota for: root

Allocated:

  CPU: 0.0

  RAM: 0.000000 GB

  Disk: 0.000000 GB

Production shared pool resources consumed:

  CPU: 0.0

  RAM: 0.000000 GB

  Disk: 0.000000 GB

Production dedicated pool resources consumed:

  CPU: 0.0

  RAM: 0.000000 GB

  Disk: 0.000000 GB

Non-production shared pool resources consumed:

  CPU: 0.9

  RAM: 0.224609 GB

  Disk: 0.224609 GB

Non-production dedicated pool resources consumed:

  CPU: 0.0

  RAM: 0.000000 GB

  Disk: 0.000000 GB
```

### Solution

要先对所在角色赋予一定的资源，然后才能创建production的job：

```
[root@pica-service bin]# aurora_admin set_quota main root 10 10gb 10gb

 INFO] Setting quota for user:root cpu:10.000000 ram:10240 disk: 10240

 INFO] Response from scheduler: OK (message: )

 

[root@pica-service bin]# aurora job create main/root/devel/source_datapump_datapump_task_systest-auto-master1901forecast_weather14714300361 /tmp/aurora_708374195

 INFO] Creating job source_datapump_datapump_task_systest-auto-master1901forecast_weather14714300361

 INFO] Checking status of main/root/devel/source_datapump_datapump_task_systest-auto-master1901forecast_weather14714300361

Job create succeeded: job url=http://10.66.136.96:8081/scheduler/root/devel/source_datapump_datapump_task_systest-auto-master1901forecast_weather14714300361
```

