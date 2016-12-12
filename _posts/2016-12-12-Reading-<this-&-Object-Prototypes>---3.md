---
layout: post
title: "Reading &lt;this & Object Prototypes&gt; - 3"
category: Javascript
tags: [读书笔记, You Dont Know JS]
date: 2016-12-12
---

## Chapter 5: Prototypes

> Objects in JavaScript have an internal property, denoted in the specification as `[[Prototype]]`, which is simply a reference to another object. Almost all objects are given a non-`null` value for this property, at the time of their creation.

有点像子类和父类的那种联系嘛。

---

> The default `[[Get]]` operation proceeds to follow the `[[Prototype]]` **link** of the object if it cannot find the requested property on the object directly.
>
> ```javascript
> var anotherObject = {
>     a: 2
> };
>
> // create an object linked to `anotherObject`
> var myObject = Object.create( anotherObject );
>
> myObject.a; // 2
> ```

同样类似于从子类向父类寻找某个成员的过程。

---

> The top-end of every *normal* `[[Prototype]]` chain is the built-in `Object.prototype`. This object includes a variety of common utilities used all over JS, because all normal (built-in, not host-specific extension) objects in JavaScript "descend from" (aka, have at the top of their `[[Prototype]]` chain) the `Object.prototype` object.

类似Python所有新式类都有一个共同的基类`object`，而`object`也提供了一些基本的方法供缺省时调用。

---

> ```javascript
> myObject.foo = "bar";
> ```
>
> If the property name `foo` ends up both on `myObject` itself and at a higher level of the `[[Prototype]]` chain that starts at `myObject`, this is called *shadowing*. The `foo` property directly on `myObject` *shadows* any `foo` property which appears higher in the chain, because the `myObject.foo` look-up would always find the `foo` property that's lowest in the chain.

类似子类成员对父类成员的覆盖。

---

> As we just hinted, shadowing `foo` on `myObject` is not as simple as it may seem. We will now examine three scenarios for the `myObject.foo = "bar"` assignment when `foo` is **not** already on `myObject` directly, but **is** at a higher level of `myObject`'s `[[Prototype]]` chain:
>
> 1. If a normal data accessor (see Chapter 3) property named `foo` is found anywhere higher on the `[[Prototype]]`chain, **and it's not marked as read-only (writable:false)** then a new property called `foo` is added directly to `myObject`, resulting in a **shadowed property**.
> 2. If a `foo` is found higher on the `[[Prototype]]` chain, but it's marked as **read-only (writable:false)**, then both the setting of that existing property as well as the creation of the shadowed property on `myObject` **are disallowed**. If the code is running in `strict mode`, an error will be thrown. Otherwise, the setting of the property value will silently be ignored. Either way, **no shadowing occurs**.
> 3. If a `foo` is found higher on the `[[Prototype]]` chain and it's a setter (see Chapter 3), then the setter will always be called. No `foo` will be added to (aka, shadowed on) `myObject`, nor will the `foo` setter be redefined.
>
> If you want to shadow `foo` in cases #2 and #3, you cannot use `=` assignment, but must instead use `Object.defineProperty(..)` (see Chapter 3) to add `foo` to `myObject`.

这就比子类成员覆盖父类成员要复杂很多了。

<!--break-->

---

> Shadowing with **methods** leads to ugly *explicit pseudo-polymorphism* (see Chapter 4) if you need to delegate between them. Usually, shadowing is more complicated and nuanced than it's worth, **so you should try to avoid it if possible**.

既然作者都这么说了。。

---

> Shadowing can even occur implicitly in subtle ways, so care must be taken if trying to avoid it. Consider:
>
> ```javascript
> var anotherObject = {
>     a: 2
> };
>
> var myObject = Object.create( anotherObject );
>
> anotherObject.a; // 2
> myObject.a; // 2
>
> anotherObject.hasOwnProperty( "a" ); // true
> myObject.hasOwnProperty( "a" ); // false
>
> myObject.a++; // oops, implicit shadowing!
>
> anotherObject.a; // 2
> myObject.a; // 3
>
> myObject.hasOwnProperty( "a" ); // true
> ```

