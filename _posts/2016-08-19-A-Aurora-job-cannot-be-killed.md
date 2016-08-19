---
layout: post
title: "A Aurora job cannot be killed"
category: Framework
tags: [Aurora, 坑]
date: 2016-08-19
---

### Problem

问题是这样的，我写了个脚本来list出所有的Aurora job然后逐一`killall`来删除所有的job。然而执行完脚本后，过了一段时间发现还有一个job还在`Mesos`里run。

这不是要逆天了嘛，速速kill掉：

```
[root@pica-service bin]# aurora job killall main/root/devel/source_nike_test_test_0

No tasks to kill found for job main/root/devel/source_nike_test_test_0

Job killall succeeded
```

显示kill成功了啊，但是回去mesos上一看，job还在那run的好好的呢。

于是我灵机一动，先创建一个同名的job再删除不就行了（感觉自己好机智）。

然而：

```

[root@pica-service bin]# aurora job create main/root/devel/source_nike_test_test0 /tmp/aurora708374195

 INFO] Creating job source_nike_test_test_0

Job creation failed due to error:

        Job root/devel/source_nike_test_test_0 already exists
```

就在我看着Aurora job的页面发呆的时候，突然发现这个job和别的job不太一样啊，它是`cron`的job！再联想下`aurora`命令是单独有一个`cron`的选项的，要删除cron的job需要走这个选项才行：

```
[root@pica-service bin]# aurora cron deschedule main/root/devel/source_nike_test_test_0

 INFO] Removing cron schedule for job main/root/devel/source_nike_test_test_0

Cron descheduling succeeded.
```

### Conclusion

Aurora的job分两种：普通job和cron job。普通job又可以由它的service属性分为service job和adhoc job。普通job都可以通过`aurora job killall`来删除，而cron job则需要通过`aurora cron deschedule`来删除。

顺便说一下Aurora和Mesos之间的关系：Mesos提供了Api来创建它的task，而Aurora会根据自己的job去调用Mesos的Api（比如说一个cron job就是定期去call这个Api）。所以如果看到Mesos上有一个Task一直在run，那可不是Mesos的问题，它只是一个任劳任怨地小工头，后面的大老板说啥它做啥而已。