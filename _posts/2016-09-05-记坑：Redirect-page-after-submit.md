---
layout: post
title: "记坑：Redirect page after submit"
category: Web
tags: [Flask, jQuery, 坑]
date: 2016-09-05
---

### 坑

写了一个表单页面，想要用户点击完提价按钮后跳转到另外一个页面。这个按钮的js就是一个简单的ajax请求：

```javascript
    $("#register").click(function (event) {
      	event.preventDefault();
        var request = $.ajax({
            url: "/_backend/register",
            type: 'POST',
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                output_method: $("#output_method").val(),
                send_speed: $("#send_speed").val(),
                receive_email: $("#receive_email").val()
            })
        });
    });
```

后端是Flask写的，大概是这样的：

```python
@app.route('/_backend/register', methods=['POST'])
def register_splunk():
    data = request.json
    user_id = session.get('user_id')
    task_id = str(time.time()).replace('.', '')
    target_context = {'send_speed': int(data['send_speed']), 'receive_email': data['receive_email']}
    SERVICE.create_task(task_id, task_script_name=data['output_method'], task_interval=-1,
                             other_context=target_context, production_task=False)
    return redirect(url_for('/task_details/{0}'.format(task_id)))
```

然而实际运行时并没有发生页面跳转，而是点击完提交按钮后什么都没有发生（因为添加了`event.preventDefault()`）。

<!--break-->

### Reason

可以简单分析下上述代码运行时，点击提交按钮的过程应该是这样的：

1. 用户点击提交按钮，触发js中对应的事件处理，也就是上述我们写的ajax请求；
2. ajax请求会把填好的数据发送到后端的`/_backend/register`路径，后端对此路径的处理函数来handle这个请求；
3. 后端对`/_backend/register`的处理函数处理完毕后，经过`redirect`函数把这个请求交给`/task_details/xxx`路径的处理函数来继续处理；
4. `/task_details/xxx`路径的处理函数处理完毕后，返回该路径的渲染页面。

OK，前面看上去都没有问题，问题在于最后一步后端返回的内容并没有到达浏览器端，而是返回到了js的代码中，而在我js代码并没有对这个返回值作任何处理！

### Solution

#### Solution 1

在js代码中将server的返回值发送给浏览器：

```javascript
request.done(function (data) {
  	document.documentElement.innerHTML = data.responseText;
});
```

#### Solution 2

不使用js，而直接通过`<form>`的action属性来直接把表单送答到server端，从而使server端的返回值也可以直接到达浏览器端：

```html
<form action="{{ url_for('about') }}" method="POST">
    <label for="outputMethod">Output Method</label>
    <select id="outputMethod">
        <option value="output1">Output1</option>
        <option value="output2">Output2</option>
    </select>
    <label for="sendSpeed">Send Speed</label>
    <input type=number id="sendSpeed" min="0"/>
    <label for="receiveEmail">Receive Email</label>
    <select id="receiveEmail">
        <option value="yes">Yes</option>
        <option value="no">No</option>
    </select>
    <button type="submit">Submit</button>
</form>
```

这个方法的好处就是不需要写js，但在必须要写js的场景下这个方法就没用了。

值得注意的是，利用这个方法还可以对一些非表单按钮绑定POST操作，即把`<input>`改为`hidden`的并使其value在渲染html页面时就生成即可。比如：

```html
<form action="{{ url_for('stop_task') }}" method="POST">
    <input type="text" name="task_id" value="{{ task_info.task_id }}" hidden="true"/>
    <button type="submit" id="stop_the_task">Stop</button>
</form>
```

上述使用了template来对task_id信息进行填充，使得每个button可以绑定不同的input值，从而也实现了某种意义上的"动态"提交表单的功能。

#### Solution 3

把redirect操作从server端移到js代码里，server端只需要返回redirect的url的信息：

```javascript
request.done(function (data) {
  	window.location.assign("task_details/"+data);
});
```

这里需要**注意**的是js中的redirect和Flask的redirect做的事情其实不一样。js中的redirect，实际上是在HTTP请求中的添加了`location`的 header而已，把这个请求返回给浏览器，浏览器会根据这个header来跳转到指定url（之后还是会交给后端server的相应handler来处理这个url）。而Flask中的redirect是直接调用了要跳转的url的handler函数，并返回它的返回值，也就跳过了浏览器跳转的步骤。