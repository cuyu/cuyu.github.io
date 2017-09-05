---
layout: post
title: "Debug Javascript using Webstorm"
category: Javascript
tags: [debug, Webstorm]
date: 2017-09-04
---

## Debug Javascript in web page##

### Prerequisites###

Install corresponding Webstorm plugin for your browser.

### Debug###

1. Create a `html` file which import your js file.
2. Debug the `html` file:
   1. Configure the URL of the debugger to something like `http://localhost:63342/untitled/index.html`.
   2. Make sure the browser plugin settings use the same port above.

## Debug NodeJS##

### Prerequisites###

Install Nodejs interpreter.

### Debug###

Debug the `js` file directly using Webstorm, just like debugging Python with Pycharm.

<!--break-->

## Debug NodeJS subprocess##

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

## Debug React project

In latest version of Webstorm, debugging the code of a React project is as easy as debugging JS code in normal html pages (thanks for the sourcemap, the debugger can recognize breakpoints in the code before pre-compiled by Babel). Please read [Debugging React apps created with Create React App in WebStorm](https://blog.jetbrains.com/webstorm/2017/01/debugging-react-apps/) for guides.

In practice, I found that the breakpoint is not work when the first time page is rendered. In this situation, refreshing the page will solve the problem (Not sure if this is the bug of Webstorm or not).