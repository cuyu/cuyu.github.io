---
layout: post
title: "Python打包工具setuptools的一点经验"
category: Python
tags: [心得, setuptools]
date: 2017-01-09
---

比较早接触到`setuptools`是在写pytest的plugin时，研究了一下pytest是如何通过`setuptools`中设置的名为`pytest11`的`entry_points`来加载pip install的pytest plugin的。后来偶然间研究一些cmdline的库时，发现通过名为`console_scripts`的`entry_points`可以非常方便地把某个python函数注册到环境变量PATH中对应的一个可执行文件中，而不需要自己写setup脚本来做这件事情了。顿时觉得`setuptools`好强大。

关于怎么使用`setuptools`，可以参考[官方文档](https://setuptools.readthedocs.io/en/latest/)或一些开源的cmdline工具（比如[virtualenv](https://github.com/pypa/virtualenv)）。以下，仅记录我使用`setuptools`库的一些经验（目前还不是很丰富。。）：

1. 使用`python setup.py sdist `命令来在当前目录下生成打包好的文件，方便检查是否所有需要打包的文件都被打包了。

2. 使用` python setup.py install `命令来把打包好的package安装到当前Python环境中，方便在布之前先在本地安装进行测试。

3. 如果需要打包的文件包含非Python package文件（比如一些资源文件），则需要在`setup.py`同级目录下新建一个`MANIFEST.in`文件，在其中包含需要额外打包的文件，比如：

   ```
   recursive-include splunk_env_switcher/ansible_playbooks *.yml *.py
   include splunk_env_switcher/ansible.cfg
   ```

   并且，在`setup.py`中的`setuptools.setup`方法中添加`include_package_data=True`的参数。

4. 使用以下命令可以根据当前目录下的`setup.py`打包发布到指定的pypi服务器：

   ```
   sudo python setup.py sdist upload -r https://specified-pypi-server
   ```

5. 一些有用的`entry_points`：

   - `console_scripts`: 绑定指定的package中的函数到某个环境变量（作为cmdline工具），比如：

     ```python
     entry_points={
         'console_scripts': ['virtualenv=virtualenv:main'],
     }
     ```

   - `pytest11`: pytest官方定义的entry_point，用来识别通过pip install的pytest plugin，比如:

     ```python
     entry_points={
         'pytest11': [
             'xdist = xdist.plugin',
             'xdist.looponfail = xdist.looponfail',
             'xdist.boxed = xdist.boxed',
         ],
     }
     ```