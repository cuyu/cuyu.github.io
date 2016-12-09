---
layout: post
title: "Reading &lt;this & Object Prototypes&gt; - 2"
category: Javascript
tags: [读书笔记, You Dont Know JS]
date: 2016-12-08
---

## Chapter 3: Objects

> Objects come in two forms: the declarative (literal) form, and the constructed form.
>
> The literal syntax for an object looks like this:
>
> ```javascript
> var myObj = {
>     key: value
>     // ...
> };
> ```
>
> The constructed form looks like this:
>
> ```javascript
> var myObj = new Object();
> myObj.key = value;
> ```

原来Python里面的字典就是JavaScript里面的对象（😆）。文中建议是使用字典式的创建方式，更方便。

------

> **It's a common mis-statement that "everything in JavaScript is an object". This is clearly not true.**

This is why I like Python.

------

> There are several other object sub-types, usually referred to as built-in objects. For some of them, their names seem to imply they are directly related to their simple primitives counter-parts, but in fact, their relationship is more complicated, which we'll explore shortly.
>
> - `String`
> - `Number`
> - `Boolean`
> - `Object`
> - `Function`
> - `Array`
> - `Date`
> - `RegExp`
> - `Error`
>
> These built-ins have the appearance of being actual types, even classes, if you rely on the similarity to other languages such as Java's `String` class.
>
> But in JS, these are actually just built-in functions. Each of these built-in functions can be used as a constructor (that is, a function call with the `new` operator), with the result being a newly *constructed* object of the sub-type in question.

我的问题是`Object`也只是一个内置函数吗？（是的，`Object`是一个函数对象，不但可以调用，还有许多属性。）

------

> The primitive value `"I am a string"` is not an object, it's a primitive literal and immutable value. To perform operations on it, such as checking its length, accessing its individual character contents, etc, a `String` object is required.
>
> Luckily, the language automatically coerces a `"string"` primitive to a `String` object when necessary, which means you almost never need to explicitly create the Object form. It is **strongly preferred** by the majority of the JS community to use the literal form for a value, where possible, rather than the constructed object form.
>
> Consider:
>
> ```javascript
> var strPrimitive = "I am a string";
>
> console.log( strPrimitive.length );         // 13
>
> console.log( strPrimitive.charAt( 3 ) );    // "m"
> ```
>
> In both cases, we call a property or method on a string primitive, and the engine automatically coerces it to a `String`object, so that the property/method access works.

即对`string`、`number`或`boolean`类型调用的任何方法都是会先隐式转换到对应的高级对象再调用其方法。也就是说这几个基本类型是没有任何内置方法的，仅仅根据类型不同划定了不同大小的内存存储而已（类似C++的`int`、`double`、`char`等）。我的问题是，为何不一开始就把这些都定义为高级对象（这设计不会真的是和C++学的吧）？

<!--break-->

------

> To access the value at the *location* `a` in `myObject`, we need to use either the `.` operator or the `[ ]` operator. The `.a`syntax is usually referred to as "property" access, whereas the `["a"]` syntax is usually referred to as "key" access.

区别是`.`用起来更方便，而`[ ]`的适用范围更广（比如属性名称是动态确定的情况，类似Python的`getattr`方法）。

------

> In objects, property names are **always** strings. If you use any other value besides a `string` (primitive) as the property, it will first be converted to a string. This even includes numbers, which are commonly used as array indexes, so be careful not to confuse the use of numbers between objects and arrays.

用数字作为属性名是嫌bug不够多么。。

------

> The `myObject[..]` property access syntax we just described is useful if you need to use a computed expression value *as* the key name, like `myObject[prefix + name]`. But that's not really helpful when declaring objects using the object-literal syntax.
>
> ES6 adds *computed property names*, where you can specify an expression, surrounded by a `[ ]` pair, in the key-name position of an object-literal declaration:
>
> ```javascript
> var prefix = "foo";
>
> var myObject = {
>     [prefix + "bar"]: "hello",
>     [prefix + "baz"]: "world"
> };
>
> myObject["foobar"]; // hello
> myObject["foobaz"]; // world
> ```

用惯了Python字典的特别要注意了，JavaScript的对象属性名称不是run time确定的，只要名称不是`string`（是表达式或要动态确定）就必须套个`[ ]`，比如作为属性名下面的`a`是不会转换成foo的：

