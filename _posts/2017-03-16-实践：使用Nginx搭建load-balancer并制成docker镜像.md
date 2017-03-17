---
layout: post
title: "实践：使用Nginx搭建load balancer并制成docker镜像"
category: Framework
tags: [docker, Nginx, bash]
date: 2017-03-16
---

首先，项目在此：[nginx-lb](https://github.com/cuyu/nginx-lb)。

### load balance和reverse proxy的区别

首先，load balance的目的是为了均衡负载。它本身可以是一个代理，也可以不是。没有代理功能的话，那么每进来一个访问，它会redirect到某一台真正的服务器。而更多的则是有代理功能，主要是通过一台web server来代理需要负载均衡的多台服务器。通过这样一层代理可以屏蔽后面的那些服务器。所以，这种load balancer本身也是有load的，它的load主要就是代理的流量产生的网络负载，它所均衡的是后面多台服务器的计算负载。

而反向代理，就纯粹是为了代理的目的，“反向”是相对正常的放在客户端之后的代理而言的，这个代理和load balancer一样是放在服务器端之前的。反向代理的目的主要是为了隔离它身后的被它代理的服务器，它代理的服务器可以是一台也可以是多台（多台的话就兼顾了load balancer的作用）。

以上，load balance和reverse proxy的主要目的是不同的，当然它们有功能重叠的部分，且实现方式也比较类似。

### 使用Nginx搭建load balancer

Nginx使用起来其实还是挺容易的，这里我们只需要修改`nginx.conf`文件，再启动Nginx服务即可。其中关于load balance配置的部分可以参考[官方文档](https://www.nginx.com/resources/admin-guide/load-balancer/)。关键的配置是load balance策略的选择，对此官方安装包中自带了一些方法，比如`round-robin`、`least_conn`、`ip_hash`等。不同的策略会导致分配负载时结果略有不同。

但这里我并没有选择官方提供的策略，而是选择了第三方的一个模块[sticky](https://bitbucket.org/nginx-goodies/nginx-sticky-module-ng)。原因在于，官方提供的方法不能很好地解决一个session里面的目标服务器必须是同一个的问题。对于某些场景下session里面的连接对象变化了没什么影响，但很多场景下，如果我访问的真实服务器从一台机器突然变到了另外一台服务器上，就容易出现问题。对此，一种解决方法是使用官方的`ip_hash`策略，即同一个访问ip永远都是会映射到同一个目标服务器上，但这样又不是很灵活，毕竟一个ip可能是由100台不同的电脑共享的。而[sticky](https://bitbucket.org/nginx-goodies/nginx-sticky-module-ng)是以session为单位来分配目标服务器的，正是我们所需要的。

<!--break-->

### 制作docker镜像及调试优化

过程非常简单，就是写一个`Dockerfile`。这里记录一些实践相关的经验。

1. 基础镜像的选择。原则是选择稳定的且容量尽量小的镜像。选择好基础镜像后可以先下载下来，通过类似`docker run -it --name ubuntu ubuntu /bin/bash`的命令登陆到该系统中并模拟镜像制作的流程。
2. 调试制作的镜像可以先将容器启动起来，再通过`docker exec -it [NAME]`来登录到容器中进行调试。
3. 镜像中每层新安装的软件记得在当前层中把安装包删掉。使用`apt-get update`更新并安装好需要的东西后，也可以通过`rm -rf /var/lib/apt/lists/*`来删除更新的内容。
4. 运行docker container卡住的话，可以尝试在另一个terminal session里面执行`docker stop [NAME]`来结束该进程。
5. 使用`-v`挂载容器外部的文件或文件夹时，如果外部不存在该文件或文件夹，docker是会自动创建一个该路径的文件夹的。通过挂载外部文件是一个比较方便地传递大量参数的方式（相当于传递了conf文件）。

### 写shell脚本遇到的坑

由于日常写脚本都是用Python，很少会用到shell写脚本。虽然大部分bash命令都比较简单，但写成shell脚本还是遇到了一些坑。记录一下，以后避开。

1. 赋值语句`=`两端不能有空格。

2. 变量调用时前面要添加`$`符号。比如：

   ```sh
   name='aaa'
   echo $name
   ```

3. 只有双引号中的`$`符号会进行转义，单引号不会。比如：

   ```sh
   name='aaa'
   echo '$name' # $name
   echo "$name" # aaa
   ```

4. 条件判断语句尽量用双中括号而不要用单中括号，某些情况单括号更容易出错。比如：

   ```sh
   if [ $1 == 'aaa' ]; then # Wrong!
   ```

   当输入参数为空时，其实括号中变成了`[ == 'aaa' ]`，所以这里需要用双引号包一下：

   ```sh
   if [ "$1" == 'aaa' ]; then # Right!
   ```

   或者用双中括号的话就不用考虑这些了：

   ```sh
   if [[ $1 == 'aaa' ]]; then # Right!
   ```

   ​