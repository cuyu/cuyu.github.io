---
layout: post
title: "Using sphinx to build Python document"
category: Python
tags: [sphinx]
date: 2018-05-29
---

1. 使用`sphinx-quickstart`命令来初始化创建一些必要的文件（建议先创建一个`docs`文件夹，然后在其中执行该命令）。

2. 使用`sphinx-build`命令来生成对应的文档，比如`sphinx-build -b html source build`会生成html格式的页面。当然，如果你在执行`sphinx-quickstart`命令时选择了同时生成Makefile的话，则可以通过`make html`来达到一样的效果。

3. 使用`sphinx-build`命令来生成文档时，并不需要指定对应的项目路径，原因在于sphinx是直接在python代码中import你在rst文件中填写的模块的。因此，一定要确保在所有依赖包都安装好的virtualenv中来执行`sphinx-build`命令（sphinx最好也安装在该virtualenv中），并且，确保对应的项目路径可以在python环境中被import（把项目路径添加到`PYTHONPATH`环境变量中再执行命令或是在项目路径的父级目录执行命令）。
   比如下面的rst:

   ```rst
   .. autoclass:: my_module.sub_module.ClassA
   ```

   实际上做的事情类似于：

   ```python
   from my_module.sub_module import ClassA
   ```

4. 使用`sphinx-apidoc -f -o docs/source projectdir`来自动生成对应于项目中每个函数的api的文档。

5. 建议加入[sphinx.ext.napoleon](http://www.sphinx-doc.org/en/master/ext/napoleon.html#module-sphinx.ext.napoleon)扩展，这样在转换代码中的docstring时会支持google和numpy的风格（[example](http://www.sphinx-doc.org/en/master/ext/example_numpy.html#example-numpy)）。

6. sphinx默认会渲染所有的rst格式的文件，如果想要使用mark down来书写文档的话，需要额外安装解析mark down的库，并设置sphinx来渲染它们（参考[http://www.sphinx-doc.org/en/master/usage/markdown.html](http://www.sphinx-doc.org/en/master/usage/markdown.html)）。

7. 避免重复渲染同一个文件：默认所有文件夹下的rst文件都会被sphinx渲染，所以在rst文件中直接引用该文件名即可，而不需要`.. include:`来引入。
   比如，我有一个`api.rst`文件，我需要在`index.rst`文件中引用它作为目录：

   ```rst
   .. toctree::
      :maxdepth: 2
      :caption: Contents:

      api
   ```

   ​