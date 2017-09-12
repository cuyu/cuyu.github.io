---
layout: post
title: "关于JavaScript的原型链和继承"
category: Javascript
tags: [原型链,继承]
date: 2017-09-12
---

之前看了《You don't know JS》系列，对原型链这块一直没理解透，这里再探讨下JavaScript中的原型链，以及怎样使用原型链达到类的继承的效果。

## 原型链##

### `__proto__`###

原型链可以理解为一个单向链表，JavaScript中每个对象都拥有一个`__proto__`属性，它指向的就是该对象的原型链（的链表头）。顺着原型链往下找，总是能找到一个链尾，它的值是`null`：

```javascript
var a = {a: 1};
console.log(a.__proto__);  // {}
console.log(a.__proto__.__proto__);  // null

var b = function () {
    return 'b';
};
console.log(b.__proto__);  // [Function]
console.log(b.__proto__.__proto__);  // {}
console.log(b.__proto__.__proto__.__proto__);  // null
```

原型链中的每一个节点都指向了某个对象的原型（prototype），比如接着上面的代码：

```javascript
console.log(a.__proto__ === Object.prototype);  // true
console.log(b.__proto__ === Function.prototype);  // true
console.log(b.__proto__.__proto__ === Object.prototype);  // true

var c = {c: 3};
console.log(c.__proto__ === a.__proto__);  // true
```

可以看到：

- 同一个类型的对象共享同一个原型链（比如上面的`a`和`c`）；
- 不同类型的对象可以共享“某一段”原型链（比如上面的`b.__proto__`和`a`）；

<!--break-->

那么原型链的作用是什么呢？

它的作用和其他语言的类的继承有点像，当调用某个对象的某个属性时，JavaScript编译器会先在该对象本身的属性列表里寻找，如果找到了这个属性就返回，否则继续在它的原型链的第一个节点的属性列表里寻找，找到返回，找不到继续原型链的下一个节点，以此类推，如果找到最后都没找到则返回`undefined`（其他语言一般这种情况是报错，但JavaScript是一门能不报错就不报错的语言）。例子：

```javascript
var d = {d: 4};
var e = {};
e.prototype = {
    d: 5,
    e: 5,
};
d.__proto__ = e.prototype;  // Caution: don't do this out of the example
console.log(d.d);  // 4
console.log(d.e);  // 5
```

而“写”属性则要比“读”复杂一些，大多数情况下会是如下的样子（接着上面的例子）：

```javascript
d.e = 6;
console.log(d);  // { d: 4, e: 6 }
console.log(e.prototype);  // { d: 5, e: 5 }
```

