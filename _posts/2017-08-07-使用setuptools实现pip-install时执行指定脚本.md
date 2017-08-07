---
layout: post
title: "使用setuptools实现pip install时执行指定脚本"
category: Python
tags: [setuptools]
date: 2017-08-07
---

简单说，就是重新实现一个安装类，然后让`setuptools`在安装时调用我们的这个安装类。为了保留原生的安装类中的方法，我们直接继承`setuptools`中的安装类，然后重写其中的`run`方法即可：

```python
from setuptools.command.install import install

class CustomInstallCommand(install):
    """Customized setuptools install command"""

    def run(self):
        install.run(self)
        YOUR_FUNCTION()  # Replace with your code
```

然后将`setup`函数中的`cmdclass`的“install”置为上面重写的安装类：

```python
setuptools.setup(
    ...
    ,
    cmdclass={
        'install': CustomInstallCommand,
    },
)
```

此外，需要**注意**的是，如果希望将package上传至PyPI，别人pip install时也能执行你的脚本，则必须要使用源码打包的方式，即：

```
python setup.py sdist
```

而**不能**是：

```
python setup.py sdist bdist_wheel
```

因为后者在安装时并不会再去执行`setup.py`（这种方式可以理解为在上传package时将已经执行过`setup.py`的结果打包上传了）。

### Reference

1. [Running custom code with pip install fails](https://stackoverflow.com/questions/40433168/running-custom-code-with-pip-install-fails)
2. [Setuptools – run custom code in setup.py](https://blog.niteoweb.com/setuptools-run-custom-code-in-setup-py/)