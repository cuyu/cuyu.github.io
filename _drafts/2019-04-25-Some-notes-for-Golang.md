---
layout: post
title: "Some notes for Golang"
category: Go
tags: [坑]
date: 2019-04-25
---

1. `$GOPATH`为工作目录，~~所有项目代码（包括你自己的项目代码和项目中依赖的第三方项目的代码）都应该放在工作目录下的`src`文件夹下。比如说你的项目为`Example-project`：~~，它有点类似于Python的`site-packages`，里面用于存放项目依赖的第三方代码。

   ```
   $GOPATH
   ├── pkg
   └── src
   		├── golang.org
   		└── Example-project
   	
   ```

2. 对于某一个项目，代码一般不要放在`src`目录下，而是按照功能放置代码文件(比如和web相关的就放在`web`文件夹内)。这一点和`$GOPATH`不能混淆([refer](<https://github.com/golang-standards/project-layout>))。

3. 不同于JavaScript的NPM把依赖安装在各个项目目录下，Python可以通过virtualenv来隔离项目依赖，Go把所有的依赖都存放在工作目录下（这里只说Go官方支持的[modules方式](https://github.com/golang/go/wiki/Modules)）。在每个项目下，使用`go.mod`和`go.sum`文件来标识项目所需的依赖，对于同一个依赖，会根据其version和commit来放置到不同的文件夹。因此，同一个依赖在`$GOPATH`下可能会有很多份不同版本的代码。(这样虽然可能复用之前安装过的依赖，但如何有效地清除那些已经不再需要的依赖呢？)

4. 