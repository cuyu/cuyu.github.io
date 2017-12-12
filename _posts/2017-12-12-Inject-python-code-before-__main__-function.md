---
layout: post
title: "Inject python code before __main__ function"
category: Python
tags: [hacking, virtualenv, bash]
date: 2017-12-12
---

I'm working on a [project](https://github.com/CarolineZhu/decade) which needs to inject some initilize code before the `__main__` function starts, i.e. running the following command and our injected code is executed before the target script executed.

```bash
python <target_script>
```

### Solutions

There are many ways to implement above requirement. For example, we can hijack the `python` command using `alias` (Or just define a shell function called "python" and the effect is the same.):

```bash
alias python='python <my_inject_script>'
```

Then in my_inject_script, we can do the initialization and then execute the target script.

Another solution is using Python build-in [site](https://docs.python.org/2/library/site.html) package:

> **This module is automatically imported during initialization.**

So we can create a `sitecustomize.py` under the [site](https://docs.python.org/2/library/site.html) package folder and this module will be automatically imported each time `python` command is executed.

<!--break-->

### Go further ###

Both above solutions seem perfect solution to inject code before the `__main__` function executed. However, each of them has its own shortcomings:

- For the "alias" solution, it can only execute an exact python file by using `exec_file` build-in function, but for some python command, it must start another process by using `os.system` or `subprocess.popen`. Starting another process means the initialization in our inject script does not works anymore (initialization must be done in that process).
- For the "site" solution, where to put the `sitecustomize.py` is a problem (**If you're using pip install to patch the inject code, this is a perfect solution already**). Maybe we can search all files in the disc to find a folder named "site-packages", but what if there're several "site-packages" (maybe created by virtualenv).

Therefore, a better solution is combining them together: first, use "alias" to hijack the python command to call our entry script before the real one. In our entry script, we get the path of "site-packages" and create the `sitecustomize.py` there. Then, the entry script calls the real command in another process and in the `sitecustomize.py`, we have our initialization code executed.

### Achilles’ heel ###

The above combined solution looks great. However, there are still situations it cannot handle: the command itself uses python to execute. For example, `pytest` which equals to:

```
/PATH/TO/PYTHON/INTERPRETER/python pytest
```

It just specifies which python to use and the alias is not working here!

So, till now, we cannot depands on / make use of:

- `$PATH` — it changes as entering a virtualenv
- `python` — some command specify which python to use and we cannot change it
- `virtualenv` — many commands can create new virtualenv and the actual may just entering an exist virtualenv
- `source` / `.` — same reason as above

The main problem here is we cannot decide where to put the `sitecustomize.py` because of virtualenv. So why not just patch the `sitecustomize.py` under the default python's "site-packages" and patch it also to the virtualenv's "site-packages" once entering a virtualenv? We cannot depand on the `source` / `.` to detect entering a virtualenv, but we can rely on `export` command! Entering a virtualenv is actually exporting some environment variables. So we just need to hijack the `export` command. Note `export` is reserved keyword (not a build-in function) of shell which cannot be overrode. It means we cannot hijack it by simply defining a shell function named "export".

Luckily, there is a way to add a hook for every shell command which is very handy (see [https://superuser.com/questions/175799/does-bash-have-a-hook-that-is-run-before-executing-a-command](https://superuser.com/questions/175799/does-bash-have-a-hook-that-is-run-before-executing-a-command)):

```shell
preexec () { :; }
preexec_invoke_exec () {
    [ -n "$COMP_LINE" ] && return  # do nothing if completing
    [ "$BASH_COMMAND" = "$PROMPT_COMMAND" ] && return # don't cause a preexec for $PROMPT_COMMAND
    local this_command=`HISTTIMEFORMAT= history 1 | sed -e "s/^[ ]*[0-9]*[ ]*//"`;
    preexec "$this_command"
}
trap 'preexec_invoke_exec' DEBUG
```

So we just need to check every shell command and if the command is trying to change the `$PATH` variable, we seek "site-packages" in the directory and inject our `sitecustomize.py` there.

### Conclusion ###

If the code inject patch can be installed by pip (i.e. you can control the pip install process), using the "site" solution is good enough. If you cannot control the pip install process, then combing the "export" hijacking and "site" solution may be a good choice.