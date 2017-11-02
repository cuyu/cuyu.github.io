---
layout: post
title: "Client side rendering VS server side rendering"
category: Javascript
tags: [React]
date: 2017-11-02
---

Why server side rendering? ##

- server-side rendering is great for SEO
- faster for the first time reaching the site



Why client side rendering? ##

- more friendly for server
- better user experience after loading all resources



How (take React as example)? ##

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

- The former one is more powerful than the latter one, 




Some thinkings ##

I've tried to develop a simple website using both server side rendering and client side rendering. I found it may be sometimes confusing and not so clear as developing only client codes. So, here are some experience/tips.

When dealing with both back-end and front-end development, it is especially important to know clearly which part is rendered in server side and which part is rendered in client side. For example, in server side, the cookies is parsed and you can acquire information stored in the session conveniently while in client side, you can only get the original cookies and may need other ways to acquire the information in the session (like request to a backend API).

Besides, you should distinguish between real http requests and client side routings when handling a url. For example, if `/login` endpoint is a backend API, you should make real http request instead of switching client route and vice versa. Sometimes, error occurs due to inappropriate operation with the url.

Reference ##

1. [react-dom 的 renderToString 与 renderToStaticMarkup](http://www.jianshu.com/p/5fa6d6c63d96)
2. ​