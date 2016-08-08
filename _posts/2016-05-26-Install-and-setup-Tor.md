---
layout: post
title: "Install and setup Tor"
category: Other
tags: [guide]
date: 2016-05-26
---

[Tor]([https://www.torproject.org/](https://www.torproject.org/)) is a command line tool to use its proxy service.

To install `tor` on OSX:

```shell
brew install tor
```

Then just type 'tor' to start the proxy service:

```
➜  data-collector git:(master) ✗ tor
May 26 14:12:25.869 [notice] Tor v0.2.7.6 running on Darwin with Libevent 2.0.22-stable, OpenSSL 1.0.2g and Zlib 1.2.5.
May 26 14:12:25.869 [notice] Tor can't help you if you use it wrong! Learn how to be safe at https://www.torproject.org/download/download#warning
May 26 14:12:25.869 [notice] Configuration file "/usr/local/etc/tor/torrc" not present, using reasonable defaults.
May 26 14:12:25.871 [notice] Opening Socks listener on 127.0.0.1:9050
May 26 14:12:25.000 [notice] Parsing GEOIP IPv4 file /usr/local/Cellar/tor/0.2.7.6/share/tor/geoip.
May 26 14:12:25.000 [notice] Parsing GEOIP IPv6 file /usr/local/Cellar/tor/0.2.7.6/share/tor/geoip6.
May 26 14:12:26.000 [notice] Bootstrapped 0%: Starting
May 26 14:12:26.000 [notice] Bootstrapped 5%: Connecting to directory server
May 26 14:12:26.000 [notice] Bootstrapped 80%: Connecting to the Tor network
May 26 14:12:26.000 [notice] Bootstrapped 85%: Finishing handshake with first hop
May 26 14:12:29.000 [notice] Bootstrapped 90%: Establishing a Tor circuit
May 26 14:12:30.000 [notice] Tor has successfully opened a circuit. Looks like client functionality is working.
May 26 14:12:30.000 [notice] Bootstrapped 100%: Done
```

The default socks proxy address is `127.0.0.1:9050`

So you can use the proxy sock now. To stop the server, just press `control-c`.

<!--break-->

------

Sometimes you may want to change the proxy ip address without restart `tor`.

1. Generate a hashed password (assume we may want to set the password to ‘changed'):

   ```shell
   ➜  data-collector git:(master) ✗ tor --hash-password changed
   16:746D3691E5FC38D860917F1718B60F80EB529B8B9D404550660697EF2D
   ```

2. Configure the tor by editing `/usr/local/etc/tor/torrc` (you should find a file named ‘torrc.sample’ under that folder).
   The content of `torrc` should be like:

   ```
   ControlPort 9051
   HashedControlPassword 16:746D3691E5FC38D860917F1718B60F80EB529B8B9D404550660697EF2D
   ```

3. Then in terminal, type the following command, then tor will use a new network route.

   ```shell
   (echo authenticate '"changed"'; echo signal newnym; echo quit) | nc localhost 9051
   ```


------

Sometimes you may want to use several different socks proxies at the same time. There’s no need to run several Tor processes separately. (refer:  [http://stackoverflow.com/questions/14321214/how-to-run-multiple-tor-processes-at-once-with-different-exit-ips](http://stackoverflow.com/questions/14321214/how-to-run-multiple-tor-processes-at-once-with-different-exit-ips))

1. Edit the  `/usr/local/etc/tor/torrc` to add more SocksPort like below:

   ```
   SocksPort 9050
   SocksPort 9052
   SocksPort 9053
   SocksPort 9054
   ```

2. Start `Tor` process.