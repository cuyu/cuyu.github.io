---
layout: post
title: "Use cron-style schedule correctly"
category: Other
tags: [坑]
date: 2016-08-23
---

### 遇到的一个坑

我在Aurora上新建了一个cron的job，并希望它每天run一次。然后发现这个job每隔两三分钟就会被Aurora给Kill掉，研究了半天Aurora自动Kill job的机制（参考上一篇[blog](/framework/2016/08/22/Aurora-Job被Kill的原因)），然后把这个job的`cron_collision_policy`改成了`CANCEL_NEW`。果然job不会被kill了，但是发现这个job并没有像预想的那样每天只run一次，而是job执行结束后立马又开始run了。

### Cron的机制

首先cron发起自Unix系统，其中的`crontab`命令想必都是听说过的，这个命令其实就是修改了`/etc/crontab`文件。打开这个文件，可以看到这样的内容：

```shell
SHELL=/bin/bash
PATH=/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root

# For details see man 4 crontabs

# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name  command to be executed
```

里面已经对cron的机制有了简单的说明。简单地说，就是使用了5个符号来分别定义不同的time scope，通过组合可以定义最短每分钟执行一次到最长每年执行一次。

这里需要先解释下cron里面可以使用的一些符号：

- `*`：它表示'every one'，比如第一个`*`表示每分钟，第二个表示每小时，以此类推。所以默认的`* * * * * `就表示每一分钟。
- `number`：一般的数字，对不同的位置范围要求是不一样的，表示指定的某个时间内。比如`* 14 * * *`表示每天的14点内的每一分钟。
- `,`：用来连接不同的符号，让这些符号可以共同作用于同一个time scope。比如`0,30 12,18 * * *`表示每天12点整，12点半，18点整和18点半。
- `-`：它用来连接两个数字，表示这两个数字之间都选取上。比如`9-17 * * * *`表示每个小时的第9到第17分钟。
- `/n`: 它表示'every n*th*'，也就是步长，其实这个功能用`,`也可以实现，主要是为了简洁和方便。比如`*/2 * * * *`表示每两分钟，而`*/1`和`*`其实是等价的。再比如说`* 12 10-16/2 * *` 和`* 12 10,12,14,16 * *`是等价的。

以上，我们可以用这些符号写出任何我们想要的时间段。

结合crontab，举个复杂一点的例子：

```
*/10 12-18/2 1-15,17,20-25 * * root backup.sh
```

这个例子会在每个月的1到15号，17号，20-25号的12点，14点，16点和18点的0分，10分，20分...来以root的身份执行backup.sh脚本。

### 回到坑里来

问题其实出在cron job里面的cron设置上，我把每天执行一次写成了`* * */1 * *`，而`*/1`和`*`其实是等价的，所以这个cron的意义是每分钟执行一次，这也就能解释为什么我的Aurora job会有collision了。解决方法是把它改成`0 0 * * *`就可以了（会在每天0点整执行）。