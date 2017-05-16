---
layout: post
title: "Develop Python apps with containerized interpreter"
category: Python
tags: [Pycharm, docker]
date: 2017-05-15
---

最近帮同事部署Python开发环境碰到一个OpenSSL相关的问题，最后发现是由于他使用的MacOS自带的Python，而对应的自带的OpenSSL版本过低导致的。解决方法也不难，就是重新安装最新的OpenSSL以及Python，但是排查问题和安装确实花费了不少时间。想来现在Python已经广泛使用的virtualenv虽然已经解决了很大一部分开发环境的问题，但很多系统级别的依赖包产生的问题却是它无法解决的（比如不同的Python版本以及上面提到的问题）。

随后联想到现在很火的容器技术，如果把**整个**开发环境全部打包，岂不是就不会再因此而头疼了？

事实上，就连Pycharm都已经支持使用Docker的image来作为Python编译器远程debug了（因为是remote debugging，使用时感觉会有一些卡顿）！具体设置可以参考[官方的文档](https://blog.jetbrains.com/pycharm/2015/12/using-docker-in-pycharm/)。因此我们只需要在我们原先写`requirements.txt`的位置添加一个`Dockerfile`，其中使用现成的安装好Python编译器以及所需系统依赖的镜像作为基础镜像，再添加一层来pip install `requirements.txt`里面的package即可。（感觉做一个tool来做这件事情会🔥啊，也可能已经有人在做了！）

随着CI/CD的发展，什么都在往Code上靠，像Configuration as Code、Infrastruction as Code、Pipeline as Code等等概念层出不穷。对于这些概念，我是持双手赞成的，因为这些都变成Code之后，虽然要写的代码变多了，但是长远来看却是降低了代码的维护成本（比如突然换了一个人来维护代码也能迅速部署好开发环境）。因此，将整个开发环境全部打包也许在不久的将来就会成为软件开发的标准做法吧。