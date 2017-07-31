---
layout: post
title: "Client side routing VS. server side routing"
category: Web
tags: [react-router, Flask]
date: 2017-07-31
---

问题始于一个项目中将前端和后端整合时发现的一个bug：这个项目所有页面的路由都是由前端代码完成的（react-router），而后端代码则是用Flask写的，且后端只在根路径（`http://localhost:5000/`）渲染了前端的代码，此为前提。当用户从根路径打开页面时，一切正常。但当用户跳过根路径，而直接在浏览器中输入一个子路径时（比如`http://localhost:5000/about`）出了问题，返回了404。并且用户在任意一个子路径进行刷新页面的操作时，也会返回404。

### Client side routing VS. server side routing

> The first big thing to understand about this is that there are now 2 places where the URL is interpreted, whereas there used to be only 1 in 'the old days'. In the past, when life was simple, some user sent a request for `http://example.com/about` to the server, which inspected the path part of the URL, determined the user was requesting the about page and then sent back that page.
>
> With client-side routing, which is what React-Router provides, things are less simple. At first, the client does not have any JS code loaded yet. So the very first request will always be to the server. That will then return a page that contains the needed script tags to load React and React Router etc. Only when those scripts have loaded does phase 2 start. In phase 2, when the user clicks on the 'About us' navigation link for example, the URL is changed *locally only* to `http://example.com/about` (made possible by the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)), but **no request to the server is made**. Instead, React Router does it's thing on the client side, determines which React view to render and renders it. Assuming your about page does not need to make any REST calls, it's done already. You have transitioned from Home to About Us without any server request having fired.

简单地说，client side routing就是通过前端代码的一顿操作，将本该由server端处理的工作给拦截了，并且自己给做了。为什么会有这种需求呢，其实熟悉一些前端就很好理解了：交给server端处理，大部分情况就是重新渲染另一个页面，一般都伴随着页面的刷新，而对于前端代码而言，刷新页面就如同运行后端代码时重启系统，所有内存中存储的东西都没了，前端上很多复杂的操作也就很难实现了。为了能将“命运”掌握在自己手里，client side routing的技术也就应运而生。

<!--break-->

### When client side routing meets server side routing

当这两个技术相遇时，就很容易出现开头的那种尴尬的情景。

情景一：当用户跳过根路径直接访问子路径时，返回404的原因在于：前端代码根本就没有机会去操作，因为它们根本就没有被加载到浏览器中，因此仍然是后端接收到了访问的请求，且没有处理。

情景二：当用户刷新一个子路径时，返回404的原因在于：虽然前端代码之前加载到了浏览器中，但浏览器刷新页面的动作前端代码目前无法拦截，因此仍然会像后端发送一个子路径的请求，而后端并没有对这个子路径做任何处理。

为了化解上面的两种尴尬，后端只需要在接收到子路径的请求时，做相应的处理就可以了。怎么处理？当然是把前端代码加载到浏览器中啦，然后把“话筒”交给前端代码就好了。

在Flask代码中，可以使用一个catch-all的routing handler：

```python
from flask import Flask
app = Flask(__name__)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return render_template('index.html')

if __name__ == '__main__':
    app.run()
```

当然，还有一些其他的解决方法，可以看下面参考的两个回答。我觉得上面这个方案是我目前比较满意的方法。

### Reference

1. [React-router urls don't work when refreshing or writting manually](https://stackoverflow.com/questions/27928372/react-router-urls-dont-work-when-refreshing-or-writting-manually)
2. [Flask and React routing](https://stackoverflow.com/questions/30620276/flask-and-react-routing)