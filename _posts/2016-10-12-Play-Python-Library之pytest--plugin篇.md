---
layout: post
title: "Play Python Library之pytest--plugin篇"
category: Python
tags: [pytest, Play Python Library]
date: 2016-10-12
---

### Register as pytest plugin

通过`pytest --trace-config`命令可以查看当前pytest中所有的plugin。

比如：

```
➜  demo pytest --trace-config
PLUGIN registered: <_pytest.config.PytestPluginManager object at 0x10cd27a90>
PLUGIN registered: <_pytest.config.Config object at 0x10cfc20d0>
PLUGIN registered: <module '_pytest.mark' from '/usr/local/lib/python2.7/site-packages/_pytest/mark.pyc'>
PLUGIN registered: <module '_pytest.main' from '/usr/local/lib/python2.7/site-packages/_pytest/main.pyc'>
PLUGIN registered: <module '_pytest.terminal' from '/usr/local/lib/python2.7/site-packages/_pytest/terminal.pyc'>
PLUGIN registered: <module '_pytest.runner' from '/usr/local/lib/python2.7/site-packages/_pytest/runner.pyc'>
PLUGIN registered: <module '_pytest.python' from '/usr/local/lib/python2.7/site-packages/_pytest/python.pyc'>
PLUGIN registered: <module '_pytest.fixtures' from '/usr/local/lib/python2.7/site-packages/_pytest/fixtures.pyc'>
PLUGIN registered: <module '_pytest.debugging' from '/usr/local/lib/python2.7/site-packages/_pytest/debugging.pyc'>
PLUGIN registered: <module '_pytest.unittest' from '/usr/local/lib/python2.7/site-packages/_pytest/unittest.pyc'>
PLUGIN registered: <module '_pytest.capture' from '/usr/local/lib/python2.7/site-packages/_pytest/capture.pyc'>
PLUGIN registered: <module '_pytest.skipping' from '/usr/local/lib/python2.7/site-packages/_pytest/skipping.pyc'>
PLUGIN registered: <module '_pytest.tmpdir' from '/usr/local/lib/python2.7/site-packages/_pytest/tmpdir.pyc'>
PLUGIN registered: <module '_pytest.monkeypatch' from '/usr/local/lib/python2.7/site-packages/_pytest/monkeypatch.pyc'>
PLUGIN registered: <module '_pytest.recwarn' from '/usr/local/lib/python2.7/site-packages/_pytest/recwarn.pyc'>
PLUGIN registered: <module '_pytest.pastebin' from '/usr/local/lib/python2.7/site-packages/_pytest/pastebin.pyc'>
PLUGIN registered: <module '_pytest.helpconfig' from '/usr/local/lib/python2.7/site-packages/_pytest/helpconfig.pyc'>
PLUGIN registered: <module '_pytest.nose' from '/usr/local/lib/python2.7/site-packages/_pytest/nose.pyc'>
PLUGIN registered: <module '_pytest.assertion' from '/usr/local/lib/python2.7/site-packages/_pytest/assertion/__init__.pyc'>
PLUGIN registered: <module '_pytest.junitxml' from '/usr/local/lib/python2.7/site-packages/_pytest/junitxml.pyc'>
PLUGIN registered: <module '_pytest.resultlog' from '/usr/local/lib/python2.7/site-packages/_pytest/resultlog.pyc'>
PLUGIN registered: <module '_pytest.doctest' from '/usr/local/lib/python2.7/site-packages/_pytest/doctest.pyc'>
PLUGIN registered: <module '_pytest.cacheprovider' from '/usr/local/lib/python2.7/site-packages/_pytest/cacheprovider.pyc'>
PLUGIN registered: <module '_pytest.freeze_support' from '/usr/local/lib/python2.7/site-packages/_pytest/freeze_support.pyc'>
PLUGIN registered: <module '_pytest.setuponly' from '/usr/local/lib/python2.7/site-packages/_pytest/setuponly.pyc'>
PLUGIN registered: <module '_pytest.setupplan' from '/usr/local/lib/python2.7/site-packages/_pytest/setupplan.pyc'>
PLUGIN registered: <module 'pytest_pep8' from '/usr/local/lib/python2.7/site-packages/pytest_pep8.py'>
PLUGIN registered: <_pytest.capture.CaptureManager instance at 0x10debc5f0>
PLUGIN registered: <Session 'demo'>
PLUGIN registered: <_pytest.cacheprovider.LFPlugin instance at 0x10decb680>
PLUGIN registered: <_pytest.terminal.TerminalReporter instance at 0x10debc368>
PLUGIN registered: <_pytest.fixtures.FixtureManager instance at 0x10decbd88>
```