即对该对象的属性进行赋值并不会影响到它的原型链（如果影响了就太可怕了），当所要赋值的属性在原型链中也能找到时，其实会有更复杂的情况的，参考[You don't know JS](http://cuyu.github.io/javascript/2016/12/12/Reading-this-&-Object-Prototypes-3)：

> We will now examine three scenarios for the `myObject.foo = "bar"` assignment when `foo` is **not** already on `myObject` directly, but **is** at a higher level of `myObject`’s `[[Prototype]]` chain:
>
> 1. If a normal data accessor (see Chapter 3) property named `foo` is found anywhere higher on the `[[Prototype]]`chain, **and it’s not marked as read-only (writable:false)** then a new property called `foo` is added directly to `myObject`, resulting in a **shadowed property**.
> 2. If a `foo` is found higher on the `[[Prototype]]` chain, but it’s marked as **read-only (writable:false)**, then both the setting of that existing property as well as the creation of the shadowed property on `myObject` **are disallowed**. If the code is running in `strict mode`, an error will be thrown. Otherwise, the setting of the property value will silently be ignored. Either way, **no shadowing occurs**.
> 3. If a `foo` is found higher on the `[[Prototype]]` chain and it’s a setter (see Chapter 3), then the setter will always be called. No `foo` will be added to (aka, shadowed on) `myObject`, nor will the `foo` setter be redefined.
>
> If you want to shadow `foo` in cases #2 and #3, you cannot use `=` assignment, but must instead use `Object.defineProperty(..)` (see Chapter 3) to add `foo` to `myObject`.

### `prototype`###

对象的`prototype`属性最大的作用就是用于原型链，那么我们应该怎样查看一个对象的`prototype`属性包含了哪些东西呢？

首先，直接打印是不行的（打印的其实是隐式地调用了输入对象的`toString`函数后的结果）：

```javascript
console.log(a.prototype);  // undefined
console.log(Object.prototype);  // {}
```

需要**注意**的是一个对象是可以没有`prototype`属性的，比如上面的`a`。但几乎所有对象（除了`null`、`undefined`）都拥有一个原型链，即`__proto__`属性。

查看属性有个专门的函数叫做`Object.getOwnPropertyNames`，它会返回输入对象本身包含的属性（即输入对象原型链上的属性不算）：

```javascript
console.log(Object.getOwnPropertyNames(Object.prototype));
/*
[ '__defineGetter__',
  '__defineSetter__',
  'hasOwnProperty',
  '__lookupGetter__',
  '__lookupSetter__',
  'propertyIsEnumerable',
  '__proto__',
  'constructor',
  'toString',
  'toLocaleString',
  'valueOf',
  'isPrototypeOf' ]
*/
console.log(Object.getOwnPropertyNames(Function.prototype));
/*
[ 'length',
  'name',
  'arguments',
  'caller',
  'apply',
  'bind',
  'call',
  'toString',
  'constructor' ]
*/
```

以上，就明白了为啥大部分对象都有`toString`函数了，因为它们的原型链上都有`Object.prototype`。

### `new`###

按照字面理解，`new`的作用就是实例化，即根据给定类型，创建对应的实例对象，接下来看看`new`这个关键字究竟干了哪些事情。

首先，`new`的语法是`new constructor[([arguments])]`，其中`constructor`必须是一个函数，这里即构造函数，里面可以传递需要的参数。参考[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new)：

> When the code `new Foo(...)` is executed, the following things happen:
>
> 1. A new object is created, inheriting from `Foo.prototype`.
> 2. The constructor function *Foo* is called with the specified arguments, and with `this` bound to the newly created object. `new Foo` is equivalent to `new Foo()`, i.e. if no argument list is specified, *Foo* is called without arguments.
> 3. The object returned by the constructor function becomes the result of the whole `new` expression. If the constructor function doesn't explicitly return an object, the object created in step 1 is used instead. (Normally constructors don't return a value, but they can choose to do so if they want to override the normal object creation process.)

看一段代码来帮助理解：

```javascript
var f = function () {
    this.f = 'fff';
    console.log('constructed!');
};
var f1 = new f();  // constructed!
console.log(f1.f);  // fff
console.log(f1.__proto__ === f.prototype);  // true
console.log(Object.getOwnPropertyNames(f.prototype));  // [ 'constructor' ]
console.log(f.prototype.constructor === f);  // true
console.log(f1.prototype);  // undefined
```

这里可以看到几个有意思的地方：

- 就像MDN中所述，构造函数被执行了一次，且构造函数中的`this`绑定在了新创建的实例上（换句话说，应该是先创建了一个实例对象，然后绑定了`this`并调用构造函数），且新创建的实例对象的原型链的链头指向了构造函数的原型。
- 一个函数对象在创建了之后就有了`prototype`属性，且其中只包含一个`constructor`属性，该属性指向函数自身。这样设计的好处是，作为实例对象，`f1`可以很容易地知道创建它的构造函数是什么，即`f1.constructor`，否则，根据`f1.__proto__`只能知道创建它的构造函数的原型是什么。
- 新创建的实例对象是一个“干净”的对象，并不像函数对象那样一创建就自带`prototype`属性。

