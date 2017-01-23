---
layout: post
title: "关于Javascript中this的一点思考"
category: Javascript
tags: [心得]
date: 2017-01-23
---

### 问：

下面代码中的`this`指代的是哪个对象？

```javascript
$(document).ready(function(){
    $(".TestCase").click(function (){
      	console.log(this.id);
    });
});
```

答案是不确定。如果这里的`$`是jQuery中的那个变量名，那么`this`指代的是`$(".TestCase")`所选择的对象，否则`this`可能是任意对象。

好吧，我承认上面的回答有点tricky，但我主要想表达的是**JavaScript里面的`this`的绑定是非常灵活的**（关于`this`绑定的规则可查看[Reading <this & Object Prototypes> - 1](/javascript/2016/12/07/Reading-this-&-Object-Prototypes-1)）。

### 实现1

比如以上的`this`绑定为前面选择的对象可以这样实现（`selectedTarget`表示上面的`$(".TestCase")`）：

```javascript
var selectedTarget = {
    id: 'the_id',
    click: function (callback) {
        this._click_callback = callback;
    },
    clickEvent: function () {
        this._click_callback();
    }
};

selectedTarget.click(function (){
    console.log(this.id);
});
```

首先，click函数作为`selectedTarget`对象的一个属性，在其被调用时（即`selectedTarget.click(response);`），click函数中的`this`表示的是调用它的对象，即`selectedTarget`。这里click函数的输入为另一个函数，它会在发生click的事件（这里用`selectedTarget.clickEvent`来代表这个事件接口）时被调用。所以click函数的作用就是绑定了click事件和它对应的回调函数（这里的绑定类似于`this._click_callback = callback;`）。而click的输入的函数中的`this`其实也是指向了`selectedTarget`，因为它被调用时是这一句`this._click_callback();`，已经是作为`selectedTarget`的属性被调用了。

### 实现2

换个思路，可以使用`bind`函数来显示地绑定`this`到目标对象：

```javascript
var selectedTarget = {
    id: 'the_id',
};

function bindClickFunc(callback) {
    this._click_callback = callback;
}

function callClickFunc() {
    this._click_callback();
}

selectedTarget.click = bindClickFunc.bind(selectedTarget);
selectedTarget.clickEvent = callClickFunc.bind(selectedTarget);

selectedTarget.click(function (){
    console.log(this.id);
});
```

使用`bind`的好处是`this`指向的对象被显式表达出来了，代码更容易理解。

### 实现3

以上实现都是把`this`指向了调用者，这里让`this`指向一个无关的对象：

```javascript
var selectedTarget = {
    id: 'the_id',
};

function bindClickFunc(callback) {
    this._click_callback = callback;
}

function callClickFunc() {
    this._click_callback();
}

var anotherObj = {};
selectedTarget.click = bindClickFunc.bind(anotherObj);
selectedTarget.clickEvent = callClickFunc.bind(anotherObj);

selectedTarget.click(function (){
    console.log(this.id);
});
```

### 结论

关于JavaScript里面的`this`到底指向哪个对象，由于其规则非常灵活且被封装后也无法轻易得知它的指向（可以理解为它就是run-time动态的），所以大部分使用的时候只要按照约定俗成的方式去知道这里的this是哪个对象即可（**约定俗成是被调用函数的所属对象和`this`绑定**，即隐式绑定的结果），至于到具体实现才需要考虑怎样绑定this来达到约定俗成的效果，这时候就需要根据它的几个规则来逐一判断了。