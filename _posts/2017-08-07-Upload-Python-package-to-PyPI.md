---
layout: post
title: "Upload Python package to PyPI"
category: Python
tags: [guide, 坑]
date: 2017-08-07
---

### 流程###

1. 到[PyPI](https://pypi.python.org)上注册一个账号；

2. 编辑`~/.pypirc`文件，添加你的账号信息：

   ```ini
   [distutils]
   index-servers =
   	pypi

   [pypi]
   repository=https://upload.pypi.org/legacy/
   username={YOUR_USERNAME}
   password={YOUR_PASSWORD}
   ```

3. 打包你的项目（前提是你已经用`setuptools`写好了一个`setup.py`）：

   ```
   sudo python setup.py sdist bdist_wheel
   ```

4. 上传项目：

   ```
   twine upload dist/* -r pypi
   ```

另外，如果你只是想测试下上传的流程，你也可以选择上传到[TestPyPI](https://wiki.python.org/moin/TestPyPI)这个repo上。

### 坑###

```
HTTPError: 403 Client Error: You are not allowed to upload to 'xxxx'. for url: https://upload.pypi.org/legacy/
```

使用`twine`进行upload出现以上的错误，那么很可能是因为你的项目和已有的项目重名了，可以到[https://pypi.python.org/simple/](https://pypi.python.org/simple/)上搜一下看看是否重名。解决的方法自然就是修改一下`setup.py`中setup函数中的`name`参数，删除之前生成的`dist`文件夹并重新生成，然后再upload。