关于MDN中的第三点，即构造函数返回一个值的情况，同样看代码：

```javascript
var g = function () {
    this.a = 1;
    return {g: 'gg'};
};
var g1 = new g();
console.log(g1);  // { g: 'gg' }
console.log(g1.a);  // undefined

var h = function () {
    this.a = 1;
    return 'hh';
};
var h1 = new h();
console.log(h1);  // h { a: 1 }
console.log(h1.a);  // 1
```

从代码来运行的结果来看，情况比较复杂，并不是简单的用返回值取代原本创建的对象，回想下别的语言，比如Python中的构造函数一般也不会去返回一个值（事实上返回一个非`None`的值会报错）。我也并没有想到构造函数中返回一个值的应用场景，因此，**构造函数中尽量不要使用`return`语句**。

### `class`###

ES6新添加的`class`关键字（以及对应的`extends`关键字），其实就是一些语法糖而已，最终还是通过操作原型链来达到的类的实例化和继承的效果。至于它在内部怎么操作的，用Babel做个polyfill就知道了，这里不再赘述。

## 继承##

### 操作原型链###

要实现继承，其实就是对**子类的实例**的原型链做手脚，默认没有继承的情况下，一个类的实例的`__proto__`指向的是该类的原型，之后是该类的原型的`__proto__`，指向的是创建该类的构造函数的原型（大部分情况下即`Function.prototype`），以此类推。所以，对子类的实例的原型链做手脚就相当于对子类的原型做手脚。为了达到继承的效果，需要在子类的实例的原型链中插入父类的原型，具体实现就是让子类的`prototype.__proto__`指向父类的原型：

```javascript
function A() {
    this.a = 1;
}
A.prototype.staticA = 'a';
var instA = new A();
console.log(instA.staticA);  // a

// B inherit A
function B() {
    A.call(this);
    this.b = 2;
}
B.prototype.__proto__ = A.prototype;
var instB = new B();
console.log(instB.staticA);  // a
console.log(instB.__proto__.__proto__ === A.prototype);  // true
console.log(instB.a);  // 1

// C inherit B
function C() {
    B.call(this);
    this.c = 3;
}
C.prototype.__proto__ = B.prototype;
var instC = new C();
console.log(instC.staticA);  // a
console.log(instC.a);  // 1
```

可以看到：

- `prototype`上的属性变量对应到Python中就像是静态成员变量一样是类所有实例所共享的；
- 在构造函数中要调用父类的构造函数来初始化，就像Python中使用`super`一样（ES6也学来了这招）；

### 使用`Object.create`###

上面那种直接对`__proto__`属性进行操作的方式固然可以实现继承的效果，但直接操作`__proto__`总不大好，万一一个操作失误就容易出大问题。

`Object.create`函数的作用是创建一个新的对象，并将该对象的`__proto__`指向输入的对象，它可以接受额外的输入来定义这个新的对象中的其他属性，参考[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)。

使用`Object.create`函数来替代对`__proto__`的操作其实就是这么一句话：

```javascript
B.prototype = Object.create(A.prototype);
```

### 别人家的代码###

最后来看一下别人是怎么做的。在`react-redux`库中可以找到一个`_inherits`函数，长这样：

```javascript
function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}
```

可以看到，它首先对输入的父类对象进行了类型检查，只能是函数或`null`。然后使用`Object.create`函数将父类的原型绑定到了子类的原型链上（之所以用`superClass && superClass.prototype`是为了兼容父类为`null`的情况，因为`null`没有`prototype`属性嘛），并且设置了子类的`prototype.constructor`函数指向子类自身。最后一句比较tricky，其实就是判断了一下父类是否为`null`以及`Object`是否拥有`setPrototypeOf`属性（和`superClass && Object.setPrototypeOf ? ...`有什么区别？），然后分别对不同的情况作了处理。值得注意的是，它并没有做`super`的事情，即在子类的构造函数中仍需要去显式地调用父类的构造函数。

