---
layout: post
title: "Play Python Library之argcomplete"
category: Python
tags: [Play Python Library, argcomplete]
date: 2017-09-04
---



另外一个拥有类似补全功能的库为[Python Prompt Toolkit](https://github.com/jonathanslenders/python-prompt-toolkit)，不同之处在于：[Python Prompt Toolkit](https://github.com/jonathanslenders/python-prompt-toolkit)并没有对argparse做绑定，它需要首先进入到它的event loop当中，再对输入进行补全。大名鼎鼎的iPython便是用了[Python Prompt Toolkit](https://github.com/jonathanslenders/python-prompt-toolkit)来增强补全等功能的（回想一下，iPython也是要先通过执行`ipython`命令，然后再在其中进行输入）。而argcomplete则不一样，它是我们在shell环境中直接进行补全（也可以理解为是在shell的event loop中做事情），因此我们可以不需要先执行某个命令，而是在执行命令的同时对该命令进行补全。前者由于是统一地在python的运行环境中进行操作的，其实相对实现没那么麻烦，而后者则需要考虑兼容不同的shell环境，比如bash、zsh、tsh等等，我之前提交了一个[bug](https://github.com/kislyuk/argcomplete/issues/228)就是关于zsh和bash实现不同导致的。