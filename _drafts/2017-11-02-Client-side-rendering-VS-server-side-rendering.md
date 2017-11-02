---
layout: post
title: "Client side rendering VS server side rendering"
category: Javascript
tags: [React]
date: 2017-11-02
---

Why server side rendering? ##



Why client side rendering? ##



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