我倒觉得这种情况挺合理的，不然如果改变`myObject.a`的值导致`anotherObject.a`也发生改变就更容易出问题了。

---

> In fact, JavaScript is **almost unique** among languages as perhaps the only language with the right to use the label "object oriented", because it's one of a very short list of languages where an object can be created directly, without a class at all.
>
> In JavaScript, classes can't (being that they don't exist!) describe what an object can do. The object defines its own behavior directly. **There's just the object.**

所以一直以来我们都说错了么？只有JavaScript能称作“面向对象”编程，其他语言都只是“面向类”么。

---

> The peculiar "sort-of class" behavior hinges on a strange characteristic of functions: all functions by default get a public, non-enumerable (see Chapter 3) property on them called `prototype`, which points at an otherwise arbitrary object.
>
> ```javascript
> function Foo() {
>     // ...
> }
>
> Foo.prototype; // { }
> ```
>
> This object is often called "Foo's prototype", because we access it via an unfortunately-named `Foo.prototype`property reference. However, that terminology is hopelessly destined to lead us into confusion, as we'll see shortly. Instead, I will call it "the object formerly known as Foo's prototype". Just kidding. How about: "object arbitrarily labeled 'Foo dot prototype'"?
>
> The most direct way to explain it is that each object created from calling `new Foo()` (see Chapter 2) will end up (somewhat arbitrarily) `[[Prototype]]`-linked to this "Foo dot prototype" object.

这个地方确实比较confusing，因为每个对象还有一个隐藏的属性`[[prototype]]`（可以通过`Object.getPrototypeOf()`获取），这两者不是同一个东西，`prototype`是非隐藏的属性，且只有函数对象才有这个属性。这两者的联系就是上面所说的，通过`new`产生的对象的`[[prototype]]`属性指向了产生它的函数的`prototype`属性。

而所有函数对象的`[[prototype]]`指向了同一个对象，也就是说产生所有函数对象的函数是同一个？

```javascript
function Foo() {
    var a = 1;
}

function Bar() {
    var b = 2;
}

console.log(Object.getPrototypeOf(Foo) === Object.getPrototypeOf(Bar)); // true
```

---

> ```javascript
> function Foo() {
>     // ...
> }
>
> var a = new Foo();
>
> Object.getPrototypeOf( a ) === Foo.prototype; // true
> ```
>
> In class-oriented languages, multiple **copies** (aka, "instances") of a class can be made, like stamping something out from a mold. As we saw in Chapter 4, this happens because the process of instantiating (or inheriting from) a class means, "copy the behavior plan from that class into a physical object", and this is done again for each new instance.
>
> But in JavaScript, there are no such copy-actions performed. You don't create multiple instances of a class. You can create multiple objects that `[[Prototype]]` *link* to a common object. But by default, no copying occurs, and thus these objects don't end up totally separate and disconnected from each other, but rather, quite **linked**.
>
> `new Foo()` results in a new object (we called it `a`), and **that** new object `a` is internally `[[Prototype]]` linked to the `Foo.prototype` object.
>
> **We end up with two objects, linked to each other.** That's *it*. We didn't instantiate a class. We certainly didn't do any copying of behavior from a "class" into a concrete object. We just caused two objects to be linked to each other.
>
> In fact, the secret, which eludes most JS developers, is that the `new Foo()` function calling had really almost nothing *direct* to do with the process of creating the link. **It was sort of an accidental side-effect.** `new Foo()` is an indirect, round-about way to end up with what we want: **a new object linked to another object**.

JavaScript里的`new`操作看上去就和实例化一样，但他们生成新的对象的过程是不一样的，JavaScript是凭空先生成一个空的对象，再把这个对象放到生成它的函数（绑定到`this`）中执行，同时与这个函数产生了联系（`[[prototype]]`指向函数的`prototype`属性）；而实例化是根据类的定义来复制出一个新的对象，生成完新的对象后，生成它的类和实例化的对象就没有什么联系了（考虑到静态变量和方法，它们有可能还是有联系的）。

---

