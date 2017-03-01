---
layout: post
title: "关于ssh connection time out"
category: Web
tags: [ssh, paramiko, 心得]
date: 2015-10-14
---

先直接说结论：**client端和server端都能设置time out的相关设置，具体最后断开取决于谁要看哪边设置的时间更短。**比如说client端设置的time out时间大于server端所设置的话，那就由server端说了算，即最后主动断开连接的是server端；如果client端设置的时间较短，那主动断开连接的就是client端了。

### server端设置

（linux平台）server端的关于ssh的设置文件为`/etc/ssh/sshd_config`，其中主要影响time out设置的是如下三个参数（参数下面是对参数的官方说明）：

> **TCPKeepAlive**
>          Specifies whether the system should send TCP keepalive messages to the other side.  If they are sent, death of the connection or crash of one of the machines will be properly noticed.  However, this means that connections will die if the route is down temporarily, and some people find it annoying.  On the other hand, if TCP keepalives are not sent, sessions may hang indefinitely on the server, leaving “ghost” users and consuming server resources.
>
>          The default is “yes” (to send TCP keepalive messages), and the server will notice if the network goes down or the client host crashes.  This avoids infinitely hanging sessions.
>
>          To disable TCP keepalive messages, the value should be set to “no”.`
>
>          This option was formerly called KeepAlive.
>
> **ClientAliveCountMax**
>
>          Sets the number of client alive messages (see below) which may be sent without sshd(8) receiving any messages back from the client.  If this threshold is reached while client alive messages are being sent, sshd will disconnect the client, terminating the session.  It is important to note that the use of client alive messages is very different from TCPKeepAlive (below).  The client alive messages are sent through the encrypted channel and therefore will not be spoofable.  The TCP keepalive option enabled by TCPKeepAlive is spoofable.  The client alive mechanism is valueable when the client or server depend on knowing when a connection has become inactive.
>
>           The default value is 3.  If ClientAliveInterval (see below) is set to 15, and ClientAliveCountMax is left at the default, unresponsive SSH clients will be disconnected after approximately 45 seconds.  This option applies to protocol version 2 only.
>
> **ClientAliveInterval**
>
>          Sets a timeout interval in seconds after which if no data has been received from the client, sshd(8) will send a message through the encrypted channel to request a response from the client.  The default is 0, indicating that these messages will not be sent to the client.  This option applies to protocol version 2 only.

从官方的解释来看，默认设置下server端是不会主动断开连接的（`ClientAliveInterval`为0）。

如果改为如下：

```
ClientAliveInterval 600
ClientAliveCountMax 3
```

则连续30min没有通信后（准确地说是server每个10分钟发送一条消息，连续3次发送消息都没有回应）会timeout（600s * 3）。

### client端设置

在client端也是能设置的，这里只研究了python的`paramiko`库的设置方法，就是在`SSHClient.connect()`时，设置其中的timeout参数，默认`timeout=None`其实是3600s，即一个小时。

### 在不修改server端设置的情况下，如何保证ssh connection不会timeout？

一个可以想到的方法是每隔一段时间发送一条消息到server端，告诉server自己还活着。

- 对应于paramiko，可以如下设置：

  ```python
  transport = SSHClient.get_transport()
  transport.set_keepalive(30) # send message every 30 seconds
  ```

- 对应于linux平台下的ssh connection，可以在`/etc/ssh/ssh_config`中设置`ServerAliveInterval`变量（默认为0应该就是不会发送消息，设置后每隔指定的时间(s)会发送一条消息到server端）。

