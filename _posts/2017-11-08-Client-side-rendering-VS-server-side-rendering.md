---
layout: post
title: "Client side rendering VS server side rendering"
category: Javascript
tags: [React]
date: 2017-11-08
---

Just similar to client side routing VS server side routing (see [Client side routing VS. server side routing](http://cuyu.github.io/web/2017/07/31/Client-side-routing-VS.-server-side-routing)), the topic is now change to rendering. Actually, **the client side rendering make it possible for client side routing** as each route invokes at least a rendering operation. If the rendering is executed by the client, that routing is client side routing. See, they are just the same thing at the end.

## Why server side rendering? ##

- server-side rendering is great for SEO
- faster for the first time reaching the site


## Why client side rendering? ##

- less requests for server
- better user experience after loading all resources


For my opinion, the only reason I may choose server side rendering is for SEO (and it won't be a problem as crawler tech evolves). Assume you've opened a web page, it may be awful that each link on the page still costs seconds to open up. The client side rendering is more like loading a game. Once loaded, enjoy everywhere.

<!--break-->

## How (take React as example)? ##

React provides `React.render` for client side rendering and `React.renderToString`, `React.renderToStaticMarkup` for server side rendering. Let's see what the React doc says:

> #### React.render
>
> ```
> ReactDOM.render(element, container[, callback])
> ```
>
> Render a React element into the DOM in the supplied `container` and return a [reference](https://reactjs.org/docs/more-about-refs.html)to the component (or returns `null` for [stateless components](https://reactjs.org/docs/components-and-props.html#functional-and-class-components)).
>
> If the React element was previously rendered into `container`, this will perform an update on it and only mutate the DOM as necessary to reflect the latest React element.
>
> If the optional callback is provided, it will be executed after the component is rendered or updated.
>
> #### React.renderToString
>
> ```
> ReactDOMServer.renderToString(element)
> ```
>
> Render a React element to its initial HTML. React will return an HTML string. You can use this method to generate HTML on the server and send the markup down on the initial request for faster page loads and to allow search engines to crawl your pages for SEO purposes.
>
> If you call [`ReactDOM.hydrate()`](https://reactjs.org/docs/react-dom.html#hydrate) on a node that already has this server-rendered markup, React will preserve it and only attach event handlers, allowing you to have a very performant first-load experience.
>
> #### React.renderToStaticMarkup
>
> ```
> ReactDOMServer.renderToStaticMarkup(element)
> ```
>
> Similar to [`renderToString`](https://reactjs.org/docs/react-dom-server.html#rendertostring), except this doesn’t create extra DOM attributes that React uses internally, such as `data-reactroot`. This is useful if you want to use React as a simple static page generator, as stripping away the extra attributes can save some bytes.
>
> If you plan to use React on the client to make the markup interactive, do not use this method. Instead, use [`renderToString`](https://reactjs.org/docs/react-dom-server.html#rendertostring) on the server and [`ReactDOM.hydrate()`](https://reactjs.org/docs/react-dom.html#hydrate) on the client.

The differences from the function signature:

- The return object type is different: `React.render` returns a ReactComponent object and the latter two functions return a string.
- The inputs are different: `React.render` also needs a DOM node as input where the React element will attach on while the latter two functions do not need this because server side rendering always return a full html page to the browser.

The differences between `React.renderToString` and `React.renderToStaticMarkup`:

- The former one is more powerful than the latter one. It also renders a `data-reactid` for each React component into the html string so that the ReactJS in the client side can recognize corresponding DOM nodes and rendered afterwards (the "render" here means the operations which cannot be done by the server side rendering, e.g. executing `componentDidMount` function).
- Correspondingly, the latter one is more light weighted, as the doc said, save some bytes.


So the **conclusion** is:

- Use `React.render` for client side rendering.
- Use `React.renderToStaticMarkup` for server side rendering of simple pages.
- Use `React.renderToString` for server side rendering of complex pages (have interactive components).

## Some thinkings ##

I've tried to develop a simple website using both server side rendering and client side rendering. I found it may be sometimes confusing and not so clear as developing only client codes. So, here are some experience/tips.

When dealing with both back-end and front-end development, it is especially important to know clearly which part is rendered in server side and which part is rendered in client side. For example, in server side, the cookies is parsed and you can acquire information stored in the session conveniently while in client side, you can only get the original cookies and may need other ways to acquire the information in the session (like request to a backend API).

Besides, you should distinguish between real http requests and client side routings when handling a url. For example, if `/login` endpoint is a backend API, you should make real http request instead of switching client route and vice versa. Sometimes, error occurs due to inappropriate operation with the url.

If the http request is made by the browser (i.e. enter url in browser), in the backend, you can just return a redirect (304) response and the browser will receive the redirection page. However, if the http request is made by your JS code, you should handle the redirection by yourself in JS code and in backend, the response should not be 304 (actually the 304 response will return the whole html of the redirect target page). For example:

```javascript
window.location = '/login';
```

## Reference ##

1. [react-dom 的 renderToString 与 renderToStaticMarkup](http://www.jianshu.com/p/5fa6d6c63d96)
2. [What is the difference between React.render, React.renderToStaticMarkup and React.renderToString?](https://www.quora.com/What-is-the-difference-between-React-render-React-renderToStaticMarkup-and-React-renderToString)