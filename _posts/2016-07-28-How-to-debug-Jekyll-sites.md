---
layout: post
title: "How to debug Jekyll sites"
date: 2016-07-28
category: Web
tags: [坑, 心得, Jekyll]
---

## One Problem

最近研究Jekyll遇到了不少坑，这里先讲其中的一个。



## Debug Jekyll like a boss

### Solution 1

`Jekyll`作者自己写了一个简单的[插件](https://github.com/plusjade/jekyll-bootstrap/blob/master/_plugins/debug.rb)，通过`liquid`的自定义filter功能来实现，使用它可以看到编译时的某个liquid变量的样子。

#### 安装

直接把上面链接的文件拷贝到你的Jekyll项目中的_plugins文件夹下就可以了（没有就创建一个）。

#### 使用

直接在想看的liquid变量后面加上`| debug`即可，等Jekyll编译完成后查看编译后的html文件，那些liquid变量的位置就被变量的内容替换了。

举个例子：

这是编译前的html文件中的一部分：

{% raw %}

```html
{{ paginator.posts | debug }}

{{ page | debug }}
```

{% endraw %}

编译之后对应部分变成：

{% raw %}

```html
<pre>Array
[#<Jekyll::Document _posts/2016-07-28-How-to-debug-Jekyll-sites.md collection=posts>,
 #<Jekyll::Document _posts/2016-07-27-使用Kafka实践心得.md collection=posts>]
</pre>

<pre>Hash
{"layout"=>"default",
 "title"=>"Blog",
 "content"=>
  "{{ paginator.posts | debug }}\n\n{{ page | debug }}\n\n{% for post in paginator.posts %}\n\t<article class=\"post\">\n\n        <h1><a href=\"{{ post.url }}\">{{ post.title }}</a></h1>\n\n\n\t\t<div class=\"post-content\">{{ post.content }}</div>\n\n\t</article>\n\n{% endfor %}\n\n\n\n{% if paginator.total_pages > 1 %}\n\t<div class=\"postnavigation\">\n\n\t\t{% if paginator.previous_page %}\n\t\t\t{% if paginator.page == 2 %}\n\t\t\t\t<a class=\"prev left\" href=\"/\">&larr; Newer</a>\n\t\t\t{% else %}\n\t\t\t\t<a class=\"prev left\" href=\"/page{{paginator.previous_page}}/\">&larr; Newer</a>\n\t\t\t{% endif %}\n\t\t{% else %}\n\t\t\t<span class=\"nope left\">&larr; Newer</span>\n\t\t{% endif %}\n\n\t\t<span class=\"pages\">Page {{ paginator.page }} of {{ paginator.total_pages }}</span>\n\n\t\t{% if paginator.next_page %}\n\t\t\t<a class=\"next right\" href=\"/page{{paginator.next_page}}/\">Older &rarr;</a>\n\t\t{% else %}\n\t\t\t<span class=\"nope right\">Older &rarr;</span>\n\t\t{% endif %}\n\n\t</div>\n{% endif %}\n",
 "dir"=>"/blog/",
 "name"=>"index.html",
 "path"=>"blog/index.html",
 "url"=>"/blog/"}
</pre>
```

{% endraw %}

可以看到每个debug过后的liquid变量都被一个`<pre>`tag包住了，`pre`里面第一行是liquid变量的类型，后面跟着的就是变量的内容啦。

### Solution 2

这是一个更牛逼的Jekyll插件，叫做[Octopress Debugger](https://github.com/octopress/debugger)，是一个github的项目。它的牛逼之处在于可以做到支持加断点的的debug，到了断点处，我就可以知道断点处的任何liquid对象的内容，有点类似于使用gdb来debug C++代码的样子。

#### 安装

按照此项目的README来安装即可。安装完是作为Ruby的库存在的，所以不需要手动创建任何文件。

#### 使用

在需要打断点的地方加上*{{ "{% debug " }}%}*，然后执行`Jekyll serve`来启动编译你的网页，它会在你加的断点处停下，你可以交互式地来debug。

还是举上面那个例子，首先需要在你想要打断点的位置加上*{{ "{% debug " }}%}*:

{% raw %}