> I like to say that sticking "prototypal" in front "inheritance" to drastically reverse its actual meaning is like holding an orange in one hand, an apple in the other, and insisting on calling the apple a "red orange". No matter what confusing label I put in front of it, that doesn't change the *fact* that one fruit is an apple and the other is an orange.
>
> The better approach is to plainly call an apple an apple -- to use the most accurate and direct terminology. That makes it easier to understand both their similarities and their **many differences**, because we all have a simple, shared understanding of what "apple" means.
>
> Because of the confusion and conflation of terms, I believe the label "prototypal inheritance" itself (and trying to mis-apply all its associated class-orientation terminology, like "class", "constructor", "instance", "polymorphism", etc) has done **more harm than good** in explaining how JavaScript's mechanism *really* works.
>
> "Inheritance" implies a *copy* operation, and JavaScript doesn't copy object properties (natively, by default). Instead, JS creates a link between two objects, where one object can essentially *delegate* property/function access to another object. "Delegation" (see Chapter 6) is a much more accurate term for JavaScript's object-linking mechanism.

🍎和🍊的比喻很贴切。作为从C++或Python过来的人，确实很容易把JavaScript的许多特性联系到之前学到的知识上去，所以有confusing是很正常的啊。

---

> ```javascript
> function Foo() {
>     // ...
> }
>
> Foo.prototype.constructor === Foo; // true
>
> var a = new Foo();
> a.constructor === Foo; // true
> ```
>
> **Note:** This is not actually true. `a` has no `.constructor` property on it, and though `a.constructor` does in fact resolve to the `Foo` function, "constructor" **does not actually mean** "was constructed by", as it appears.

实验一下就清楚了：

```javascript
function Foo() {
    // ...
}

var a = new Foo();

console.log(a.hasOwnProperty('constructor')); // false
console.log(Foo.prototype.hasOwnProperty('constructor')); // true

var b = Object.create(Foo.prototype);

console.log(b); // Foo {}
console.log(a); // Foo {}
```

结论：

1. `a.constructor`其实得到的是它的`[[prototype]]`（也就是`Foo.prototype`）的`constructor`属性。

2. `new Foo()`的行为应该和`Object.create(Foo.prototype)`效果相同？答案是不完全一样，后者仅仅是把对象的`[[prototype]]`属性连接到了`Foo.prototype`，而前者除此之外还会执行Foo函数体内的代码等（见Chapter 2关于`new`机制的描述）。比如：

   ```javascript
   function Foo() {
       this.a = 123;
   }

   foo1 = new Foo();
   foo2 = Object.create(Foo.prototype);

   console.log(foo1); // Foo { a: 123 }
   console.log(foo2); // Foo {}
   ```

   ```javascript
   function Foo() {
       return {a: 123};
   }

   foo1 = new Foo();
   foo2 = Object.create(Foo.prototype);

   console.log(foo1); // Foo { a: 123 }
   console.log(foo2); // Foo {}
   ```

3. 如果从类的角度来看（好吧，我还是忍不住这么想），`new`的作用其实是可以看作是以`Foo.prototype`为父类对象，生成了`a`这个子类对象（父类对象生成子类对象也是蛮玄幻的）。

4. 对象的`constructor`属性不一定表示创建它的对象，有可能是创建它的对象（原型）的对象，etc.。

---

> In JavaScript, it's most appropriate to say that a "constructor" is **any function called with the `new` keyword** in front of it.
>
> Functions aren't constructors, but function calls are "constructor calls" if and only if `new` is used.

---

> Consider:
>
> ```javascript
> function Foo() { /* .. */ }
>
> Foo.prototype = { /* .. */ }; // create a new prototype object
>
> var a1 = new Foo();
> a1.constructor === Foo; // false!
> a1.constructor === Object; // true!
> ```
>
> What's happening? `a1` has no `.constructor` property, so it delegates up the `[[Prototype]]` chain to `Foo.prototype`. But that object doesn't have a `.constructor` either (like the default `Foo.prototype` object would have had!), so it keeps delegating, this time up to `Object.prototype`, the top of the delegation chain. *That* object indeed has a `.constructor`on it, which points to the built-in `Object(..)` function.

一些有趣的实验：

