---
layout: post
title: "Reading <Docker -- 从入门到实践> - 1"
category: Framework
tags: [docker, 读书笔记, Docker -- 从入门到实践]
date: 2017-03-07
---

本来只是想学一下怎么写`Dockerfile`的，结果发现这本书写地意外的好，强烈推荐一读[Docker — 从入门到实践](https://github.com/yeasy/docker_practice/)。

### 基本概念

> 对于 Linux 而言，内核启动后，会挂载 `root` 文件系统为其提供用户空间支持。而 Docker 镜像（Image），就相当于是一个 `root` 文件系统。比如官方镜像 `ubuntu:14.04` 就包含了完整的一套 Ubuntu 14.04 最小系统的 `root` 文件系统。

需要补习操作系统的知识了。

------

> 镜像构建时，会一层层构建，前一层是后一层的基础。每一层构建完就不会再发生改变，后一层上的任何改变只发生在自己这一层。比如，删除前一层文件的操作，实际不是真的删除前一层的文件，而是仅在当前层标记为该文件已删除。在最终容器运行的时候，虽然不会看到这个文件，但是实际上该文件会一直跟随镜像。因此，在构建镜像的时候，需要额外小心，每一层尽量只包含该层需要添加的东西，任何额外的东西应该在该层构建结束前清理掉。

就像堆积不一样，我有一个干净的Ubuntu系统镜像，我想在它基础上安装一些我认为常用的软件，然后形成一个新的镜像。那么这些新添加的东西就可以认为是一层。这里要注意的是在一个已经安装了很多东西的镜像上，我做一些删除操作，实际镜像的体积是不会减小的。

------

> 镜像（Image）和容器（Container）的关系，就像是面向对象程序设计中的`类`和`实例`一样，镜像是静态的定义，容器是镜像运行时的实体。容器可以被创建、启动、停止、删除、暂停等。
>
> 容器的实质是进程，但与直接在宿主执行的进程不同，容器进程运行于属于自己的独立的[命名空间](https://en.wikipedia.org/wiki/Linux_namespaces)。因此容器可以拥有自己的 `root` 文件系统、自己的网络配置、自己的进程空间，甚至自己的用户 ID 空间。容器内的进程是运行在一个隔离的环境里，使用起来，就好像是在一个独立于宿主的系统下操作一样。

可以理解为docker本身实现了一套管理容器进程的方案，这套方案使各个进程拥有了独立的命名空间，然后它再把每个进程的命名空间映射到宿主的进程中。（待验证）

<!--break-->

------

> 按照 Docker 最佳实践的要求，容器不应该向其存储层内写入任何数据，容器存储层要保持无状态化。所有的文件写入操作，都应该使用 [数据卷（Volume）](https://docs.docker.com/engine/tutorials/dockervolumes/)、或者绑定宿主目录，在这些位置的读写会跳过容器存储层，直接对宿主(或网络存储)发生读写，其性能和稳定性更高。

因为启动容器相当于启动了一个进程嘛，进程结束后它所有相关的都会被销毁掉的。

------

> 最常使用的 Registry 公开服务是官方的 [Docker Hub](https://hub.docker.com/)，这也是默认的 Registry，并拥有大量的高质量的官方镜像。除此以外，还有 [CoreOS](https://coreos.com/) 的 [Quay.io](https://quay.io/repository/)，CoreOS 相关的镜像存储在这里；Google 的 [Google Container Registry](https://cloud.google.com/container-registry/)，[Kubernetes](http://kubernetes.io/) 的镜像使用的就是这个服务。
>
> 由于某些原因，在国内访问这些服务可能会比较慢。国内的一些云服务商提供了针对 Docker Hub 的镜像服务（Registry Mirror），这些镜像服务被称为**加速器**。常见的有 [阿里云加速器](https://cr.console.aliyun.com/#/accelerator)、[DaoCloud 加速器](https://www.daocloud.io/mirror#accelerator-doc)、[灵雀云加速器](http://docs.alauda.cn/feature/accelerator.html)等。使用加速器会直接从国内的地址下载 Docker Hub 的镜像，比直接从官方网站下载速度会提高很多。在后面的章节中会有进一步如何配置加速器的讲解。
>
> 国内也有一些云服务商提供类似于 Docker Hub 的公开服务。比如 [时速云镜像仓库](https://hub.tenxcloud.com/)、[网易云镜像服务](https://c.163.com/hub#/m/library/)、[DaoCloud 镜像市场](https://hub.daocloud.io/)、[阿里云镜像库](https://cr.console.aliyun.com/)等。

就和Python的`pip install`可以添加`-i`指定拿package的服务器地址一样，docker也有同样的实现。

### 使用镜像

> 另外一个需要注意的问题是，`docker images` 列表中的镜像体积总和并非是所有镜像实际硬盘消耗。由于 Docker 镜像是多层存储结构，并且可以继承、复用，因此不同镜像可能会因为使用相同的基础镜像，从而拥有共同的层。由于 Docker 使用 Union FS，相同的层只需要保存一份即可，因此实际镜像硬盘占用空间很可能要比这个列表镜像大小的总和要小的多。

分层的主要作用就是复用，节省空间是复用带来的好处之一。

------

> 由于新旧镜像同名，旧镜像名称被取消，从而出现仓库名、标签均为 `<none>` 的镜像。这类无标签镜像也被称为 **虚悬镜像(dangling image)** ，可以用下面的命令专门显示这类镜像：
>
> ```
> $ docker images -f dangling=true
> REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
> <none>              <none>              00285df0df87        5 days ago          342 MB
> ```
>
> 一般来说，虚悬镜像已经失去了存在的价值，是可以随意删除的，可以用下面的命令删除。
>
> ```
> $ docker rmi $(docker images -q -f dangling=true)
> ```

------

> 如果你以 `scratch` 为基础镜像的话，意味着你不以任何镜像为基础，接下来所写的指令将作为镜像第一层开始存在。
>
> 不以任何系统为基础，直接将可执行文件复制进镜像的做法并不罕见，比如 [`swarm`](https://hub.docker.com/_/swarm/)、[`coreos/etcd`](https://quay.io/repository/coreos/etcd)。对于 Linux 下静态编译的程序来说，并不需要有操作系统提供运行时支持，所需的一切库都已经在可执行文件里了，因此直接 `FROM scratch` 会让镜像体积更加小巧。使用 [Go 语言](https://golang.org/) 开发的应用很多会使用这种方式来制作镜像，这也是为什么有人认为 Go 是特别适合容器微服务架构的语言的原因之一。

谁让docker就是Go写的呢。

------

> Dockerfile 是一个文本文件，其内包含了一条条的**指令(Instruction)**，每一条指令构建一层，因此每一条指令的内容，就是描述该层应当如何构建。

由于每一条指令为一层，所以尽量把相近的命令放在一条指令里面来构成一层，而不是写很多层指令（虽然很多层build出来的image大小没变，但是build花的时间更多了，且总层数是有上限的）。

------

> 很多人初学 Docker 制作出了很臃肿的镜像的原因之一，就是忘记了每一层构建的最后一定要清理掉无关文件。

制作出一个足够小巧的docker image也是一门学问啊。

------

> Docker 在运行时分为 Docker 引擎（也就是服务端守护进程）和客户端工具。Docker 的引擎提供了一组 REST API，被称为 [Docker Remote API](https://docs.docker.com/engine/reference/api/docker_remote_api/)，而如 `docker` 命令这样的客户端工具，则是通过这组 API 与 Docker 引擎交互，从而完成各种功能。因此，虽然表面上我们好像是在本机执行各种 `docker` 功能，但实际上，一切都是使用的远程调用形式在服务端（Docker 引擎）完成。也因为这种 C/S 设计，让我们操作远程服务器的 Docker 引擎变得轻而易举。
>
> 当我们进行镜像构建的时候，并非所有定制都会通过 `RUN` 指令完成，经常会需要将一些本地文件复制进镜像，比如通过 `COPY` 指令、`ADD` 指令等。而 `docker build` 命令构建镜像，其实并非在本地构建，而是在服务端，也就是 Docker 引擎中构建的。那么在这种客户端/服务端的架构中，如何才能让服务端获得本地文件呢？
>
> 这就引入了上下文的概念。当构建的时候，用户会指定构建镜像上下文的路径，`docker build` 命令得知这个路径后，会将路径下的所有内容打包，然后上传给 Docker 引擎。这样 Docker 引擎收到这个上下文包后，展开就会获得构建镜像所需的一切文件。
>
> 如果在 `Dockerfile` 中这么写：
>
> ```dockerfile
> COPY ./package.json /app/
> ```
>
> 这并不是要复制执行 `docker build` 命令所在的目录下的 `package.json`，也不是复制 `Dockerfile` 所在目录下的 `package.json`，而是复制 **上下文（context）** 目录下的 `package.json`。

所以说理论上我在本地只要运行一个docker client就可以了啊，然后连接到远端的一个docker server来进行image的build工作。（暂时还不是很理解这种设计的目的，不过各种微服务框架让Restful的server很流行了倒是，可能docker也是考虑了微服务吧。）

然后上下文的概念也很重要，一般`Dockerfile`中的上下文路径就是`Dockerfile`文件所在的路径，但必须知道这个路径不一定要是`Dockerfile`的路径，而是在执行`docker build`命令时传递进去的。

------

> 一般来说，应该会将 `Dockerfile` 置于一个空目录下，或者项目根目录下。如果该目录下没有所需文件，那么应该把所需文件复制一份过来。如果目录下有些东西确实不希望构建时传给 Docker 引擎，那么可以用 `.gitignore` 一样的语法写一个 `.dockerignore`，该文件是用于剔除不需要作为上下文传递给 Docker 引擎的。

记住上下文所在的整个文件夹（包括子文件夹）是会被打包上传到docker server的。

------

> 在 Docker 官方的最佳实践文档中要求，尽可能的使用 `COPY`，因为 `COPY` 的语义很明确，就是复制文件而已，而 `ADD` 则包含了更复杂的功能，其行为也不一定很清晰。最适合使用 `ADD` 的场合，就是所提及的需要自动解压缩的场合。
>
> 另外需要注意的是，`ADD` 指令会令镜像构建缓存失效，从而可能会令镜像构建变得比较缓慢。
>
> 因此在 `COPY` 和 `ADD` 指令中选择的时候，可以遵循这样的原则，所有的文件复制均使用 `COPY` 指令，仅在需要自动解压缩的场合使用 `ADD`。

“所有的文件复制均使用 `COPY` 指令，仅在需要自动解压缩的场合使用 `ADD`。”

------

> Docker 不是虚拟机，容器中的应用都应该以前台执行，而不是像虚拟机、物理机里面那样，用 upstart/systemd 去启动后台服务，容器内没有后台服务的概念。
>
> 一些初学者将 `CMD` 写为：
>
> ```dockerfile
> CMD service nginx start
> ```
>
> 然后发现容器执行后就立即退出了。甚至在容器内去使用 `systemctl` 命令结果却发现根本执行不了。这就是因为没有搞明白前台、后台的概念，没有区分容器和虚拟机的差异，依旧在以传统虚拟机的角度去理解容器。
>
> 对于容器而言，其启动程序就是容器应用进程，容器就是为了主进程而存在的，主进程退出，容器就失去了存在的意义，从而退出，其它辅助进程不是它需要关心的东西。

docker容器的生命周期就和一个普通进程类似，你需要一个守护进程，那么首先要保证它所依赖的docker容器进程不被销毁。最简单的做法是容器内的进程直接在前台运行，而把docker容器的进程放到后台运行（有点像`screen`命令）。

---

> 构建参数和 `ENV` 的效果一样，都是设置环境变量。所不同的是，`ARG` 所设置的构建环境的环境变量，在将来容器运行时是不会存在这些环境变量的。但是不要因此就使用 `ARG` 保存密码之类的信息，因为 `docker history` 还是可以看到所有值的。

换句话说，`ARG`就是单纯地用于设置build docker image时所用到的变量，从而一个`Dockerfile`可以根据参数不同而得到不同的image。

---

> 之前提到一些初学者常犯的错误是把 `Dockerfile` 等同于 Shell 脚本来书写，这种错误的理解还可能会导致出现下面这样的错误：
>
> ```dockerfile
> RUN cd /app
> RUN echo "hello" > world.txt
> ```
>
> 如果将这个 Dockerfile 进行构建镜像运行后，会发现找不到 `/app/world.txt` 文件，或者其内容不是 `hello`。

解决方法一是把两个命令写到同一层中，即：

```dockerfile
RUN cd /app \
    && echo "hello" > world.txt
```

或者使用`WORKDIR`指令把指定路径变成默认的路径：

```dockerfile
WORKDIR /app
RUN echo "hello" > world.txt
```

---

> 因此当我们使用上面命令删除镜像的时候，实际上是在要求删除某个标签的镜像。所以首先需要做的是将满足我们要求的所有镜像标签都取消，这就是我们看到的 `Untagged` 的信息。因为一个镜像可以对应多个标签，因此当我们删除了所指定的标签后，可能还有别的标签指向了这个镜像，如果是这种情况，那么 `Delete` 行为就不会发生。所以并非所有的 `docker rmi` 都会产生删除镜像的行为，有可能仅仅是取消了某个标签而已。
>
> 当该镜像所有的标签都被取消了，该镜像很可能会失去了存在的意义，因此会触发删除行为。

类似垃圾回收机制里面的引用指针，只有当一个内存地址的引用为0时才会被回收。

---

> 在 Ubuntu/Debian 上有 `UnionFS` 可以使用，如 `aufs` 或者 `overlay2`，而 CentOS 和 RHEL 的内核中没有相关驱动。因此对于这类系统，一般使用 `devicemapper` 驱动利用 LVM 的一些机制来模拟分层存储。这样的做法除了性能比较差外，稳定性一般也不好，而且配置相对复杂。Docker 安装在 CentOS/RHEL 上后，会默认选择 `devicemapper`，但是为了简化配置，其 `devicemapper` 是跑在一个稀疏文件模拟的块设备上，也被称为 `loop-lvm`。这样的选择是因为不需要额外配置就可以运行 Docker，这是自动配置唯一能做到的事情。但是 `loop-lvm` 的做法非常不好，其稳定性、性能更差，无论是日志还是 `docker info` 中都会看到警告信息。官方文档有明确的文章讲解了如何配置块设备给 `devicemapper` 驱动做存储层的做法，这类做法也被称为配置 `direct-lvm`。

看来Docker在各平台的支持并不是一样好的，怪不得大多数都是用Ubuntu/Debian系统。

`UnionFS`的作用主要是可以把不同路径下的文件展示成同一个路径下的文件，docker类似地可以把许多层的叠加的结果展现出来。

---

### 操作容器

> 简单的说，容器是独立运行的一个或一组应用，以及它们的运行态环境。对应的，虚拟机可以理解为模拟运行的一整套操作系统（提供了运行态环境和其他系统环境）和跑在上面的应用。

它们的scope不同。

---

> 下面的命令则启动一个 bash 终端，允许用户进行交互。
>
> ```sh
> $ sudo docker run -t -i ubuntu:14.04 /bin/bash
> root@af8bae53bdd3:/#
> ```
>
> 其中，`-t` 选项让Docker分配一个伪终端（pseudo-tty）并绑定到容器的标准输入上， `-i` 则让容器的标准输入保持打开。

也可以连起来输入`-it`。伪终端的意思是表现得像终端一样，却是通过各种操作模拟成这样的，伪终端另一个例子是ssh。

**注意**容器执行结束后是不会自动删除的（不删除的好处在于下次再启动时就省了一些操作，可以更快），除非启动时添加了`--rm`参数。

---

> 当利用 `docker run` 来创建容器时，Docker 在后台运行的标准操作包括：
>
> - 检查本地是否存在指定的镜像，不存在就从公有仓库下载
> - 利用镜像创建并启动一个容器
> - 分配一个文件系统，并在只读的镜像层外面挂载一层可读写层
> - 从宿主主机配置的网桥接口中桥接一个虚拟接口到容器中去
> - 从地址池配置一个 ip 地址给容器
> - 执行用户指定的应用程序
> - 执行完毕后容器被终止

---

> 更多的时候，需要让 Docker在后台运行而不是直接把执行命令的结果输出在当前宿主机下。此时，可以通过添加 `-d` 参数来实现。

这就是之前说的实现守护进程的方式：让docker进程在后台运行。

---

> 使用 `-d` 参数启动后会返回一个唯一的 id，也可以通过 `docker ps` 命令来查看容器信息。
>
> ```
> $ sudo docker ps
> CONTAINER ID  IMAGE         COMMAND               CREATED        STATUS       PORTS NAMES
> 77b2dc01fe0f  ubuntu:14.04  /bin/sh -c 'while tr  2 minutes ago  Up 1 minute        agitated_wright
> ```
>
> 要获取容器的输出信息，可以通过 `docker logs` 命令。
>
> ```
> $ sudo docker logs [container ID or NAMES]
> ```

---

> 在使用 `-d` 参数时，容器启动后会进入后台。 某些时候需要进入容器进行操作，有很多种方法，包括使用 `docker attach` 命令或 `nsenter` 工具等。

> 但是使用 `attach` 命令有时候并不方便。当多个窗口同时 attach 到同一个容器的时候，所有窗口都会同步显示。当某个窗口因命令阻塞时,其他窗口也无法执行操作了。

这里的`attach`和`screen`命令的`attach`作用类似。

---

> `nsenter` 工具在 util-linux 包2.23版本后包含。 如果系统中 util-linux 包没有该命令，可以按照下面的方法从源码安装。
>
> ```
> $ cd /tmp; curl https://www.kernel.org/pub/linux/utils/util-linux/v2.24/util-linux-2.24.tar.gz | tar -zxf-; cd util-linux-2.24;
> $ ./configure --without-ncurses
> $ make nsenter && sudo cp nsenter /usr/local/bin
> ```

> `nsenter` 启动一个新的shell进程(默认是/bin/bash), 同时会把这个新进程切换到和目标(target)进程相同的命名空间，这样就相当于进入了容器内部。nsenter 要正常工作需要有 root 权限。

> 为了连接到容器，你还需要找到容器的第一个进程的 PID，可以通过下面的命令获取。
>
> ```
> PID=$(docker inspect --format "{{ .State.Pid }}" <container>)
> ```
>
> 通过这个 PID，就可以连接到这个容器：
>
> ```
> $ nsenter --target $PID --mount --uts --ipc --net --pid
> ```

简单的说，当你想进入到正在运行的docker容器中做一些操作时，`attach`命令可能就满足不了你了（因为容器正在运行，进去也是blocking的状态），而`nsenter`可以满足这个需求，但是可能需要安装。

---

> 更简单的，建议大家下载 [.bashrc_docker](https://github.com/yeasy/docker_practice/raw/master/_local/.bashrc_docker)，并将内容放到 .bashrc 中。
>
> ```
> $ wget -P ~ https://github.com/yeasy/docker_practice/raw/master/_local/.bashrc_docker;
> $ echo "[ -f ~/.bashrc_docker ] && . ~/.bashrc_docker" >> ~/.bashrc; source ~/.bashrc
> ```
>
> 这个文件中定义了很多方便使用 Docker 的命令，例如 `docker-pid` 可以获取某个容器的 PID；而 `docker-enter` 可以进入容器或直接在容器内执行命令。

主要提供了三个命令`docker-pid`、`docker-ip`和`docker-enter`，其中`docker-enter`就是用`nsenter`来实现的。有了这三个命令可以让docker容器操作简化不少。

---

> 用户既可以使用 `docker load` 来导入镜像存储文件到本地镜像库，也可以使用 `docker import` 来导入一个容器快照到本地镜像库。这两者的区别在于容器快照文件将丢弃所有的历史记录和元数据信息（即仅保存容器当时的快照状态），而镜像存储文件将保存完整记录，体积也要大。此外，从容器快照文件导入时可以重新指定标签等元数据信息。

所以说使用`docker export`导出容器快照时是保存了元数据的？

---

### 访问仓库

> 自动创建（Automated Builds）功能对于需要经常升级镜像内程序来说，十分方便。 有时候，用户创建了镜像，安装了某个软件，如果软件发布新版本则需要手动更新镜像。
>
> 而自动创建允许用户通过 Docker Hub 指定跟踪一个目标网站（目前支持 [GitHub](https://github.org/) 或 [BitBucket](https://bitbucket.org/)）上的项目，一旦项目发生新的提交，则自动执行创建。

持续集成。

---

### 数据管理

> 数据卷是一个可供一个或多个容器使用的特殊目录，它绕过 UFS，可以提供很多有用的特性：
>
> - 数据卷可以在容器之间共享和重用
> - 对数据卷的修改会立马生效
> - 对数据卷的更新，不会影响镜像
> - 数据卷默认会一直存在，即使容器被删除
>
> *注意：数据卷的使用，类似于 Linux 下对目录或文件进行 mount，镜像中的被指定为挂载点的目录中的文件会隐藏掉，能显示看的是挂载的数据卷。

可以理解为数据卷是容器内挂载的宿主的部分硬盘空间。

---

> 如果你有一些持续更新的数据需要在容器之间共享，最好创建数据卷容器。
>
> 数据卷容器，其实就是一个正常的容器，专门用来提供数据卷供其它容器挂载的。
>
> 首先，创建一个名为 dbdata 的数据卷容器：
>
> ```
> $ sudo docker run -d -v /dbdata --name dbdata training/postgres echo Data-only container for postgres
>
> ```
>
> 然后，在其他容器中使用 `--volumes-from` 来挂载 dbdata 容器中的数据卷。
>
> ```
> $ sudo docker run -d --volumes-from dbdata --name db1 training/postgres
> $ sudo docker run -d --volumes-from dbdata --name db2 training/postgres
> ```

数据卷容器本身啥事都不做，只是提供数据卷挂载服务，考虑到很多容器用同一块数据卷的情况，使用数据卷容器要比直接对每个容器进行挂载要方便管理？（还有其他好处么？）

---

### 使用网络

> 容器中可以运行一些网络应用，要让外部也可以访问这些应用，可以通过 `-P` 或 `-p` 参数来指定端口映射。
>
> 当使用 -P 标记时，Docker 会随机映射一个 `49000~49900` 的端口到内部容器开放的网络端口。

> -p（小写的）则可以指定要映射的端口，并且，在一个指定端口上只可以绑定一个容器。支持的格式有 `ip:hostPort:containerPort | ip::containerPort | hostPort:containerPort`。

---

> Docker 在两个互联的容器之间创建了一个安全隧道，而且不用映射它们的端口到宿主主机上。在启动 db 容器的时候并没有使用 `-p` 和 `-P` 标记，从而避免了暴露数据库端口到外部网络上。
>
> Docker 通过 2 种方式为容器公开连接信息：
>
> - 环境变量
> - 更新 `/etc/hosts` 文件

Docker容器之间的通信就好比传统架构中的内部网络的通信，从公网是无法访问这些机器的，现在是通过宿主网络是没法访问仅仅做容器间通信的容器的。

而对于容器内的程序而言，它对其他容器的通信就和不使用容器一样（比如通过`172.17.0.5:5432`端口连接到一个数据库），docker在连接容器时会去映射这些地址到彼此的容器之中。