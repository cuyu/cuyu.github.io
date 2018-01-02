---
layout: post
title: "在Github上构建Python项目CI的一些心得"
category: Other
tags: [CI, Github, 心得]
date: 2018-01-02
---

> 项目[在此](https://github.com/cuyu/pypeep)。

CI服务选择了使用广泛的Travis CI，代码覆盖则交给了Coveralls，在项目页面显示badge用的是[shields.io](https://github.com/badges/shields)。因为关于怎么搭建各自站点的教程都很清楚，这里就不浪费时间了，只记录一些我当时搭建时碰到的一些问题以及这些问题是如何解决的。

## Travis CI相关

1. 既然直接列出多个元素，Travis CI就会自动启多个job，那`matrix`关键字有什么用？
   **A**: 很多情况下是用不上`matrix`的，但考虑这样一种情况：我想在Linux系统上测试Python 2.7和Python 3.6，而在OSX上只测试Python 2.7，就需要用`matrix`来列出所有的组合了：

   ```yaml
   matrix:
     include:
     - os: linux
       python: "2.7"
     - os: linux
       python: "3.6"
     - os: osx
       python: "2.7"
   ```

2. 在Travis CI上macOS下的Python环境启动失败，出现了类似“The command "sudo tar xjf python-2.7.tar.bz2 --directory /" failed and exited with 1 during .”的错误？

   **A**: Travis CI目前并不支持`os: osx`的情况下选择`language: python`（[https://github.com/travis-ci/travis-ci/issues/2312](https://github.com/travis-ci/travis-ci/issues/2312)）。这里不支持的意思是macOS自带的Python不支持，当然你可以选择启动好VM后再安装指定版本的Python，并且很多项目也是这么做的。

3. 为何OSX的job总是比较慢？
   **A**: 因为Linux默认情况下起来的是container，OSX只能启VM。

<!--break-->

## Coveralls相关 ##

1. `REPO TOKEN`有啥用？
   **A**: 用于私有仓库和Coveralls通信的token，对于开源的Github项目而言，没有也不用设置相关的东西。
2. 每次跑完覆盖率结果是仅仅作为参考吗？有没有类似Travis CI那样硬性的检查标准？
   **A**: 当然有，在Coveralls网站上找到你的repo，仔细找找有一个settings链接，在其中可以设置最低需要满足的代码覆盖率以及一次提交代码覆盖率下降不能超过的阈值。

## Python相关 ##

1. 由于我的项目有一个`setup.py`文件，其中已经包含了项目的Python依赖包，可不可以不添加`requirements.txt`文件（DRY原则，否则新添一个依赖两头都得改）？如果可以，要如何安装这些依赖？
   **A**: 当然是可以的。为了遵循DRY原则，有两种方案可以选择：

   - 仍然添加一个`requirements.txt`文件，并在`setup.py`中解析这个文件中的依赖（解析会比较费劲），这样就把依赖统一放在了`requirements.txt`中来管理，安装依赖仍然使用pip install：

     ```
     pip install -r requirements.txt
     ```

     当然，如果项目存在多套依赖的话，比如测试需要一些额外的库，那可能就需要另外创建一个比如`test_requirements.txt`文件了（里面只记录额外需要的依赖），在测试环境中安装依赖就会像这样：

     ```
     pip install -r requirements.txt
     pip install -r test_requirements.txt
     ```

   - 不需要`requirements.txt`文件，把所以依赖放在`setup.py`中进行管理，安装依赖（注意最后那个点是表示当前目录的意思）：

     ```
     pip install -e .
     ```

     同样，有多套依赖的话，比如测试需要额外的库，setuptools也是支持的，在`setup.py`中（以我的项目为例）：

     ```python
     install_requirements = [
         "paramiko",
         "docker",
         "colorama",
         "psutil",
     ]

     test_requirements = [
         "pytest",
         "pytest-cov",
         "coveralls",
     ]

     setup(
         # ...
         install_requires=install_requirements,
         tests_require=test_requirements,
         # ...
     )
     ```

     在执行`python setup.py test`时，它会自动先安装`install_requires`以及`test_require`指定的依赖的，然后再执行测试。需要注意的是，这里的安装默认是使用easy_install的方式，即安装的都是egg文件（大部分情况下其实没啥影响，但如果你想安装的是命令行工具，这种安装方式并不会注册到环境变量PATH中）。

2. 假如我选择了上述的第二套方案，又需要安装一个命令行工具并使用它，该怎么做（比如用来上传代码覆盖率的`coveralls`）？
   **A**: 最简单的解决方案：在执行`setup.py`之前先用pip install安装好那些命令行依赖。比如Travis CI会在执行测试脚本之前有一个install的步骤，那么我们就可以在其中插入一句`pip install coveralls`，简单粗暴！
   更优雅的解决方案：因为上面的方案其实是破坏了DRY的原则的（每新添一个依赖，有可能要改两个地方了），为此，在`setup.py`中不使用`tests_require`，取而代之地使用`extras_require`来存放测试需要的依赖：

   ```python
   test_requirements = [
       "pytest",
       "pytest-cov",
       "coveralls",
   ]

   setup(
       # ...
       extras_require={
           'test': test_requirements,
       },
       # ...
   )
   ```

   然后安装时指定需要额外安装的依赖即可：

   ```
   pip install -e .[test]
   ```

   （注意：如果是zsh，`.[test]`需要放在引号里，中括号有其他的意义。）

3. `setup.py`默认是使用unittest框架（不确定）来进行测试的，如果我想用pytest框架，又想用`python setup.py test`来启动测试，要怎样做？
   **A**: 参考[requests](https://github.com/requests/requests/blob/master/setup.py)的做法，自定义`setup.py`的test命令的执行函数：

   ```python
   from setuptools.command.test import test as TestCommand

   class PyTest(TestCommand):
       user_options = [('pytest-args=', 'a', "Arguments to pass into py.test")]

       def initialize_options(self):
           TestCommand.initialize_options(self)
           self.pytest_args = ['--cov=pypeep']

       def finalize_options(self):
           TestCommand.finalize_options(self)
           self.test_args = []
           self.test_suite = True

       def run_tests(self):
           import pytest

           errno = pytest.main(self.pytest_args)
           sys.exit(errno)

   setup(
       # ...
       cmdclass={'test': PyTest},
       # ...
   )
   ```

4. Python用来测代码覆盖率的[coverage](https://coverage.readthedocs.io/en/coverage-4.4.2/index.html)命令，只支持`coverage run <py_file>`，即必须给定一个Python文件作为输入，要如何才能和pytest命令结合使用呢？
   **A**: 不需要结合使用。安装`pytest-cov`插件，并在执行pytest命令时指定`--cov`选项即可。