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

4. 对比Python：

   - Go没有set数据结构（原因么看[这里](https://stackoverflow.com/questions/34018908/golang-why-dont-we-have-a-set-datastructure)），要实现一个集合可以这样：

     ```go
     var mySet = map[string]bool {}
     mySet["a"] = true   // Add "a"
     _, ok = mySet["b"]  // Check if "b" exist
     ```

   - Go不支持方法定义时给参数默认值（by design，see [here](https://stackoverflow.com/questions/19612449/default-value-in-gos-method/19612688#19612688)）, 看到的比较好的替代方案是这样的：

     ```go
     type Params struct {
       a, b, c int
     }
     
     func doIt(p Params) int {
       return p.a + p.b + p.c 
     }
     
     // you can call it without specifying all parameters
     doIt(Params{a: 1, c: 9})
     ```

     