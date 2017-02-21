---
layout: post
title: "An error occurs in for-loops in a shell script"
category: Shell
tags: [坑]
date: 2017-02-13
---

### 问题

想要写一个shell script实现如下功能：

给定一个ip的list和对应的hostname，对每个ip的机器设置静态hostname并重启。并可以远程调用`hostname`命令来显示所有机器的hostname是否已设置成功。

脚本最初的版本是这样的：

```shell
#!/bin/sh
# Get the absolute directory path of this file
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
while read line
do
	array=()
	for word in $line
	do
		array+=($word)
	done

	echo "Setting the hostname of ${array[0]} to ${array[1]}"
	sshpass -p sp1unk ssh -o StrictHostKeyChecking=no root@${array[0]} "hostnamectl set-hostname ${array[1]} --static && reboot"
	echo "====================================================================="
	done <$DIR/host_mapping.txt
```

所有的ip和hostname信息存在同目录下的host_mapping.txt文件中，每一行为一个条目，ip和hostname以空格间隔。

结果运行下来，设置完第一个ip的hostname程序就结束了。

### 分析原因

- 猜想1：因为`reboot`命令导致ssh链接终端从而使进程直接结束。那么我们去掉`reboot`试一下，发现仍然是只执行了一个条目就退出了。

- 猜想2：sshpass这条命令抛出了异常导致程序结束。但实验下来，shell脚本出现异常好像并不影响后面的语句执行，比如下面的脚本：

  ```shell
  #!/bin/sh
  UnkonwnCommand
  echo "Executed here"
  ```

  输出为：

  ```
  ./test.sh: line 2: UnkonwnCommand: command not found
  Executed here
  ```

- 猜想3：跟sshpass或ssh这条命令相关，

  http://stackoverflow.com/questions/9393038/ssh-breaks-out-of-while-loop-in-bash。也就是说**ssh命令默认会读取后续的所有内容作为它的输入**，解决方法是把它的输入连到别的地方去。

### 解决问题

可远程配置hostname的最终脚本如下：

```shell
#!/bin/sh
# Get the absolute directory path of this file
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
while read line
do
	array=()
	for word in $line
	do
		array+=($word)
	done

	echo "Setting the hostname of ${array[0]} to ${array[1]}"
	sshpass -p sp1unk ssh -o StrictHostKeyChecking=no root@${array[0]} "hostnamectl set-hostname ${array[1]} --static && reboot" < /dev/null
	echo "====================================================================="
	done <$DIR/host_mapping.txt
```