```javascript
var a = new Object();
var b = {};

console.log(Object.getOwnPropertyNames(a)); // []
console.log(Object.getOwnPropertyNames(b)); // []

console.log(Object.getPrototypeOf(a) === Object.prototype); // true
console.log(Object.prototype); // {}

console.log(Object.getOwnPropertyNames(Object.prototype));
// [ '__defineGetter__',
//     '__defineSetter__',
//     'hasOwnProperty',
//     '__lookupGetter__',
//     '__lookupSetter__',
//     'propertyIsEnumerable',
//     'constructor',
//     'toString',
//     'toLocaleString',
//     'valueOf',
//     'isPrototypeOf',
//     '__proto__' ]
```

所以：

1. 任何对象原型链的顶端都是`Object.prototype`（即`Object`函数对象的`prototype`属性）。
2. 空对象`{}`等价于用`Object`函数`new`一个对象。
3. `Object.prototype`看上去是一个空对象（因为它的`valueOf`返回的是`{}`），但其实并不是，它包含了很多属性，这些属性也就是大部分对象即使没有定义都可以调用的属性/方法。（所以`Object.prototype`就像是Python的`object`咯？）

---

> The fact is, `.constructor` on an object arbitrarily points, by default, at a function who, reciprocally, has a reference back to the object -- a reference which it calls `.prototype`. The words "constructor" and "prototype" only have a loose default meaning that might or might not hold true later. The best thing to do is remind yourself, "constructor does not mean constructed by".
>
> `.constructor` is not a magic immutable property. It *is* non-enumerable (see snippet above), but its value is writable (can be changed), and moreover, you can add or overwrite (intentionally or accidentally) a property of the name `constructor` on any object in any `[[Prototype]]` chain, with any value you see fit.

总之一句话，避免使用`constructor`这个属性。

---

> And, here's the typical "prototype style" code that creates such links:
>
> ```javascript
> function Foo(name) {
>     this.name = name;
> }
>
> Foo.prototype.myName = function() {
>     return this.name;
> };
>
> function Bar(name,label) {
>     Foo.call( this, name );
>     this.label = label;
> }
>
> // here, we make a new `Bar.prototype`
> // linked to `Foo.prototype`
> Bar.prototype = Object.create( Foo.prototype );
>
> // Beware! Now `Bar.prototype.constructor` is gone,
> // and might need to be manually "fixed" if you're
> // in the habit of relying on such properties!
>
> Bar.prototype.myLabel = function() {
>     return this.label;
> };
>
> var a = new Bar( "a", "obj a" );
>
> a.myName(); // "a"
> a.myLabel(); // "obj a"
> ```

这里强行让`a`的原型链变成了`a` => `Bar.prototype` => `Foo.prototype`，从而看上去`Bar`就像是继承自`Foo`一样。但是我想说，JavaScript里面并没有类的概念好么，`a`、`Bar`、`Foo`的类型都是对象，并没有什么本质上的区别。所以就像作者所说，不要去想什么继承，这里就是原型链，当然，你可以用继承的概念来理解原型链。

---

> It would be *nice* if there was a standard and reliable way to modify the linkage of an existing object. Prior to ES6, there's a non-standard and not fully-cross-browser way, via the `.__proto__` property, which is settable. ES6 adds a `Object.setPrototypeOf(..)` helper utility, which does the trick in a standard and predictable way.
>
> Compare the pre-ES6 and ES6-standardized techniques for linking `Bar.prototype` to `Foo.prototype`, side-by-side:
>
> ```javascript
> // pre-ES6
> // throws away default existing `Bar.prototype`
> Bar.prototype = Object.create( Foo.prototype );
>
> // ES6+
> // modifies existing `Bar.prototype`
> Object.setPrototypeOf( Bar.prototype, Foo.prototype );
> ```

---

> How do we then introspect `a` to find out its "ancestry" (delegation linkage)? The first approach embraces the "class" confusion:
>
> ```javascript
> a instanceof Foo; // true
> ```
>
> The `instanceof` operator takes a plain object as its left-hand operand and a **function** as its right-hand operand. The question `instanceof` answers is: **in the entire [[Prototype]] chain of a, does the object arbitrarily pointed to by Foo.prototype ever appear?**

