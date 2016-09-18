---
layout: post
title: "Get 'broken pipe' error when running Flask server"
category: Python
tags: [Flask]
date: 2016-09-02
---

### Problem

如题。

### Reason

这个问题的原因是Flask自带的event loop的是单线程处理请求的，有多个请求同时发生时，而多个请求之间有相互依赖的关系（可以参见stackoverflow中[这个问题](http://stackoverflow.com/questions/12591760/flask-broken-pipe-with-requests)的例子），产生了死锁，就产生了这个error。

### Solution

使用可以更好地处理并发请求的HTTP server来运行Flask写好的web server程序（当然这个HTTP server要支持Python的`WSGI`协议）。

可选的HTTP server库有：

- [gunicorn](http://gunicorn.org/)
- [uWSGI](http://uwsgi-docs.readthedocs.io/en/latest/)（通过[Nginx](https://www.nginx.com/)可以搭建分布式的server）
- [gevent](http://www.gevent.org/)（使用协程，提高了处理请求的能力）
- [twisted](http://twistedmatrix.com/trac/wiki/TwistedWeb)（强大的异步处理库，使用多进程/线程处理请求）

### Conclusion

Flask本身就是设计为开发web server的app的库，而不是web server本身。所以在开发web server时可以用Flask自带的HTTP server来生成server，而在放入生产环境中时必须要考虑使用其他HTTP server来提供更强劲的web service。