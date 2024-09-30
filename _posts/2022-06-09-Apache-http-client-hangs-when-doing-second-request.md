---
layout: post
title: "Apache http client hangs when doing second request"
category: Scala
tags: [坑]
date: 2022-06-09
---

# Issue

在Flink job用Apache Http client写了一个发post请求到某个api的sink，上线后发现前几个请求总是能成功的，之后就hang在那里了。

# Troubleshooting

1. 尝试给请求添加了一个timeout，结果就是前几个请求成功之后，后面的所有请求都触发`ConnectTimeoutException`。
2. 检查了api的服务器日志，发现除了前几个请求有记录外，之后的请求都没有对应的log。
3. 再手动设置了connection pool:

   ```scala
   val connManager: PoolingHttpClientConnectionManager = new PoolingHttpClientConnectionManager
   connManager.setMaxTotal(1)
   connManager.setDefaultMaxPerRoute(1)
   val httpClient = HttpClients.custom().setConnectionManager(connManager).build()
   ```

   当都设为1时，只有一个请求能成功。当都设为10时，只有前10个请求能成功。


# Solution

以上基本确定是connection被占用了，导致一直在等待空闲的connection，以至于timeout了。server端也没有收到后续的请求。  
根本原因是Apache Http client需要手动释放connection资源！

```scala
val httpPost = new HttpPost(url)
httpPost.setEntity(new StringEntity(payload))
httpPost.setHeader("Accept", "application/json")
httpPost.setHeader("Content-type", "application/json")
val requestConfig = RequestConfig.custom()
    .setConnectTimeout(timeout * 1000)
    .setConnectionRequestTimeout(timeout * 1000)
    .setSocketTimeout(timeout * 1000).build()
httpPost.setConfig(requestConfig)
var response: CloseableHttpResponse = null
try {
    response = httpClient.execute(httpPost)
} catch {
    case e: ConnectTimeoutException => logger.error("Request timeout")
    case e: IOException => logger.error("IO exception")
    case _: Throwable => logger.error("Got some other kind of Throwable exception")
} finally {
    httpPost.releaseConnection()  // This line is important!!!
}
if (response != null) {
    logger.info("Response: " + response.toString)
}
```