从原型链的角度来解释是最准确的，不要被`instance`这个词给迷惑了。

---

> ```javascript
> Foo.prototype.isPrototypeOf( a ); // true
> ```
>
> Notice that in this case, we don't really care about (or even *need*) `Foo`, we just need an **object** (in our case, arbitrarily labeled `Foo.prototype`) to test against another **object**. The question `isPrototypeOf(..)` answers is: **in the entire [[Prototype]] chain of a, does Foo.prototype ever appear?**

反正这些都从原型链的角度来理解就对了。

---

> Roughly, we could envision `.__proto__` implemented (see Chapter 3 for object property definitions) like this:
>
> ```javascript
> Object.defineProperty( Object.prototype, "__proto__", {
>     get: function() {
>         return Object.getPrototypeOf( this );
>     },
>     set: function(o) {
>         // setPrototypeOf(..) as of ES6
>         Object.setPrototypeOf( this, o );
>         return o;
>     }
> } );
> ```

所以，调用某个对象的`__proto__`属性，其实是先通过原型链调用到了`Object.__proto__`属性，由于此属性定义了set/get方法，使调用的这个对象和这些方法中的`this`绑定了，从而看上去就像是`__proto__`属于这个对象一样。这种模式挺有意思！

---

> Some developers take a much stricter view, which is that no function should be polyfilled unless it can be *fully* polyfilled. Since `Object.create(..)` is one of those partial-polyfill'able utilities, this narrower perspective says that if you need to use any of the functionality of `Object.create(..)` in a pre-ES5 environment, instead of polyfilling, you should use a custom utility, and stay away from using the name `Object.create` entirely.
>
> I do not share this strict opinion. I fully endorse the common partial-polyfill of `Object.create(..)` as shown above, and using it in your code even in pre-ES5.

partial-polyfill'able的意思是在某些特定情况下没法polyfill（感觉要考虑兼容性好麻烦啊）。

---

## Chapter 6: Behavior Delegation

> ```javascript
> var Task = {
>     setID: function(ID) { this.id = ID; },
>     outputID: function() { console.log( this.id ); }
> };
>
> // make `XYZ` delegate to `Task`
> var XYZ = Object.create( Task );
>
> XYZ.prepareTask = function(ID,Label) {
>     this.setID( ID );
>     this.label = Label;
> };
>
> XYZ.outputTaskDetails = function() {
>     this.outputID();
>     console.log( this.label );
> };
>
> // ABC = Object.create( Task );
> // ABC ... = ...
> ```
>
> As compared to class-orientation (aka, OO -- object-oriented), I call this style of code **"OLOO"** (objects-linked-to-other-objects). All we *really* care about is that the `XYZ` object delegates to the `Task` object (as does the `ABC` object).
>
> In JavaScript, the `[[Prototype]]` mechanism links **objects** to other **objects**. There are no abstract mechanisms like "classes", no matter how much you try to convince yourself otherwise. It's like paddling a canoe upstream: you *can* do it, but you're *choosing* to go against the natural current, so it's obviously **going to be harder to get where you're going.**
>
> Some other differences to note with **OLOO style code**:
>
> 1. Both `id` and `label` data members from the previous class example are data properties directly on `XYZ` (neither is on `Task`). In general, with `[[Prototype]]` delegation involved, **you want state to be on the delegators** (`XYZ`, `ABC`), not on the delegate (`Task`).
>
> 2. With the class design pattern, we intentionally named `outputTask` the same on both parent (`Task`) and child (`XYZ`), so that we could take advantage of overriding (polymorphism). In behavior delegation, we do the opposite: **we avoid if at all possible naming things the same** at different levels of the `[[Prototype]]` chain (called shadowing -- see Chapter 5), because having those name collisions creates awkward/brittle syntax to disambiguate references (see Chapter 4), and we want to avoid that if we can.
>
>    This design pattern calls for less of general method names which are prone to overriding and instead more of descriptive method names, *specific* to the type of behavior each object is doing. **This can actually create easier to understand/maintain code**, because the names of methods (not only at definition location but strewn throughout other code) are more obvious (self documenting).
>
> 3. `this.setID(ID);` inside of a method on the `XYZ` object first looks on `XYZ` for `setID(..)`, but since it doesn't find a method of that name on `XYZ`, `[[Prototype]]` *delegation* means it can follow the link to `Task` to look for `setID(..)`, which it of course finds. Moreover, because of implicit call-site `this` binding rules (see Chapter 2), when `setID(..)` runs, even though the method was found on `Task`, the `this` binding for that function call is `XYZ`exactly as we'd expect and want. We see the same thing with `this.outputID()` later in the code listing.
>
>    In other words, the general utility methods that exist on `Task` are available to us while interacting with `XYZ`, because `XYZ` can delegate to `Task`.