以上，似乎看的有点晕，但其实大部分都是pytest自带的plugin（通过它们的文件路径也可以大概看出来，除了`pytest_pep8`其他都是_pytest文件夹下的）。在pytest中，所谓plugin其实就是能被pytest发现的一些带有pytest hook方法的文件或对象。

其实[官方文档](http://doc.pytest.org/en/latest/writing_plugins.html#plugin-discovery-order-at-tool-startup)也提到了pytest plugin加载的几种方式：

> `pytest` loads plugin modules at tool startup in the following way:
>
> - by loading all builtin plugins
>
> - by loading all plugins registered through [setuptools entry points](http://doc.pytest.org/en/latest/writing_plugins.html#setuptools-entry-points).
>
> - by pre-scanning the command line for the `-p name` option and loading the specified plugin before actual command line parsing.
>
> - by loading all `conftest.py` files as inferred by the command line invocation:
>
>   - if no test paths are specified use current dir as a test path
>   - if exists, load `conftest.py` and `test*/conftest.py` relative to the directory part of the first test path.
>
>   Note that pytest does not find `conftest.py` files in deeper nested sub directories at tool startup. It is usually a good idea to keep your conftest.py file in the top level test or project root directory.
>
> - by recursively loading all plugins specified by the `pytest_plugins` variable in `conftest.py` files

以下，是更详细的一些说明：

- 通过entry points，也就是我们通常pip install的一些pytest plugin注册到pytest的方式。

  这是通过`PluginManager.load_setuptools_entrypoints`方法来加载的，通过断点可以进入这个方法查看所有由此加载的plugin（这里的`entrypoint_name`可以看到就是'pytest11'）：

  ```python
  for ep in iter_entry_points(entrypoint_name):
      print ep
  ```

- 通过`conftest.py`的方式：这种方式其实就是在`conftest.py`中添加pytest的hook方法，把`conftest.py`本身作为plugin。

- 通过设置`pytest_plugins`变量的方式：这种方法最为tricky，比如说在`conftest.py`中添加下面的这一行代码就把`pytest_platform_test`（当然这个文件本身要求能在当前路径被import）这个plugin给注册到pytest里了。

  ```python
  pytest_plugins = ['pytest_platform_test']
  ```



<!--break-->

### How pytest hook runs

理解了pytest的hooks，基本上就等于知道了pytest的plugin是怎么写的了（pytest的plugin可以理解为就是包含了一些pytest hooks的python模块）。

pytest筛选它的hook方法的部分代码如下（在`_pytest.config.py`中）：

```python
def parse_hookimpl_opts(self, plugin, name):
    # pytest hooks are always prefixed with pytest_
    # so we avoid accessing possibly non-readable attributes
    # (see issue #1073)
    if not name.startswith("pytest_"):
        return
    # ignore some historic special names which can not be hooks anyway
    if name == "pytest_plugins" or name.startswith("pytest_funcarg__"):
        return

    method = getattr(plugin, name)
    opts = super(PytestPluginManager, self).parse_hookimpl_opts(plugin, name)
    if opts is not None:
        for name in ("tryfirst", "trylast", "optionalhook", "hookwrapper"):
            opts.setdefault(name, hasattr(method, name))
    return opts
```

其中每个`plugin`其实就是一个python的模块（一个py文件），pytest会对这个模块中的所有对象进行筛选，选出符合条件的方法对象（比如需要是`pytest_`开头的命名方式）。

pytest在执行hook方法的时候部分代码如下：

```python
def execute(self):
    all_kwargs = self.kwargs
    self.results = results = []
    firstresult = self.specopts.get("firstresult")

    while self.hook_impls:
        hook_impl = self.hook_impls.pop()
        try:
            args = [all_kwargs[argname] for argname in hook_impl.argnames]
        except KeyError:
            for argname in hook_impl.argnames:
                if argname not in all_kwargs:
                    raise HookCallError(
                        "hook call must provide argument %r" % (argname,))
        if hook_impl.hookwrapper:
            return _wrapped_call(hook_impl.function(*args), self.execute)
        res = hook_impl.function(*args)
        if res is not None:
            if firstresult:
                return res
            results.append(res)

    if not firstresult:
        return results
```

其中`self.hook_impls`是一个包含了一些hook方法的list，每次会pop一个来执行。

以上我们知道了pytest是怎么去发现plugin中的hook方法以及怎么去执行的，还有一个问题是pytest是怎么处理它预先设置好的一些特殊的hook的（比如`pytest_addoption`方法，显然不仅仅是简单执行一下就好了的）？

这里需要看一下pytest的`PluginManager`的`register`方法（这里只摘了其中一部分）：

```python
for name in dir(plugin):
    hookimpl_opts = self.parse_hookimpl_opts(plugin, name)
    if hookimpl_opts is not None:
        normalize_hookimpl_opts(hookimpl_opts)
        method = getattr(plugin, name)
        hookimpl = HookImpl(plugin, plugin_name, method, hookimpl_opts)
        hook = getattr(self.hook, name, None)
        if hook is None:
            hook = _HookCaller(name, self._hookexec)
            setattr(self.hook, name, hook)
        elif hook.has_spec():
            self._verify_hook(hook, hookimpl)
            hook._maybe_apply_history(hookimpl)
        hook._add_hookimpl(hookimpl)
        hookcallers.append(hook)
return plugin_name
```

执行时你会发现所有pytest的那些特殊hook方法都会通过`hook.has_spec()`验证，也就是说pytest事先定义好了一些hookspec（这些方法定义可以在`_pytest.hookspec.py`中看到），在注册hook方法如果名称符合定义的这些hookspec时，会“特别关照”这些方法（pytest对那些满足了筛选条件但hookspec中没有的方法，目前策略是会注册进来但不会去执行~~（上述`register`方法中在`hook._maybe_apply_history(hookimpl)`这句会执行这个hook方法）~~）。

还是以`pytest_addoption`为例，基本每个pytest plugin都会有这个hook方法，它的作用是为pytest命令行添加自定义的参数。那么pytest是怎样把所有的plugin需要添加的参数“杂糅”到一块的呢？它的实现是这样的：由于每个plugin的执行顺序有先后，想要让plugin B的addoption结果在plugin A的基础上进行，那么就需要把之前所有的plugin的addoption的结果存下来。上述`register`方法中的`self.hook`就存储了这些中间结果，每次执行一个新的plugin的`pytest_addoption`方法时，pytest会把之前执行改变过的`parser`传递进去进行“再造”。

当然不同的hook方法处理的方式可能是不同的，再以`pytest_collection`为例，它的作用是收集需要执行的测试方法，默认的规则是执行pytest命令的路径下所有以`test`开头的方法。现在我在我的plugin写了一个`pytest_collection`来收集所有以`special`开头的方法，当pytest加载了我的plugin时，会发生什么变化呢？答案是最终会收集到所有以`special`开头以及所有以`test`开头的方法（如果你不想收集以`test`开头的方法，那么可以使用`pytest_collect_file`hook，参考官方的[例子](http://doc.pytest.org/en/latest/example/nonpython.html#yaml-plugin)）。pytest的实现是这样的：pytest会收集所有的plugin的`pytest_collection`方法，并放到一个list中（这个list就是上面执行hook的代码中的`self.hook_impls`），当加载完所有的plugin后，逐个执行这个list中的所有方法，并将返回值添加到一个结果list中。

`pytest_collection`和`pytest_addoption`的主要不同其实就在于每个plugin中的相应hook是收集起来统一执行的还是每收集一个就执行一个（pytest会对每个hookspec打上一个标记，如果有这个标记就收集一个执行一个（参见上面register代码中的`hook._maybe_apply_history(hookimpl)`，它只会对有这个标记的hook进行执行操作（对，这个标记名称叫`history`...）））。

### `pytest.hookimpl` decorator

最后再聊一聊`pytest.hookimpl`这个装饰器。简单地说，它的作用就是对所在的hook方法打上一些标记，当后续执行时会用到这些标记。如果你的pytest hook方法没有用这个装饰器，pytest会通过下面的这个方法打上一些默认的标记（所以你没用这个装饰器其实相当于用了`@pytest.hookimpl(tryfirst=False, trylast=False, hookwrapper=False, optionalhook=False)`这样一个装饰器）：

```python
def normalize_hookimpl_opts(opts):
    opts.setdefault("tryfirst", False)
    opts.setdefault("trylast", False)
    opts.setdefault("hookwrapper", False)
    opts.setdefault("optionalhook", False)
```

这里以`hookwrapper`这个参数为例，讲一下这样一个标记是如何影响所在的hook方法的。

`hookwrapper`为True意味着这个hook方法会在其他同名的hook方法之前以及之后执行（即wrap了其他的hook），具体的规则是以`yield`关键字为界限，此前的代码会在其他hook方法执行之前执行，而`yield`语句之后的代码会在其他hook方法执行之后执行（这个规则是不是有点眼熟，简直和pytest的fixture如出一辙，其如何实现的也可以参考[Play Python Library之pytest--fixture篇](/python/2016/09/19/Play-Python-Library之pytest-fixture篇)）。还是上面执行hook的那部分代码，其中有这么一句：

```python
    if hook_impl.hookwrapper:
        return _wrapped_call(hook_impl.function(*args), self.execute)
```

注意，`_wrapped_call`在这里会把`self.execute`方法本身传递进去。再看下`_wrapped_call`方法的实现：

```python
def _wrapped_call(wrap_controller, func):
    """ Wrap calling to a function with a generator which needs to yield
    exactly once.  The yield point will trigger calling the wrapped function
    and return its _CallOutcome to the yield point.  The generator then needs
    to finish (raise StopIteration) in order for the wrapped call to complete.
    """
    try:
        next(wrap_controller)   # first yield
    except StopIteration:
        _raise_wrapfail(wrap_controller, "did not yield")
    call_outcome = _CallOutcome(func)
    try:
        wrap_controller.send(call_outcome)
        _raise_wrapfail(wrap_controller, "has second yield")
    except StopIteration:
        pass
    return call_outcome.get_result()
```

大概能看出来传递进来的execute方法在执行了`yield`语句之后（触发了`StopIteration`的Exception）被执行了。

### Conclusion

pytest通过这种plugin的方式，大大增强了这个测试框架的实用性，可以看到pytest本身的许多组件也是通过plugin的方式加载的，可以说pytest就是由许许多多个plugin组成的。另外，通过定义好一些hook spec，可以有效地控制plugin的“权限”，再通过类似`pytest.hookimpl`这样的装饰器又可以增强了各种plugin的“权限”。这种design对于pytest这样复杂的框架而言无疑是非常重要的，这可能也是pytest相比于其他测试框架中越来越🔥的原因吧。

### Example

一个最容易也最实用的pytest plugin大概就是可以自定义pytest marker了吧（直接看[官方文档](http://doc.pytest.org/en/latest/example/markers.html#custom-marker-and-command-line-option-to-control-test-runs)好了）。

有时间再补充吧。。。

[^注]: 本文内容均针对`pytest-3.0.3`而言。