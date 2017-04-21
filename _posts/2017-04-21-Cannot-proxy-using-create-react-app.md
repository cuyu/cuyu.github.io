---
layout: post
title: "Cannot proxy using create-react-app"
category: Web
tags: [tool, 坑]
date: 2017-04-21
---

在研究[打造可与后端无缝衔接的前端开发环境](/javascript/2017/04/21/打造可与后端无缝衔接的前端开发环境)时，发现在`package.json`中设置了`proxy`字段，却仍然无法再浏览器中访问被代理的那部分资源。并且尝试了使用不同的http server作为被代理服务器，都没有用。

那么问题可能就出在我的前端代码中，或者就是[create-react-app](https://github.com/facebookincubator/create-react-app)的bug。因为我的代码中用到了`react-router`这个库，一开始我以为是这个lib有问题，但google了下，并没有人提出类似的内容，并且我使用了另外的很简单的前端代码也同样无法得到被代理内容，情况被排除。至于[create-react-app](https://github.com/facebookincubator/create-react-app)的bug的情况，在它的github的issue里面也没有发现类似的情况，并且对比了我本地安装的lib和最新的code，也没有变化，这种可能性也被排除。

这下我就有点懵逼了，就一个简单的代理还能出多复杂的幺蛾子？

<!--break-->

干脆直接研究下它的实现：

```javascript
function addMiddleware(devServer) {
  // `proxy` lets you to specify a fallback server during development.
  // Every unrecognized request will be forwarded to it.
  var proxy = require(paths.appPackageJson).proxy;
  devServer.use(historyApiFallback({
    // Paths with dots should still use the history fallback.
    // See https://github.com/facebookincubator/create-react-app/issues/387.
    disableDotRule: true,
    // For single page apps, we generally want to fallback to /index.html.
    // However we also want to respect `proxy` for API calls.
    // So if `proxy` is specified, we need to decide which fallback to use.
    // We use a heuristic: if request `accept`s text/html, we pick /index.html.
    // Modern browsers include text/html into `accept` header when navigating.
    // However API calls like `fetch()` won’t generally accept text/html.
    // If this heuristic doesn’t work well for you, don’t use `proxy`.
    htmlAcceptHeaders: proxy ?
      ['text/html'] :
      ['text/html', '*/*']
  }));
  if (proxy) {
    if (typeof proxy !== 'string') {
      console.log(chalk.red('When specified, "proxy" in package.json must be a string.'));
      console.log(chalk.red('Instead, the type of "proxy" was "' + typeof proxy + '".'));
      console.log(chalk.red('Either remove "proxy" from package.json, or make it a string.'));
      process.exit(1);
    }

    // Otherwise, if proxy is specified, we will let it handle any request.
    // There are a few exceptions which we won't send to the proxy:
    // - /index.html (served as HTML5 history API fallback)
    // - /*.hot-update.json (WebpackDevServer uses this too for hot reloading)
    // - /sockjs-node/* (WebpackDevServer uses this for hot reloading)
    // Tip: use https://jex.im/regulex/ to visualize the regex
    var mayProxy = /^(?!\/(index\.html$|.*\.hot-update\.json$|sockjs-node\/)).*$/;
    console.log()

    // Pass the scope regex both to Express and to the middleware for proxying
    // of both HTTP and WebSockets to work without false positives.
    var hpm = httpProxyMiddleware(pathname => mayProxy.test(pathname), {
      target: proxy,
      logLevel: 'silent',
      onProxyReq: function(proxyReq, req, res) {
        // Browers may send Origin headers even with same-origin
        // requests. To prevent CORS issues, we have to change
        // the Origin to match the target URL.
        if (proxyReq.getHeader('origin')) {
          proxyReq.setHeader('origin', proxy);
        }
      },
      onError: onProxyError(proxy),
      secure: false,
      changeOrigin: true,
      ws: true
    });
    devServer.use(mayProxy, hpm);

    // Listen for the websocket 'upgrade' event and upgrade the connection.
    // If this is not done, httpProxyMiddleware will not try to upgrade until
    // an initial plain HTTP request is made.
    devServer.listeningApp.on('upgrade', hpm.upgrade);
  }

  // Finally, by now we have certainly resolved the URL.
  // It may be /index.html, so let the dev server try serving it again.
  devServer.use(devServer.middleware);
}
```

[create-react-app](https://github.com/facebookincubator/create-react-app)的代理用到了[http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)，它可以输入一个string类型的变量来规定哪些路径下的请求会被proxy。在这里这个变量就是`mayProxy`，看代码就是排除了一些特殊的路径，大部分路径是可以通过代理的，问题不在这。那么问题就只有可能出在这一句了：

```javascript
  devServer.use(historyApiFallback({
    disableDotRule: true,
    htmlAcceptHeaders: proxy ?
      ['text/html'] :
      ['text/html', '*/*']
  }));
```

这里我设置了代理的话，`htmlAcceptHeaders`被设为了`['text/html']`，这意味着什么？

在[create-react-app](https://github.com/facebookincubator/create-react-app)官方文档找到了这么一句话：

> Any unrecognized request without a `text/html` accept header will be redirected to the specified `proxy`.

果然是被这东西坑了，也就是说包含`htmlAcceptHeaders`设置中的accept header的请求是不会被proxy的！因此无论我在浏览器中怎么访问，网页都是走不通的，因为网页要渲染就一定会产生有`text/html`类型header的请求的。

终于破案了！也就是说从一开始我们代理的设置并没有任何问题，只是我们打开的方式不对而已。只要不通过浏览器，这些被代理的资源都可以被正常的访问！