尤其注意这里说的和OO的思想不同的几点：

1. “基对象”（或者叫原型对象吧）不存储状态量（因为类的实例化是复制，本质上状态量也是绑定在子类对象上的））。
2. “子对象”属性不要和“基对象”属性同名（即避免shadowing，OO里叫覆盖或重载）。
3. “基对象”方法通过“子对象”方法内部调用来使用（避免直接用“子对象”调用“基对象”方法，OO里的继承）。

---

> **Behavior Delegation** means: let some object (`XYZ`) provide a delegation (to `Task`) for property or method references if not found on the object (`XYZ`).
>
> This is an *extremely powerful* design pattern, very distinct from the idea of parent and child classes, inheritance, polymorphism, etc. Rather than organizing the objects in your mind vertically, with Parents flowing down to Children, think of objects side-by-side, as peers, with any direction of delegation links between the objects as necessary.

因为没有复制的行为，所以JavaScript里面利用原型链时要注意不能改变这条链上的其他对象，定下这些规则（模式）也是为了防止出现这种情况吧。

---

> You cannot create a *cycle* where two or more objects are mutually delegated (bi-directionally) to each other.
>
> It's disallowed because engine implementors have observed that it's more performant to check for (and reject!) the infinite circular reference once at set-time rather than needing to have the performance hit of that guard check every time you look-up a property on an object.

类似Python的circulate import么。

---

> We'll examine some more theoretical ("Foo", "Bar") code, and compare both ways (OO vs. OLOO) of implementing the code. The first snippet uses the classical ("prototypal") OO style:
>
> ```javascript
> function Foo(who) {
>     this.me = who;
> }
> Foo.prototype.identify = function() {
>     return "I am " + this.me;
> };
>
> function Bar(who) {
>     Foo.call( this, who );
> }
> Bar.prototype = Object.create( Foo.prototype );
>
> Bar.prototype.speak = function() {
>     alert( "Hello, " + this.identify() + "." );
> };
>
> var b1 = new Bar( "b1" );
> var b2 = new Bar( "b2" );
>
> b1.speak();
> b2.speak();
> ```
>
> Now, let's implement **the exact same functionality** using *OLOO* style code:
>
> ```javascript
> var Foo = {
>     init: function(who) {
>         this.me = who;
>     },
>     identify: function() {
>         return "I am " + this.me;
>     }
> };
>
> var Bar = Object.create( Foo );
>
> Bar.speak = function() {
>     alert( "Hello, " + this.identify() + "." );
> };
>
> var b1 = Object.create( Bar );
> b1.init( "b1" );
> var b2 = Object.create( Bar );
> b2.init( "b2" );
>
> b1.speak();
> b2.speak();
> ```

第一种实现定义了“类”（函数对象的prototype属性），使用原型链来模拟了继承，并用`new`来“实例化”。

第二种实现则只使用了原型链，原型链下层对象对上层对象方法进行封装，而“实例”则置于原型链最底层，并通过显式地初始化方法来设置属性。

方案一看上去和方案二完全不一样，其实本质上是一样的，即利用原型链使多个对象产生联系，形成了类似继承和实例化的关系（但方案一用到了函数对象使得这种联系比方案二还要复杂一些，也因此有一些坑，所以作者强烈推荐使用OLOO的模式）。

---

