---
layout: post
title: "关于JavaScript中的跨域请求"
category: Web
tags: [Concept]
date: 2017-03-01
---

在接触JavaScript之前我是不知道跨域请求的概念的，原因是后端的http请求并没有类似的限制。所谓跨域请求是指一个http请求，它的请求方与被请求方的域名不同（注意这里的域名是包括端口的，即http://localhost:5000和http://localhost:4000是不同的）。那么为什么在JavaScript中需要对跨域的请求添加限制呢？以及怎样才能在JavaScript中实现跨域的请求呢？

### 跨域请求的限制

默认情况下，在JavaScript中是做跨域的请求是会以失败而告终的，这并不是JavaScript语言本身的限制（比如用Node.js完全可以做一个跨域请求），而是浏览器方面施加的限制。浏览器从安全方面考虑（这个安全更多的是指服务器端的安全，比如如果没有跨域请求的限制的话，攻击者可以将获取某个资源的脚本恶意插入到各大网站上，所有登陆网站的人的电脑都会自动执行该脚本，从而可以实现DDOS攻击），禁掉了跨域请求的功能，即所有在浏览器中运行的JavaScript代码中的http请求都会经过浏览器的检查，如果请求的目的地的域名与此时执行JavaScript代码的域名不一致则会抛出一个异常。

### 在JavaScript中实现跨域请求

虽然跨域请求是有风险的，但不排除有一些网络服务做了很好的准备，能承担跨域请求的风险，这些网络服务就可以告诉浏览器，访问它们就不需要再检查请求是否跨域了。为此，W3C设定了一组标准，可以让服务器端支持跨域请求，称之为[Cross-Origin Resource Sharing](http://www.w3.org/TR/cors/)，简称CORS。在实际操作中，网络服务通过一组协定好的http header来告诉浏览器它们支持跨域请求：

- Access-Control-Allow-Origin
- Access-Control-Allow-Credentials
- Access-Control-Expose-Headers
- Access-Control-Max-Age
- Access-Control-Allow-Methods
- Access-Control-Allow-Headers

以上，只要服务器端响应带有带有以上http header的第一个（即`Access-Control-Allow-Origin`是必须的，其他都是可选项），就表示它支持跨域请求，该http header的含义是服务端允许发起请求的域名，可以指定一个域名，只有该域名下的跨域请求能进行跨域访问，比如：

```
Access-Control-Allow-Origin: http://api.bob.com
```

当然，更多情况下，你可能是希望任何域名都能请求的：

```
Access-Control-Allow-Origin: *
```

其他相关的http header都用来做一些额外的其他限制，比如说`Access-Control-Allow-Methods`可以限定跨域请求的方法只能是POST等。

而客户端的请求也可以对它自己的跨域请求作一些限制，也是通过在请求中添加http header的方式，以下http header和跨域请求的请求有关：

- Origin
- Access-Control-Request-Method
- Access-Control-Request-Headers

<!--break-->

### 实践一下

这里就用我比较熟悉的方式来实验一下上述方案的可行性。

在server端，用Python的Flask搭建一个简单的网络服务，它提供两个资源，其中一个支持CORS：

```python
from flask import Flask, Response

app = Flask(__name__)


@app.route("/normal_resource")
def normal_resource():
    return "Hello World!"


@app.route("/cors_resource")
def cors_resource():
    resp = Response("Foo bar baz")
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


if __name__ == "__main__":
    app.run()
```

在client端，我们随意打开一个http开头的页面（如果是https的页面会有其他问题），并在浏览器开发用的Console里面输入以下JavaScript代码：

```javascript
function httpGet(theUrl){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
httpGet('http://localhost:5000/normal_resource')
httpGet('http://localhost:5000/cors_resource')
```

可以发现成功获取了http://localhost:5000/cors_resource的资源，而http://localhost:5000/normal_resource则获取失败了，浏览器抛出了一个类似`XMLHttpRequest cannot load http://localhost:5000/normal_resource. No 'Access-Control-Allow-Origin' header is present on the requested resource.`的异常。