---
layout: post
title: "Debug Javascript like a boss"
category: Javascript
tags: [React, Webstorm]
date: 2017-09-01
---

Debug Javascript in web page##

Prerequisites\###

Install corresponding Webstorm plugin for your browser.

Debug###

1. Create a `html` file which import your js file.
2. Debug the `html` file:
   1. Configure the URL of the debugger to something like `[http://localhost:63342/untitled/index.html`](http://localhost:63342/untitled/index.html%60).
   2. Make sure the browser plugin settings the same port above.

Debug NodeJS code##

Prerequisites###

Install Nodejs interpreter.

Debug###

Debug the `js` file directly using Webstorm, just like debugging Python with Pycharm.

Debug NodeJS subprocess##

NodeJS (standard library) uses `child_process.spawn` to start a subprocess. Example code is as below:

```javascript
const { spawn } = require('child_process');
const result = spawn('node', ['/tmp/myscript.js', 'start']);

result.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

result.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

result.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
```

The `result.stdout.on` function accept a callback function and will call it when the subprocess is actually running and generate stdout texts. Also note the `spawn` function is an async function which will not block the rest code of the file. If you need the subprocess blocks the main process, you can use `child_process.spawnSync` instead.

There are some projects like create-react-app may use a third-party library [cross-spawn](https://github.com/IndigoUnited/node-cross-spawn) to do the same things.

Just like `subprocess.Popen` in Python, Javascript cannot debug the subprocess directly. **The simplest way to debug the code in subprocess is getting the arguments of the subprocess and running the subprocess independently with the arguments.**

For example, in above example code, the subprocess execute the Javascript code in `/tmp/myscript.js` with argument `start`. So why not just debug the `/tmp/myscript.js` file with the same argument?

Debug React project##

In latest version of Webstorm, debugging the code of a React project is as easy as debugging JS code in normal html pages (thanks for the sourcemap, the debugger can recognise breakpoints in the code before pre-compiled by Babel). Please read [Debugging React apps created with Create React App in WebStorm](https://blog.jetbrains.com/webstorm/2017/01/debugging-react-apps/) for guides.

But you should also note that not all codes in a React project are "debugable". Taking the project produced by create-react-app for example, you Javascript codes are firstly pre-compiled by Babel, then packed using Webpack and finally loaded to the web pages. **The above debugging method can only debug the codes which are executed after loading to the web page.** So you should never expect the below breakpoint works (但下面这行代码应该也是加载到浏览器之后执行的？？？Seems it's a bug of Webstorm? You need to refresh the page to let the bundled codes run again and it will stops at the breakpoint):

```jsx
import React, {Component} from 'react';

let a = 1;  // Set breakpoint here

const App = (props) => {
    return (
        <div className="App">
            <input type="text" onChange={props.handleInputChange} value={props.input} />
        </div>
    );
};

export default App;
```

So how can I debug the codes executed before loading to the web page like above?