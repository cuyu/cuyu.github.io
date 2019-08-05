---
layout: post
title: "Some notes for Golang"
category: Go
tags: [坑]
date: 2019-08-05
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

3. 使用`go get`安装依赖之前需要使用`go mod init`来初始化。

4. 不同于JavaScript的NPM把依赖安装在各个项目目录下，Python可以通过virtualenv来隔离项目依赖，Go把所有的依赖都存放在工作目录下（这里只说Go官方支持的[modules方式](https://github.com/golang/go/wiki/Modules)）。在每个项目下，使用`go.mod`和`go.sum`文件来标识项目所需的依赖，对于同一个依赖，会根据其version和commit来放置到不同的文件夹。因此，同一个依赖在`$GOPATH`下可能会有很多份不同版本的代码。(这样虽然可能复用之前安装过的依赖，但如何有效地清除那些已经不再需要的依赖呢？)

5. 对比Python：

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

6. Go的module用`init`函数可以做一些初始化的工作，而struct的并不存在初始化的特殊函数，如果想要在struct生成时做些初始化操作，可以使用一个额外的工厂函数来生成该struct：

   ```go
   type Person struct {
     name string
     age  int
   }
   
   func NewPerson(name string, age int) {
     // Do some init work
     return &Person{name, age}
   }
   ```

7. Go标准库对xml或json的解析都需要提前定义好它的format，比如说对于xml：

   ```go
   var body = `<response>
    <sessionKey>exuOpep4^t^oJRtf1JCAfnlIAhDK76ZlMTwP6uWZwXebJ_NRsh8qUBUpxM7LNtOi8Tt6J9DUvdcQdb1r9y8a^V</sessionKey>
     <messages>
       <msg code=""></msg>
     </messages>
   </response>
   `
   // Define the format
   var xmlBody struct {
     SessionKey string `xml:"sessionKey"`
   }
   if err := xml.Unmarshal([]byte(body), &xmlBody); err != nil {
     log.Fatal(err)
   }
   // Parsing result
   fmt.Println(xmlBody.SessionKey)
   ```

   <!--break-->

8. 如果没法事先定义好json的format，可以借助第三方的package，比如`github.com/tidwall/gjson`

9. Go的error handling设计初衷挺好，但会使得函数体不够简洁，也是被吐槽比较猛的地方。比如一个函数内调用了很多其他的函数，每个函数都要做error handling的话：

   ```go
   func Demo() (int, error) {
     err := FuncA()
     if err != nil {
       // Or handle the error instead of return
       return 0, err
     }
     err := FuncB()
     if err != nil {
       return 0, err
     }
     result, err := FuncC()
     if err != nil {
       return 0, err
     }
     return FuncD(result)
   }
   ```

   而其他语言使用try..catch..的话，至少代码主逻辑比较清楚，且通常并不是每种exception都会被catch（而Go的error handling就是想要handle所有的异常，所以也“异常”的繁琐）。

   好消息是据说Go2会有一些新功能来简化error handling。

10. 目前一种可以“简化“error handling的方式是使用内置的`panic`函数，但这种方式也被gopher所反对，它与Golang的error handling理念相背而驰：

   > Don't panic!

   `panic`类似于其他语言中的exception（Go自己的runtime的error也会用panic的方式抛出），它用一个栈来存储input，外部函数可以通过`recover`函数来读取之前存入的内容。

   一个比较认可的说法是，只有在程序碰到非常严重，且不太常见的错误时，可以使用panic来中断程序。

11. Go没有类的概念，但使用interface和struct可以达到类似的效果，比如struct的匿名嵌套可以达到类似继承的效果：

   ```go
   package main
   
   import (  
       "fmt"
   )
   
   type author struct {  
       firstName string
       lastName  string
       bio       string
   }
   
   func (a author) fullName() string {  
       return fmt.Sprintf("%s %s", a.firstName, a.lastName)
   }
   
   type post struct {  
       title     string
       content   string
       author
   }
   
   func (p post) details() {  
       fmt.Println("Title: ", p.title)
       fmt.Println("Content: ", p.content)
       fmt.Println("Author: ", p.fullName())
       fmt.Println("Bio: ", p.bio)
   }
   ```

   以上，`post`并没有实现`fullName`方法，也没有`bio`属性，但可以直接调用，就像是继承了`author`一样（当然，`post`也可以再实现一个方法叫`fullName`，就可以覆盖继承的方法了）。（参考：[https://golangbot.com/inheritance/](https://golangbot.com/inheritance/)）

   而使用interface可以达到多态的效果。