> As of ES6, we can use *concise method declarations* in any object literal, so an object in OLOO style can be declared this way (same short-hand sugar as with `class` body syntax):
>
> ```javascript
> var LoginController = {
>     errors: [],
>     getUser() { // Look ma, no `function`!
>         // ...
>     },
>     getPassword() {
>         // ...
>     }
>     // ...
> };
> ```

语法糖，属性声明时可以省去`function`关键字，相当于`getUser: function(){...}`（注意是匿名函数）。

---

## Appendix A: ES6 class

> Let's revisit the `Widget` / `Button` example from Chapter 6:
>
> ```javascript
> class Widget {
>     constructor(width,height) {
>         this.width = width || 50;
>         this.height = height || 50;
>         this.$elem = null;
>     }
>     render($where){
>         if (this.$elem) {
>             this.$elem.css( {
>                 width: this.width + "px",
>                 height: this.height + "px"
>             } ).appendTo( $where );
>         }
>     }
> }
>
> class Button extends Widget {
>     constructor(width,height,label) {
>         super( width, height );
>         this.label = label || "Default";
>         this.$elem = $( "<button>" ).text( this.label );
>     }
>     render($where) {
>         super.render( $where );
>         this.$elem.click( this.onClick.bind( this ) );
>     }
>     onClick(evt) {
>         console.log( "Button '" + this.label + "' clicked!" );
>     }
> }
> ```
>
> Beyond this syntax *looking* nicer, what problems does ES6 solve?
>
> 1. There's no more (well, sorta, see below!) references to `.prototype` cluttering the code.
> 2. `Button` is declared directly to "inherit from" (aka `extends`) `Widget`, instead of needing to use `Object.create(..)`to replace a `.prototype` object that's linked, or having to set with `.__proto__` or `Object.setPrototypeOf(..)`.
> 3. `super(..)` now gives us a very helpful **relative polymorphism** capability, so that any method at one level of the chain can refer relatively one level up the chain to a method of the same name. This includes a solution to the note from Chapter 4 about the weirdness of constructors not belonging to their class, and so being unrelated -- `super()` works inside constructors exactly as you'd expect.
> 4. `class` literal syntax has no affordance for specifying properties (only methods). This might seem limiting to some, but it's expected that the vast majority of cases where a property (state) exists elsewhere but the end-chain "instances", this is usually a mistake and surprising (as it's state that's implicitly "shared" among all "instances"). So, one *could* say the `class` syntax is protecting you from mistakes.
> 5. `extends` lets you extend even built-in object (sub)types, like `Array` or `RegExp`, in a very natural way. Doing so without `class .. extends` has long been an exceedingly complex and frustrating task, one that only the most adept of framework authors have ever been able to accurately tackle. Now, it will be rather trivial!

感觉用class-orientied这种设计模式的人比较多吧，所以JavaScript也一直在往这上面靠（增加语法糖）。

---

> Firstly, the `class` syntax may convince you a new "class" mechanism exists in JS as of ES6. **Not so.** `class` is, mostly, just syntactic sugar on top of the existing `[[Prototype]]` (delegation!) mechanism.

---

> You might assume that `super` would be bound in an analogous way to how `this` gets bound (see Chapter 2), which is that `super` would always be bound to one level higher than whatever the current method's position in the `[[Prototype]]` chain is.
>
> However, for performance reasons (`this` binding is already expensive), `super` is not bound dynamically. It's bound sort of "statically", as declaration time. 

`super`是非动态绑定的会有一些潜在的问题，比如我动态改变了原型链可能会期待`super`指向的对象发生变化，然而它并没有变化（而`this`是动态绑定的）。（在Python里比较少考虑这个问题是因为class继承关系的动态程度（需要动态改变的几率）还是比原型链低一些的）

---

> `class` does a very good job of pretending to fix the problems with the class/inheritance design pattern in JS. But it actually does the opposite: **it hides many of the problems, and introduces other subtle but dangerous ones**.
>
> `class` contributes to the ongoing confusion of "class" in JavaScript which has plagued the language for nearly two decades. In some respects, it asks more questions than it answers, and it feels in totality like a very unnatural fit on top of the elegant simplicity of the `[[Prototype]]` mechanism.

作者对JavaScript的`class`疯狂输出，哈哈。不过说的也确实在理。