```html
---
layout: default
title: Blog
---

{% debug %}

{% for post in paginator.posts %}
	<article class="post">
        <h1><a href="{{ post.url }}">{{ post.title }}</a></h1>
		<div class="post-content">{{ post.content }}</div>
	</article>
{% endfor %}
```

{% endraw %}

然后在命令行中执行`Jekyll serve`，你应该会看到如下的状态：

{% raw %}

```shell
➜  cuyu.github.io git:(master) ✗ Jekyll serve
Configuration file: /Users/CYu/Code/Web/cuyu.github.io/_config.yml
            Source: /Users/CYu/Code/Web/cuyu.github.io
       Destination: /Users/CYu/Code/Web/cuyu.github.io/_site
 Incremental build: disabled. Enable with --incremental
      Generating...

From: /usr/local/lib/ruby/gems/2.3.0/gems/octopress-debugger-1.0.2/lib/octopress-debugger.rb @ line 34 Octopress::Debugger::Tag#render:

    13: def render(context)
    14:   @context = context
    15:
    16:   # HELP: How does this work?
    17:   #
    18:   # Try these commands:
    19:   #  site   => Jekyll's Site instance
    20:   #  page   => Current Page instance
    21:   #  scopes => View local variable scopes
    22:   #
    23:   # Use `c` to read variables from Liquid's context
    24:   #  c 'site' => site hash
    25:   #  c 'page' => page hash
    26:   #
    27:   # Dot notation works too:
    28:   #  c 'site.posts.first'
    29:   #  c 'page.content'
    30:   #  c 'post.tags'
    31:
    32:   binding.pry
    33:
 => 34:   return '' # Debugger halts on this line
    35: end

[1] pry(#<Octopress::Debugger::Tag>)>
```

此时，你可以在命令行中查看断点处任意liquid变量的状态：

```shell
[1] pry(#<Octopress::Debugger::Tag>)> c 'paginator.posts'
=> [#<Jekyll::Document _posts/2016-07-28-How-to-debug-Jekyll-sites.md collection=posts>, #<Jekyll::Document _posts/2016-07-27-使用Kafka实践心得.md collection=posts>]
[2] pry(#<Octopress::Debugger::Tag>)> c 'page'
=> {"layout"=>"default",
 "title"=>"Blog",
 "content"=>
  "{% debug %}\n\n{% for post in paginator.posts %}\n\t<article class=\"post\">\n\n        <h1><a href=\"{{ post.url }}\">{{ post.title }}</a></h1>\n\n\n\t\t<div class=\"post-content\">{{ post.content }}</div>\n\n\t</article>\n\n{% endfor %}\n\n\n\n{% if paginator.total_pages > 1 %}\n\t<div class=\"postnavigation\">\n\n\t\t{% if paginator.previous_page %}\n\t\t\t{% if paginator.page == 2 %}\n\t\t\t\t<a class=\"prev left\" href=\"/\">&larr; Newer</a>\n\t\t\t{% else %}\n\t\t\t\t<a class=\"prev left\" href=\"/page{{paginator.previous_page}}/\">&larr; Newer</a>\n\t\t\t{% endif %}\n\t\t{% else %}\n\t\t\t<span class=\"nope left\">&larr; Newer</span>\n\t\t{% endif %}\n\n\t\t<span class=\"pages\">Page {{ paginator.page }} of {{ paginator.total_pages }}</span>\n\n\t\t{% if paginator.next_page %}\n\t\t\t<a class=\"next right\" href=\"/page{{paginator.next_page}}/\">Older &rarr;</a>\n\t\t{% else %}\n\t\t\t<span class=\"nope right\">Older &rarr;</span>\n\t\t{% endif %}\n\n\t</div>\n{% endif %}\n",
 "dir"=>"/blog/",
 "name"=>"index.html",
 "path"=>"blog/index.html",
 "url"=>"/blog/"}
```

{% endraw %}

可以看到和之前那个插件得到的结果是一样的。

### 小结

liquid这种html模板语言也是可以debug的嘛。然后两种debug的方法达到的效果基本是一样的，当然后者在交互上更友善，功能也更加强大一些，但开发可能还不够完善。