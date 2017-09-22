---
layout: post
title: "关于Groovy和Jenkins shared library"
category: Framework
tags: [Jenkins, Groovy]
date: 2017-09-21
---

最近工作需要把一部分Jenkins 1.x上的job迁移到Jenkins 2.0上，这里简单写点感受和一些需要注意的地方。

Jenkins 2.0首先是完全兼容Jenkins 1.x的，因此迁移的成本并不大。其次，Jenkins 2.0主打的一个特性叫做pipeline，你可以理解为把原先在网页上各种地方存放的代码集中到了一个代码中（主要是Groovy代码）。所有和流程相关的东西（比如准备执行代码的运行环境、安装依赖等步骤）都可以放在pipeline代码中，因此一个Jenkins job的设置就简化为了输入参数+pipeline代码。而由于不同的Jenkins job的pipeline其实有很多代码是通用的，所以就有了shared library一说，即把通用的代码放在一个git repo中，配置好后Jenkins会定期地拉其中的代码，因此我们在pipeline中就可以引入并调用其中的代码了。

### 关于Groovy

Groovy是Java编译器可以直接编译运行一种脚本语言，因此向Jenkins这种用Java写的软件就喜欢用它来作为DSL。因为是脚本语言，它本身并不复杂，只要使用过其他的脚本语言是很容易上手的。这里提几点对于我这种之前用惯了Python和JavaScript的人要注意的地方：

- Groovy中使用`def`关键字来声明变量，即类似JavaScript中的`var`；

- Groovy中的list和dict（Groovy中称为Map）数据类型都是用中括号表示的，只不过dict中会有冒号表示key value pair：

  ```groovy
  def listA = [1, 2, 3]
  def dictA = ['a': 1, 'b':2]
  def emptyList = []
  def emptyDict = [:]
  ```

- Groovy中的函数的输入可以不用括号括起来，而直接用空格间隔开函数名和参数（并且参数和对应的输入之间是用冒号而不是等号）：

  ```groovy
  // below two are the same
  myFunc paramA: inputA, paramB: inputB
  myFunc(paramA: inputA, paramB: inputB)
  ```

- Groovy中使用字符串模板时，下面两种都是可以的，对于复杂的数据结构最好使用后者（外面加花括号）：

  ```groovy
  def name = 'Cook'
  def str1 = 'My name is $name'
  def str2 = 'My name is ${name}'
  ```

<!--break-->

### 关于Jenkins shared library

关于如何在Jenkins中使用shared library可以参考[官方文档](https://jenkins.io/doc/book/pipeline/shared-libraries/)，这里简单提几点：

- 使用`vars`中的全局变量之前需要使用`library`函数来动态导入包含该变量的库。因为该操作是动态的，所以可以像下面这样动态指定一个branch（当然也可以动态指定库名）：

  ```groovy
  library("jenkinstools@$sharedLibBranch")
  ```

- 使用`src`中的类之前需要先使用`import`关键字来导入类，这个操作是静态的，也就是说你不能像上面那样用一个变量作为输入了。同时，因为导入的类是外部的shared library的，还需要提前使用`@Library`（注意L是大写的）来标示是从哪个library import的：

  ```groovy
  @Library("jenkinstools")

  import com.org.jenkins.PytestScheduler
  import com.org.jenkins.EnvWrapper
  ```

- 关于`vars`和`src`中Groovy代码的区别，可以理解为`src`中存放更加底层一些的代码，而`vars`中存放的都是一些常用的关于pipeline的某些步骤的函数，这些函数实现时会去调用`src`中的代码。试想一下，在最终的pipeline代码中是调用`vars`中的函数方便还是创建一个`src`中的类的实例并执行其中的函数方便（首先要使用到多个类的话就需要多个`import`语句，而使用多个全局变量之前的导入就只要一句话，而且支持动态导入哦）。

- 除了在Jenkins中可以存放某个job所需要的pipeline代码外，还可以把pipeline代码以文件的形式存放在需要被Jenkins执行的代码库中，即所谓的pipeline as code（参考[Using a Jenkinsfile](https://jenkins.io/doc/book/pipeline/jenkinsfile/)）。这样做的好处是，pipeline代码也可以进行版本管理了，且各个不同的文件夹下可以管理各自的pipeline，而不需要创建多个不同的Jenkins job了。

- 写好了pipeline的代码，想要调试怎么办？一种最直接的方式是使用`println`来把中间关键的信息打印出来，然后每更新一下pipeline都trigger一个Jenkins job，通过console output来看打印的信息。但如果需要频繁地调试，比如开发Jenkins的shared library中的代码，上面的那种方式就有点效率低下了，另一种思路是对Jenkins的中间状态进行模拟，即将mock的数据传入来调试。

- 有一些Jenkins自带的全局变量是可以直接使用的，比如`currentBuild.currentResult`表示运行到目前为止结果是否有fail。参考[官方文档](https://qa.nuxeo.org/jenkins/pipeline-syntax/globals)。