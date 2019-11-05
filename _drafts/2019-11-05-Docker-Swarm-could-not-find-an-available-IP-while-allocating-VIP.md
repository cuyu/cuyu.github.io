---
layout: post
title: "Docker Swarm: could not find an available IP while allocating VIP"
category: Framework
tags: [docker, 坑]
date: 2019-11-05
---

在docker swarm上起service，出现了失败的情况，检查docker engine的log（centos在`/var/log/messages`中），发现了类似"Failed allocation for service y2gutzknvip94rubs32mlzb86" error="could not find an available IP while allocating VIP"的error log。



一些相关的知识：

1. [subnet](https://en.wikipedia.org/wiki/Subnetwork)：一般表示为`子网的首个ip地址/子网前面固定的bit数目`，比如`192.0.2.0/24`表示从192.0.2.0到192.0.2.255共256个ip地址（即前24个bit是这个子网的prefix，是固定不变的）。因此，`192.0.2.0/16`要比`192.0.2.0/24`拥有更多的ip。

   > 网络上，数据从一个地方传到另外一个地方，是依靠 IP 寻址。
   > 从逻辑上来讲，是两步的。
   > 第一步，从 IP 中找到所属的网络，好比是去找这个人是哪个小区的；
   > 第二布，再从 IP 中找到主机在这个网络中的位置，好比是在小区里面找到这个人。

2. 