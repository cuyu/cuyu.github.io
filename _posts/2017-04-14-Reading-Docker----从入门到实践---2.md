---
layout: post
title: "Reading &lt;Docker -- 从入门到实践&gt; - 2"
category: Framework
tags: [docker, 读书笔记]
date: 2017-04-14
---

### 高级网络配置

> 当 Docker 启动时，会自动在主机上创建一个 `docker0` 虚拟网桥，实际上是 Linux 的一个 bridge，可以理解为一个软件交换机。它会在挂载到它的网口之间进行转发。
>
> 同时，Docker 随机分配一个本地未占用的私有网段（在 [RFC1918](http://tools.ietf.org/html/rfc1918) 中定义）中的一个地址给 `docker0` 接口。比如典型的 `172.17.42.1`，掩码为 `255.255.0.0`。此后启动的容器内的网口也会自动分配一个同一网段（`172.17.0.0/16`）的地址。
>
> 当创建一个 Docker 容器的时候，同时会创建了一对 `veth pair` 接口（当数据包发送到一个接口时，另外一个接口也可以收到相同的数据包）。这对接口一端在容器内，即 `eth0`；另一端在本地并被挂载到 `docker0` 网桥，名称以 `veth` 开头（例如 `vethAQI2QT`）。通过这种方式，主机可以跟容器通信，容器之间也可以相互通信。Docker 就创建了在主机和所有容器之间一个虚拟共享网络。
>
> ![Docker 网络](https://yeasy.gitbooks.io/docker_practice/content/_images/network.png)

可以理解为在宿主机器上建立了一个容器之间互通的“局域网”。

---

> 其中有些命令选项只有在 Docker 服务启动的时候才能配置，而且不能马上生效。
>
> - `-b BRIDGE or --bridge=BRIDGE` --指定容器挂载的网桥
> - `--bip=CIDR` --定制 docker0 的掩码
> - `-H SOCKET... or --host=SOCKET...` --Docker 服务端接收命令的通道
> - `--icc=true|false` --是否支持容器之间进行通信
> - `--ip-forward=true|false` --请看下文容器之间的通信
> - `--iptables=true|false` --是否允许 Docker 添加 iptables 规则
> - `--mtu=BYTES` --容器网络中的 MTU
>
> 下面2个命令选项既可以在启动服务时指定，也可以 Docker 容器启动（`docker run`）时候指定。在 Docker 服务启动的时候指定则会成为默认值，后面执行 `docker run` 时可以覆盖设置的默认值。
>
> - `--dns=IP_ADDRESS...` --使用指定的DNS服务器
> - `--dns-search=DOMAIN...` --指定DNS搜索域
>
> 最后这些选项只有在 `docker run` 执行时使用，因为它是针对容器的特性内容。
>
> - `-h HOSTNAME or --hostname=HOSTNAME` --配置容器主机名
> - `--link=CONTAINER_NAME:ALIAS` --添加到另一个容器的连接
> - `--net=bridge|none|container:NAME_or_ID|host` --配置容器的桥接模式
> - `-p SPEC or --publish=SPEC` --映射容器端口到宿主主机
> - `-P or --publish-all=true|false` --映射容器所有端口到宿主主机

Docker服务是指后台一直运行的Docker server。

---

> 容器之间相互访问，需要两方面的支持。
>
> - 容器的网络拓扑是否已经互联。默认情况下，所有容器都会被连接到 `docker0` 网桥上。
> - 本地系统的防火墙软件 -- `iptables` 是否允许通过。

这里的默认情况是指容器的`--net`设置为`bridge`（默认设置）。

---

> 默认情况下，不同容器之间是允许网络互通的。如果为了安全考虑，可以在 `/etc/default/docker` 文件中配置 `DOCKER_OPTS=--icc=false` 来禁止它。

这个配置的是Docker服务，即配置了过后所有启动的容器网络都是不通的。

---

> 在通过 `--icc=false` 关闭网络访问后，可以通过 `--link=CONTAINER_NAME:ALIAS` 选项来访问容器的开放端口。

> 注意：`--link=CONTAINER_NAME:ALIAS` 中的 `CONTAINER_NAME` 目前必须是 Docker 分配的名字，或使用 `--name` 参数指定的名字。主机名则不会被识别。

这个配置就是针对某个要启动的容器而言的，它的实现其实就是在各自容器的`iptables`里面把彼此添加到whitelist里面。

<!--break-->

---

> 默认情况下，容器可以主动访问到外部网络的连接，但是外部网络无法访问到容器。

> 容器所有到外部网络的连接，源地址都会被NAT成本地系统的IP地址。这是使用 `iptables` 的源地址伪装操作实现的。

> 容器允许外部访问，可以在 `docker run` 时候通过 `-p` 或 `-P` 参数来启用。
>
> 不管用哪种办法，其实也是在本地的 `iptable` 的NAT表中添加相应的规则。

容器的网络通信的控制主要是通过`iptables`来实现的。

默认情况下（即使用默认bridge网桥），外部网络无法访问到容器，是因为默认的bridge没有和物理网卡绑定。而通过`-p`端口映射后，指定的端口是直接和宿主机器的端口绑定的，只要宿主机器对应的端口可以被外部访问，则容器也可以被访问。当然，可以通过将容器使用的网桥手动绑定到物理网卡上来实现整个容器都能被外部访问。

---

### 安全

> 当用 `docker run` 启动一个容器时，在后台 Docker 为容器创建了一个独立的命名空间和控制组集合。
>
> 命名空间提供了最基础也是最直接的隔离，在容器中运行的进程不会被运行在主机上的进程和其它容器发现和作用。

> 从网络架构的角度来看，所有的容器通过本地主机的网桥接口相互通信，就像物理机器通过物理交换机通信一样。

---

> 控制组是 Linux 容器机制的另外一个关键组件，负责实现资源的审计和限制。
>
> 它提供了很多有用的特性；以及确保各个容器可以公平地分享主机的内存、CPU、磁盘 IO 等资源；当然，更重要的是，控制组确保了当容器内的资源使用产生压力时不会连累主机系统。

这里的控制组（cgroups）是Linux系统比较新的一个特性，它可以限制一个进程可以使用的资源数目，比如cpu核心数，内存大小等等。但需要注意的是，一些shell的命令（或者一些代码库中的系统调用）得到的资源信息可能和控制组是相冲突的，比如我用控制组限制了容器的内存大小，这时候在容器中使用`free -m`来检测出来的可用内存其实并没有考虑到控制组的作用，它得到的结果是docker deamon设置的每个容器的资源情况（通过挂载文件到`/proc/meminfo`）。所以在使用控制组时，需要注意可能会有很多坑！

---

> 大部分情况下，容器并不需要“真正的” root 权限，容器只需要少数的能力即可。为了加强安全，容器可以禁用一些没必要的权限。
>
> - 完全禁止任何 mount 操作；
> - 禁止直接访问本地主机的套接字；
> - 禁止访问一些文件系统的操作，比如创建新的设备、修改文件属性等；
> - 禁止模块加载。
>
> 这样，就算攻击者在容器中取得了 root 权限，也不能获得本地主机的较高权限，能进行的破坏也有限。

简单说就是要将容器内的权限和宿主机器的权限分离开，减小风险。

这里的风险主要是指容器中运行的程序可能会给宿主机器带来的风险，比如通过修改挂载的文件进而达到破坏宿主文件的目的。

---

### 底层实现

> Docker 采用了 C/S架构，包括客户端和服务端。 Docker daemon 作为服务端接受来自客户的请求，并处理这些请求（创建、运行、分发容器）。 客户端和服务端既可以运行在一个机器上，也可通过 socket 或者 RESTful API 来进行通信。

C/S应该是指Client/Server，这种分离的架构让Docker天生就适应分布式系统。

---

> 不同用户的进程就是通过 pid 命名空间隔离开的，且不同命名空间中可以有相同 pid。所有的 LXC 进程在 Docker 中的父进程为Docker进程，每个 LXC 进程具有不同的命名空间。同时由于允许嵌套，因此可以很方便的实现嵌套的 Docker 容器。

Docker in Docker in Docker...Docker版盗梦空间，啊哈哈。

除了pid命名空间隔离外，net、ipc、mnt、uts、user命名空间均在容器间隔离了。

---

> Docker 中的网络接口默认都是虚拟的接口。虚拟接口的优势之一是转发效率较高。 Linux 通过在内核中进行数据复制来实现虚拟接口之间的数据转发，发送接口的发送缓存中的数据包被直接复制到接收接口的接收缓存中。

---

> 可以在 `docker run` 的时候通过 `--net` 参数来指定容器的网络配置，有4个可选值：
>
> - `--net=bridge` 这个是默认值，连接到默认的网桥。
> - `--net=host` 告诉 Docker 不要将容器网络放到隔离的命名空间中，即不要容器化容器内的网络。此时容器使用本地主机的网络，它拥有完全的本地主机接口访问权限。容器进程可以跟主机其它 root 进程一样可以打开低范围的端口，可以访问本地网络服务比如 D-bus，还可以让容器做一些影响整个主机系统的事情，比如重启主机。因此使用这个选项的时候要非常小心。如果进一步的使用 `--privileged=true`，容器会被允许直接配置主机的网络堆栈。
> - `--net=container:NAME_or_ID` 让 Docker 将新建容器的进程放到一个已存在容器的网络栈中，新容器进程有自己的文件系统、进程列表和资源限制，但会和已存在的容器共享 IP 地址和端口等网络资源，两者进程可以直接通过 `lo` 环回接口通信。
> - `--net=none` 让 Docker 将新容器放到隔离的网络栈中，但是不进行网络配置。之后，用户可以自己进行配置。

`--net=host`的容器不需要映射端口就可以直接与外部互相通信，就和宿主机器与外部通信一样。

---

### Docker Compose 项目

> Docker Compose 是 Docker 官方编排（Orchestration）项目之一，负责快速在集群中部署分布式应用。

感觉类似一些传统软件部署的工具，比如Ansible，不过这里是部署容器。

如果说Docker最大的好处在于让infrastruction as code，那么Docker Compose的好处便是让configuration as code。（用代码表示总比用文档表示更方便和直接，也更不容易出问题。）

---

> Compose 项目由 Python 编写，实现上调用了 Docker 服务提供的 API 来对容器进行管理。因此，只要所操作的平台支持 Docker API，就可以在其上利用 Compose 来进行编排管理。

即使没有安装Python，也可以直接下载安装好Python和Docker Compose的容器来直接使用，这正是容器的魅力所在！

---

> Compose 命令的基本的使用格式是
>
> ```
> docker-compose [-f=<arg>...] [options] [COMMAND] [ARGS...]
> ```

注意可以用`-f`命令来指定Docker Compose模板文件，如果不指定那就是`docker-compose.yml`。

---

> #### `scale`
>
> 格式为 `docker-compose scale [options] [SERVICE=NUM...]`。
>
> 设置指定服务运行的容器个数。
>
> 通过 `service=num` 的参数来设置数量。例如：
>
> ```
> $ docker-compose scale web=3 db=2
>
> ```
>
> 将启动 3 个容器运行 web 服务，2 个容器运行 db 服务。
>
> 一般的，当指定数目多于该服务当前实际运行容器，将新创建并启动容器；反之，将停止容器。

即定义时可以对每种镜像只定义一个容器，启动时利用`scale`命令可以很灵活地启动多个基于同一个镜像的容器。（使用该命令时，模板在定义容器的端口映射时不要指定宿主机器的端口（让它随机分配），不然端口会被占用产生冲突）

---

> #### `up`
>
> 格式为 `docker-compose up [options] [SERVICE...]`。
>
> 该命令十分强大，它将尝试自动完成包括构建镜像，（重新）创建服务，启动服务，并关联服务相关容器的一系列操作。

对于大部分Docker Compose项目而言，只需要到相应目录简单地执行下`docker-compose up`就可以了，不要太简单。当然用完后记得`docker-compose down`来删除对应的容器。

---

关于怎么写Docker Compose的模板文件，直接看[这里](https://yeasy.gitbooks.io/docker_practice/content/compose/yaml_file.html)或者官方文档吧。只提一点，`expose`和`ports`的区别（当`--net=bridge`）：前者只是在容器层面打开了某个端口，并没有做端口映射，所以外部是无法访问这个容器的这个端口的（如果是默认的网桥的话，宿主机器也无法访问该容器），只有和这个容器桥接在同一个网桥的其他容器可以访问；而后者是和宿主机器做了端口映射，外部可以通过访问宿主机器访问到该容器。

---

### Docker Machine 项目

> Docker Machine 是 Docker 官方编排（Orchestration）项目之一，负责在多种平台上快速安装 Docker 环境。

简单的说，Docker Machine的目的就是一键安装Docker。因为有了Docker之后其他任何依赖都可以很方便的获取，那么获取Docker本身就成了要需要关注的点。并且Docker Machine还可以做一些其他事情：

> You can use Docker Machine to:
>
> - Install and run Docker on Mac or Windows
> - Provision and manage multiple remote Docker hosts
> - Provision Swarm clusters

如果说Docker Compose是容器级别的编排工具，那么Docker Machine就是Docker engine (a.k.a Docker server)级别的编排工具。

---

### Docker Swarm 项目

> Docker Swarm 是 Docker 官方编排（Orchestration）项目之一，负责对 Docker 集群进行管理。

> Docker Swarm 是 Docker公司官方在 2014 年 12月初发布的一套管理 Docker 集群的工具。它将一群 Docker 宿主机变成一个单一的，虚拟的主机。

又来一个编排工具，来理一理它和之前介绍的Docker Compose、Docker Machine的关系吧。

首先，Docker Swarm管理的对象也是Docker server，它和Docker Machine的区别在于，它负责的是任务在不同Docker server之间的调度和分配，而后者则只负责Docker server的安装。

然后，Docker Compose只需要和一个Docker server来通信，告诉它要起多少个什么样的容器，而Docker Swarm则是要和多个Docker server（每个Docker server上也要安装Docker Swarm）打交道的，告诉它们各自需要启动哪些容器。

总之，Docker Swarm的目的就是让分布式的Docker环境用起来和单机的Docker环境一样。比如原本通过Docker Compose在单机上启动多个容器，现在同样可以借此在多个机器上来分别启动这些容器。

---

> 在使用 Swarm 管理docker 集群时，会有一个 swarm manager 以及若干的 swarm node，swarm manager上运行 swarm daemon，用户只需要跟 swarm manager 通信，然后 swarm manager 再根据discovery service的信息选择一个swarm node 来运行container。
>
> 值得注意的是 swarm daemon 只是一个任务调度器(scheduler)和路由器(router),它本身不运行容器，它只接受 Docker client 发送过来的请求，调度合适的 swarm node 来运行 container。这意味着，即使 swarm daemon 由于某些原因挂掉了，已经运行起来的容器也不会有任何影响。

所以说Docker Swarm (manager)只是在原来的Docker engine外面包了一层，当有docker调用过来时，它会把调用分发出去让别的Docker engine来执行，而不是直接在原来的Docker engine里面执行。

实际操作时，启动容器时是和外层的Docker Swarm manager的端口通信的，而不是Docker本身api的端口（如果和Docker的api端口通信，那就只能在那一个机器上启动容器了）。

---

> Docker 集群管理需要使用服务发现(Discovery service backend)功能，Swarm支持以下的几种方式：DockerHub 提供的服务发现功能，本地的文件，etcd，consul，zookeeper 和 IP 列表

---

> swarm支持多种调度策略来选择节点。每次在swarm启动container的时候，swarm会根据选择的调度策略来选择节点运行container。目前支持的有:spread,binpack和random。

> 使用spread策略，swarm会选择一个正在运行的container的数量最少的那个节点来运行container。这种情况会导致启动的container会尽可能的分布在不同的机器上运行，这样的好处就是如果有节点坏掉的时候不会损失太多的container。
>
> binpack 则相反，这种情况下，swarm会尽可能的把所有的容器放在一台节点上面运行。这种策略会避免容器碎片化，因为他会把未使用的机器分配给更大的容器，带来的好处就是swarm会使用最少的节点运行最多的容器。

如果各个容器所占的资源差不太多，用spread策略，反之用binpack。