```javascript
var a = "foo";
var b = "bar";

var myObject = {
    a: "hello",
    [b]: "world"
};

console.log(myObject["foo"]); // undefined
console.log(myObject["bar"]); // world
console.log(myObject["a"]); // hello
```

之所以有这个规定，是因为JavaScript的字典式创建方式允许属性名为非字符串吧，而允许为非字符串的比较大的好处就是少写两个引号吧。但为了少写两个引号而必须要引入了这样一个规定感觉就有点得不偿失了（况且之中包含了隐式转换也添加了代码的风险）。就这一点我更喜欢Python字典的创建方式。

------

> Every time you access a property on an object, that is a **property access**, regardless of the type of value you get back. If you *happen* to get a function from that property access, it's not magically a "method" at that point. There's nothing special (outside of possible implicit `this` binding as explained earlier) about a function that comes from a property access.

这里说的“method”应该是特指C++那种类中定义的成员函数吧，JavaScript的对象的属性本质上都是指针/引用，因而不同的对象的不同属性是可以指向同一个函数的（而C++或Python的类中定义的方法则不行）。可以理解为JavaScript中并不存在C++那种只属于某个类的方法，对象的所有属性都是指针（这点C++倒也可以做到，这么看JavaScript的对象概念是阉割版的C++/Python的类？）。

------

> **Be careful:** If you try to add a property to an array, but the property name *looks* like a number, it will end up instead as a numeric index (thus modifying the array contents):
>
> ```javascript
> var myArray = [ "foo", 42, "bar" ];
>
> myArray["3"] = "baz";
>
> myArray.length; // 4
>
> myArray[3];     // "baz"
> ```

所以说array的索引是会做一个隐式转换到`number`类型的。

------

> One subset solution is that objects which are JSON-safe (that is, can be serialized to a JSON string and then re-parsed to an object with the same structure and values) can easily be *duplicated* with:
>
> ```javascript
> var newObj = JSON.parse( JSON.stringify( someObj ) );
> ```
>
> Of course, that requires you to ensure your object is JSON safe. For some situations, that's trivial. For others, it's insufficient.
>
> At the same time, a shallow copy is fairly understandable and has far less issues, so ES6 has now defined `Object.assign(..)` for this task. `Object.assign(..)` takes a *target* object as its first parameter, and one or more *source* objects as its subsequent parameters. It iterates over all the *enumerable* (see below), *owned keys* (**immediately present**) on the *source* object(s) and copies them (via `=` assignment only) to *target*. It also, helpfully, returns *target*, as you can see below:
>
> ```javascript
> var newObj = Object.assign( {}, myObject );
> ```

前者（序列化）是深拷贝？待验证。

------

