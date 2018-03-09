---
layout: post
title: "HTTP Load Balancing and Sticky Sessions With and Apache server"
category: Other
tags: [Apache]
date: 2018-02-24
---

From the [https://httpd.apache.org/docs/2.4/mod/mod_proxy.html](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html):

> If the first argument ends with a trailing **/**, the second argument should also end with a trailing **/**, and vice versa. Otherwise, the resulting requests to the backend may miss some needed slashes and do not deliver the expected results.

For example:

```
ProxyPass "/" "http://backend.example.com/"
```

Don't miss the trailing slash!



---

