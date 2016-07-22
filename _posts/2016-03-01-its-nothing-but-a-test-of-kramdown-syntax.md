---
layout: post
title: "It's nothing but a test of kramdown syntax"
date: 2016-03-01
---

The [kramdown syntax](http://kramdown.gettalong.org/syntax.html) is based on the Markdown syntax and has been enhanced with features that are found in other Markdown implementations like Maruku, PHP Markdown Extra and Pandoc. **However, it strives to provide a strict syntax with definite rules and therefore isn’t completely compatible with Markdown.** (e.g. Need a blank line before for some syntax while Markdown syntax may not need that blank line.)

---


Setext Style H1(上面一行必须是空行)
==========


Setext Style H2
--------

---

# atx Style H1(上面一行必须是空行)

## atx Style H2

### atx Style H3

#### atx Style H4

##### atx Style H5

###### atx Style H6

---

*我是斜体*

**我是粗体**

---

* option 1 (使用*或+或-都可以)
* option 2
- option 3
  - nested option 1
  + nested option 2

---

1. list 1
2. list 2
3. list 3

---

> A sample blockquote.
>
> >Nested blockquotes are
> >also possible.
>
> ### Headers work too
> This is the outer quote again.

---

Example: `我是简单的代码框`

      我是大片的代码框
      在前面需要tab
      或4个以上的空格

~~~~~~
This is also a code block.
​~~~
Ending lines must have at least as
many tildes as the starting line.
~~~~~~

~~~python
# Fixme: Hack to add our logger to flask server request handler.
WSGIRequestHandler.log_request = hacked_log_request


@WEB_SERVER.route('/_backend/register_splunk', methods=['POST'])
def register_splunk():
    data = request.json
    for data_type in data['data_types']:
        for func in REGISTER_OUTPUT_METHODS:
            func(data['splunk_uri'], data['splunk_username'], data['splunk_password'],
                 data['splunk_index'], data_type['source'], data_type['sourcetype'], int(data['time_range']) * 3600)
    return 'register successfully!'


@WEB_SERVER.route('/post/<int:post_id>')
def show_post(post_id):
    # show the post with the given id, the id is an integer
    return 'Post %d' % post_id
~~~

---

我是脚注[^1]

[^1]: 脚注1

---

我是inline插入的图片：![alt text](/path/img.jpg "Title")
我是引用插入的图片：![alt text][image_id]
[image_id]/url/to/img.jpg "Title"

---

|-----------------+------------+-----------------+----------------|
| Default aligned                          | Left aligned | Center aligned | Right aligned |
| ---------------------------------------- | :----------- | :------------: | ------------: |
| First body part                          | Second cell  |   Third cell   |   fourth cell |
| Second line                              | foo          |   **strong**   |           baz |
| Third line                               | quux         |      baz       |           bar |
| -----------------+------------+-----------------+---------------- |              |                |               |
| Second body                              |              |                |               |
| 2 line                                   |              |                |               |
| =================+============+=================+================ |              |                |               |
| Footer row                               |              |                |               |
| -----------------+------------+-----------------+---------------- |              |                |               |

---

我是定义
: 定义的内容

---