> We can use `Object.defineProperty(..)` to add a new property, or modify an existing one (if it's `configurable`!), with the desired characteristics.
>
> For example:
>
> ```javascript
> var myObject = {};
>
> Object.defineProperty( myObject, "a", {
>     value: 2,
>     writable: true,
>     configurable: true,
>     enumerable: true
> } );
>
> myObject.a; // 2
> ```

原来JavaScript的对象属性还有这么多属性。

------

> #### Writable
>
> The ability for you to change the value of a property is controlled by `writable`.
>
> ```javascript
> "use strict";
>
> var myObject = {};
>
> Object.defineProperty( myObject, "a", {
>     value: 2,
>     writable: false, // not writable!
>     configurable: true,
>     enumerable: true
> } );
>
> myObject.a = 3; // TypeError
> ```
>
> #### Configurable
>
> As long as a property is currently configurable, we can modify its descriptor definition, using the same `defineProperty(..)` utility.
>
> ```javascript
> var myObject = {
>     a: 2
> };
>
> myObject.a = 3;
> myObject.a;                 // 3
>
> Object.defineProperty( myObject, "a", {
>     value: 4,
>     writable: true,
>     configurable: false,    // not configurable!
>     enumerable: true
> } );
>
> myObject.a;                 // 4
> myObject.a = 5;
> myObject.a;                 // 5
>
> Object.defineProperty( myObject, "a", {
>     value: 6,
>     writable: true,
>     configurable: true,
>     enumerable: true
> } ); // TypeError
> ```
>
> Be careful: as you can see, changing `configurable` to `false` is a **one-way action, and cannot be undone!**
>
> **Note:** There's a nuanced exception to be aware of: even if the property is already `configurable:false`, `writable` can always be changed from `true` to `false` without error, but not back to `true` if already `false`.
>
> Another thing `configurable:false` prevents is the ability to use the `delete` operator to remove an existing property.
>
> #### Enumerable
>
> The name probably makes it obvious, but this characteristic controls if a property will show up in certain object-property enumerations, such as the `for..in` loop. Set to `false` to keep it from showing up in such enumerations, even though it's still completely accessible. Set to `true` to keep it present.

Default这三个属性都是true。

------

> #### Prevent Extensions
>
> If you want to prevent an object from having new properties added to it, but otherwise leave the rest of the object's properties alone, call `Object.preventExtensions(..)`:
>
> ```javascript
> var myObject = {
>     a: 2
> };
>
> Object.preventExtensions( myObject );
>
> myObject.b = 3;
> myObject.b; // undefined
> ```
>
> In `non-strict mode`, the creation of `b` fails silently. In `strict mode`, it throws a `TypeError`.
>
> #### Seal
>
> `Object.seal(..)` creates a "sealed" object, which means it takes an existing object and essentially calls `Object.preventExtensions(..)` on it, but also marks all its existing properties as `configurable:false`.
>
> So, not only can you not add any more properties, but you also cannot reconfigure or delete any existing properties (though you *can* still modify their values).
>
> #### Freeze
>
> `Object.freeze(..)` creates a frozen object, which means it takes an existing object and essentially calls `Object.seal(..)` on it, but it also marks all "data accessor" properties as `writable:false`, so that their values cannot be changed.

一些官方帮你封装好的方法。从上至下越来越严格。

------

> ### `[[Get]]`
>
> The default built-in `[[Get]]` operation for an object *first* inspects the object for a property of the requested name, and if it finds it, it will return the value accordingly.
>
> However, the `[[Get]]` algorithm defines other important behavior if it does *not* find a property of the requested name. We will examine in Chapter 5 what happens *next* (traversal of the `[[Prototype]]` chain, if any).
>
> But one important result of this `[[Get]]` operation is that if it cannot through any means come up with a value for the requested property, it instead returns the value `undefined`.
>
> ### `[[Put]]`
>
> When invoking `[[Put]]`, how it behaves differs based on a number of factors, including (most impactfully) whether the property is already present on the object or not.
>
> If the property is present, the `[[Put]]` algorithm will roughly check:
>
> 1. Is the property an accessor descriptor (see "Getters & Setters" section below)? **If so, call the setter, if any.**
> 2. Is the property a data descriptor with `writable` of `false`? **If so, silently fail in non-strict mode, or throw TypeError in strict mode.**
> 3. Otherwise, set the value to the existing property as normal.
>
> If the property is not yet present on the object in question, the `[[Put]]` operation is even more nuanced and complex. We will revisit this scenario in Chapter 5 when we discuss `[[Prototype]]` to give it more clarity.

对应的，Python里面有`__getattr__`、`__getattribute__`以及`__setattr__`这几个方法来处理这两件事情。

------

> ### Getters & Setters
>
> ES5 introduced a way to override part of these default operations, not on an object level but a per-property level, through the use of getters and setters. Getters are properties which actually call a hidden function to retrieve a value. Setters are properties which actually call a hidden function to set a value.
>
> When you define a property to have either a getter or a setter or both, its definition becomes an "accessor descriptor" (as opposed to a "data descriptor"). For accessor-descriptors, the `value` and `writable` characteristics of the descriptor are moot and ignored, and instead JS considers the `set` and `get` characteristics of the property (as well as `configurable` and `enumerable`).
>
> Consider:
>
> ```javascript
> var myObject = {
>     // define a getter for `a`
>     get a() {
>         return 2;
>     }
> };
>
> Object.defineProperty(
>     myObject,   // target
>     "b",        // property name
>     {           // descriptor
>         // define a getter for `b`
>         get: function(){ return this.a * 2 },
>
>         // make sure `b` shows up as an object property
>         enumerable: true
>     }
> );
>
> myObject.a; // 2
>
> myObject.b; // 4
> ```

对象属性粒度的获取/设置属性的方法。所以这里调用`myObject.a`，实际调用的是`myObject.a.get()`？Code talks:

```javascript
var myObject = {
    // define a getter for `a`
    get a() {
        console.log(this);
        return 2;
    }
};

console.log(myObject); // { a: [Getter] }
myObject.a; // { a: [Getter] }
```

如果这里的`this`是隐式绑定的话，这里应该调用的是`myObject.Getter("a")`（`Getter`为一个隐藏的对象方法），然后mapping到了`myObject.a.get`方法。Just like:

```javascript
var myObject = {
    // define a getter for `a`
    a: {
        _get: function () {
            console.log(this);
        },
    },
    init: function () {
        this.Getter = this.a._get; // Some mapping to the attribute 'a' here.
      	delete this.init;
        return this;
    }
}.init();

console.log(myObject);
myObject.Getter('a');
```

如果`this`是显示绑定的话，这里就可能调用的是`myObject.a.get()`了，类似这样：

```javascript
var myObject = {
    // define a getter for `a`
    a: {
        _get: function () {
            console.log(this);
        },
    },
    init: function () {
        delete this.init;
        this.a._get = this.a._get.bind(this);
        return this;
    }
}.init();

console.log(myObject);
myObject.a._get();
```

具体是哪种实现方式，现在还真不好说。

---

> ### Existence
>
> We can ask an object if it has a certain property *without* asking to get that property's value:
>
> ```javascript
> var myObject = {
>     a: 2
> };
>
> ("a" in myObject);              // true
> ("b" in myObject);              // false
>
> myObject.hasOwnProperty( "a" ); // true
> myObject.hasOwnProperty( "b" ); // false
> ```
> The `in` operator will check to see if the property is *in* the object, or if it exists at any higher level of the `[[Prototype]]`chain object traversal (see Chapter 5). By contrast, `hasOwnProperty(..)` checks to see if *only* `myObject` has the property or not, and will *not* consult the `[[Prototype]]` chain.

如果把JavaScript对象看作是Python的字典，用`in`就毫无违和感了，哈哈。

注意`in`和`hasOwnProperty`方法的区别。

高能注意：`in`只能用来检查属性，不能用来检查容器是否拥有某个元素，比如：

```javascript
console.log(4 in [2, 4, 6]); // false
```

高兴的太早，我要的违和感。。

---

> #### Enumeration
>
> `for..in` loops applied to arrays can give somewhat unexpected results, in that the enumeration of an array will include not only all the numeric indices, but also any enumerable properties. It's a good idea to use `for..in` loops *only* on objects, and traditional `for` loops with numeric index iteration for the values stored in arrays.

此处继续高能：

```javascript
var array = [2, 4, 6];
array.len = 3;

for (var i in array) {
    console.log(i);
}
// 0
// 1
// 2
// len
```

---

> ```javascript
> var myObject = { };
>
> Object.defineProperty(
>     myObject,
>     "a",
>     // make `a` enumerable, as normal
>     { enumerable: true, value: 2 }
> );
>
> Object.defineProperty(
>     myObject,
>     "b",
>     // make `b` non-enumerable
>     { enumerable: false, value: 3 }
> );
>
> myObject.propertyIsEnumerable( "a" ); // true
> myObject.propertyIsEnumerable( "b" ); // false
>
> Object.keys( myObject ); // ["a"]
> Object.getOwnPropertyNames( myObject ); // ["a", "b"]
> ```
>
> `propertyIsEnumerable(..)` tests whether the given property name exists *directly* on the object and is also `enumerable:true`.
>
> `Object.keys(..)` returns an array of all enumerable properties, whereas `Object.getOwnPropertyNames(..)` returns an array of *all* properties, enumerable or not.
>
> Whereas `in` vs. `hasOwnProperty(..)` differ in whether they consult the `[[Prototype]]` chain or not, `Object.keys(..)`and `Object.getOwnPropertyNames(..)` both inspect *only* the direct object specified.
>
> There's (currently) no built-in way to get a list of **all properties** which is equivalent to what the `in` operator test would consult (traversing all properties on the entire `[[Prototype]]` chain).

除了`for..in`语句外，`enumerable`属性会影响的函数。

---

> ## Iteration
>
> ES5 also added several iteration helpers for arrays, including `forEach(..)`, `every(..)`, and `some(..)`. Each of these helpers accepts a function callback to apply to each element in the array, differing only in how they respectively respond to a return value from the callback.
>
> `forEach(..)` will iterate over all values in the array, and ignores any callback return values. `every(..)` keeps going until the end *or* the callback returns a `false` (or "falsy") value, whereas `some(..)` keeps going until the end *or* the callback returns a `true` (or "truthy") value.
>
> These special return values inside `every(..)` and `some(..)` act somewhat like a `break` statement inside a normal `for`loop, in that they stop the iteration early before it reaches the end.

我来弄一些例子吧：

```javascript
var array = [2, 4, 6];

array.forEach(function foo(item) {
    console.log(item);
    return item == 4; // Will not break the loop
});
// 2
// 4
// 6

array.every(function foo(item) {
    console.log(item);
    return item == 4; // Break the loop if return false
});
// 2

array.some(function foo(item) {
    console.log(item);
    return item == 4; // Break the loop if return true
});
// 2
// 4
```

---

> What if you want to iterate over the values directly instead of the array indices (or object properties)? Helpfully, ES6 adds a `for..of` loop syntax for iterating over arrays (and objects, if the object defines its own custom iterator):
>
> ```javascript
> var myArray = [ 1, 2, 3 ];
>
> for (var v of myArray) {
>     console.log( v );
> }
> // 1
> // 2
> // 3
> ```
> The `for..of` loop asks for an iterator object (from a default internal function known as `@@iterator` in spec-speak) of the *thing* to be iterated, and the loop then iterates over the successive return values from calling that iterator object's `next()` method, once for each loop iteration.

这波`for..of`总算是和Python的`for..in`相同了吧。

---

> Arrays have a built-in `@@iterator`, so `for..of` works easily on them, as shown. But let's manually iterate the array, using the built-in `@@iterator`, to see how it works:
>
> ```javascript
> var myArray = [ 1, 2, 3 ];
> var it = myArray[Symbol.iterator]();
>
> it.next(); // { value:1, done:false }
> it.next(); // { value:2, done:false }
> it.next(); // { value:3, done:false }
> it.next(); // { done:true }
> ```

所以`Symbol`关键字是用来表示一些隐藏属性的？好处是不会污染对象的命名空间（比如用户也可以设置一个叫`iterator`的属性）？

这里JavaScript里面迭代器是返回了一个对象包含了两个属性`value`和`done`，当`done`为true时表示迭代完成。而Python是通过抛出异常的方式来表示迭代完成，感觉更机智一些（这样就不需要存储中间的状态量了）。

---

>```javascript
>var randoms = {
>    [Symbol.iterator]: function() {
>        return {
>            next: function() {
>                return { value: Math.random() };
>            }
>        };
>    }
>};
>
>var randoms_pool = [];
>for (var n of randoms) {
>    randoms_pool.push( n );
>
>    // don't proceed unbounded!
>    if (randoms_pool.length === 100) break;
>}
>```
> This iterator will generate random numbers "forever", so we're careful to only pull out 100 values so our program doesn't hang.

使对象变成“可迭代的”，只需要添加一个`Symbol.iterator`属性，且这个属性指向一个函数，这个函数返回一个对象（即迭代器），此返回对象包含`next`属性，此`next`属性对应的函数返回一个包含`value`和`done`属性的对象即可。

---

## Chapter 4: Mixing (Up) "Class" Objects

> ### JavaScript "Classes"
>
> Where does JavaScript fall in this regard? JS has had *some* class-like syntactic elements (like `new` and `instanceof`) for quite awhile, and more recently in ES6, some additions, like the `class` keyword (see Appendix A).
>
> But does that mean JavaScript actually *has* classes? Plain and simple: **No.**
>
> Syntactic sugar and (extremely widely used) JS "Class" libraries go a long way toward hiding this reality from you, but sooner or later you will face the fact that the *classes* you have in other languages are not like the "classes" you're faking in JS.

原来JavaScript的`class`关键字也仅仅是一个语法糖而已？

---

> ### Explicit Mixins
>
> Let's again revisit our `Vehicle` and `Car` example from before. Since JavaScript will not automatically copy behavior from `Vehicle` to `Car`, we can instead create a utility that manually copies. Such a utility is often called `extend(..)` by many libraries/frameworks, but we will call it `mixin(..)` here for illustrative purposes.
>
> ```javascript
> // vastly simplified `mixin(..)` example:
> function mixin( sourceObj, targetObj ) {
>     for (var key in sourceObj) {
>         // only copy if not already present
>         if (!(key in targetObj)) {
>             targetObj[key] = sourceObj[key];
>         }
>     }
>
>     return targetObj;
> }
>
> var Vehicle = {
>     engines: 1,
>
>     ignition: function() {
>         console.log( "Turning on my engine." );
>     },
>
>     drive: function() {
>         this.ignition();
>         console.log( "Steering and moving forward!" );
>     }
> };
>
> var Car = mixin( Vehicle, {
>     wheels: 4,
>
>     drive: function() {
>         Vehicle.drive.call( this );
>         console.log( "Rolling on all " + this.wheels + " wheels!" );
>     }
> } );
> ```
>
> **Note:** Subtly but importantly, we're not dealing with classes anymore, because there are no classes in JavaScript. `Vehicle` and `Car` are just objects that we make copies from and to, respectively.

这段代码通过浅拷贝把`Vehicle`对象中的部分属性复制到了`Car`对象中，看上去就像是类的继承一样（然而并没法从子类调用父类的同名方法）。

作者有一点说的很有道理，所谓类的概念，其实也是一种设计模式而已，类的实例化、继承乃至多态本质上都是通过复制操作来实现的（**Classes mean copies.**）（比如说继承可以看成是子类复制了父类的所有成员变量和方法，再通过一些规则让某些父类方法无法被直接调用（重载、覆盖））。

---

> **If it starts to get harder to properly use mixins than before you used them**, you should probably stop using mixins. In fact, if you have to use a complex library/utility to work out all these details, it might be a sign that you're going about it the harder way, perhaps unnecessarily.

大道至简。

---

> #### Parasitic Inheritance
>
> A variation on this explicit mixin pattern, which is both in some ways explicit and in other ways implicit, is called "parasitic inheritance", popularized mainly by Douglas Crockford.
>
> Here's how it can work:
>
> ```javascript
> // "Traditional JS Class" `Vehicle`
> function Vehicle() {
>     this.engines = 1;
> }
> Vehicle.prototype.ignition = function() {
>     console.log( "Turning on my engine." );
> };
> Vehicle.prototype.drive = function() {
>     this.ignition();
>     console.log( "Steering and moving forward!" );
> };
>
> // "Parasitic Class" `Car`
> function Car() {
>     // first, `car` is a `Vehicle`
>     var car = new Vehicle();
>
>     // now, let's modify our `car` to specialize it
>     car.wheels = 4;
>
>     // save a privileged reference to `Vehicle::drive()`
>     var vehDrive = car.drive;
>
>     // override `Vehicle::drive()`
>     car.drive = function() {
>         vehDrive.call( this );
>         console.log( "Rolling on all " + this.wheels + " wheels!" );
>     };
>
>     return car;
> }
>
> var myCar = new Car();
>
> myCar.drive();
> // Turning on my engine.
> // Steering and moving forward!
> // Rolling on all 4 wheels!
> ```

这段代码是之前的一个变形，主要区别是子类可以通过`new`来创建了，看上去就和类的实例化一样（同样都是复制操作嘛）。

---

> ### Implicit Mixins
>
> Implicit mixins are closely related to *explicit pseudo-polymorphism* as explained previously. As such, they come with the same caveats and warnings.
>
> Consider this code:
>
> ```javascript
> var Something = {
>     cool: function() {
>         this.greeting = "Hello World";
>         this.count = this.count ? this.count + 1 : 1;
>     }
> };
>
> Something.cool();
> Something.greeting; // "Hello World"
> Something.count; // 1
>
> var Another = {
>     cool: function() {
>         // implicit mixin of `Something` to `Another`
>         Something.cool.call( this );
>     }
> };
>
> Another.cool();
> Another.greeting; // "Hello World"
> Another.count; // 1 (not shared state with `Something`)
> ```

所谓“隐式”是说我可以选择性地混入其他对象的部分属性？

---

> Classes are a design pattern. Many languages provide syntax which enables natural class-oriented software design. JS also has a similar syntax, but it behaves **very differently** from what you're used to with classes in those other languages.
>
> **Classes mean copies.**
>
> When traditional classes are instantiated, a copy of behavior from class to instance occurs. When classes are inherited, a copy of behavior from parent to child also occurs.
>
> Polymorphism (having different functions at multiple levels of an inheritance chain with the same name) may seem like it implies a referential relative link from child back to parent, but it's still just a result of copy behavior.
>
> JavaScript **does not automatically** create copies (as classes imply) between objects.
>
> The mixin pattern (both explicit and implicit) is often used to *sort of* emulate class copy behavior, but this usually leads to ugly and brittle syntax like explicit pseudo-polymorphism (`OtherObj.methodName.call(this, ...)`), which often results in harder to understand and maintain code.
>
> Explicit mixins are also not exactly the same as class *copy*, since objects (and functions!) only have shared references duplicated, not the objects/functions duplicated themselves. Not paying attention to such nuance is the source of a variety of gotchas.
>
> In general, faking classes in JS often sets more landmines for future coding than solving present *real* problems.

这段总结必须都摘过来！