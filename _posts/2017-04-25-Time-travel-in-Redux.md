---
layout: post
title: "Time travel in Redux"
category: Javascript
tags: [Redux, 深拷贝, immutable.js]
date: 2017-04-25
---

### Time travel###

想当初决定入Redux的坑是因为看到了下面这张神图，当时感觉：哇塞好厉害，整个页面的状态说切换就切换，而且可以瞬间切换到之前的任意一个时间节点！

![Redux devtools](https://camo.githubusercontent.com/47a3f427c9d2e0c763b74e33417b3001fe8604b6/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f662e636c2e6c792f6974656d732f3149335032323243334e3252314d3279314b33622f53637265656e2532305265636f7264696e67253230323031352d31322d3232253230617425323030372e3230253230504d2e6769663f763d3162363236376537)

入了坑之后，发现其实也没那么神奇啦。**Redux之所以可以进行时光穿梭正是因为所有的reducer函数都是*纯函数*，从而保证了每次状态的改变都会生成一个全新的state对象。**你可以把不同时段的每个state对象都记录下来，这样你想展现什么时间段的状态，只需要切换到那个时间段的state对象即可。这也是Redux的devtools做的事情，知道了这些上面这张神图也就没那么神乎了吧。

<!--break-->

### 纯函数###

以上，问题的关键就在于要确保reducer函数是纯函数上。因为JavaScript里面Object对象是mutable的，也就是说一不小心我可能就改变了原来的state对象，这样即使我的app所有功能都还是正常的，但Redux的time travel就不work了。

Redux devtools的troubleshooting里面有[一条](https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/Troubleshooting.md#it-shows-only-the-init-action-or-moving-back-and-forth-doesnt-update-the-state)就是解释为啥使用插件不能更新到之前的状态了，官方推荐的做法是使用[redux-immutable-state-invariant](https://github.com/leoasis/redux-immutable-state-invariant) middleware，这个插件的作用是在开发时用来检查state对象是否被改变了，也就是说它只是一个辅助工具，真正要让state对象本身不发生变化还是得靠我们自己写reducer函数时多加注意。

为了让reducer函数返回的state对象是一个全新的对象，就需要涉及到深拷贝的问题了。当我们能确保深拷贝一份state对象后，再对该对象进行操作，那么原state对象肯定就不会发生变化了。

### 深拷贝###

首先，深拷贝是相对浅拷贝而言的，浅拷贝通常是指只拷贝了目标对象的最顶层的部分，而如果顶层里面有类似C++指针这样的对象时，也只会拷贝这个指针而已，指针所指的对象并不会被拷贝。比较典型的`Object.assign`函数就是浅拷贝。比如下面我通过`Object.assign`拷贝后，`a`、`b`两个对象的`mutable`属性其实指向的是内存中的同一个对象，所以其中一个修改了改对象的值后，另一个对象也相应的被修改了：

```javascript
let theMutable = {'c': 3};
let theImmutable = 'abc';
let a = {'mutable': theMutable, 'immutable': theImmutable};
let b = Object.assign({}, a);
b.mutable.c = 0;
b.immutable = 'efg';
console.log(a);  // { mutable: { c: 0 }, immutable: 'abc' }
console.log(b);  // { mutable: { c: 0 }, immutable: 'efg' }
console.log(theMutable)  // { c: 0 }
console.log(theImmutable)  // abc
```

深拷贝和浅拷贝当然也不是绝对对立的，对于很多简单的对象而言，浅拷贝和深拷贝得到的结果可能是完全相同的（也就是说浅拷贝也是可能得到一个全新的对象的）。

怎么去实现一个通用意义上的深拷贝不是这里主要要讨论的话题，至少JavaScript标准库里面并没有这样一个实现。一个比较直接的想法是递归地使用`Object.assign`来拷贝每一层，另外一个思路就是想把对象转换成JSON字符串（前提是对象可以被jsonfy），再parse回来（目测开销比前者更大？）。除此之外，还有一个解决方法，那就是[immutable.js](https://github.com/facebook/immutable-js/)。

### immutable.js###

[immutable.js](https://github.com/facebook/immutable-js/)也是Facebook开源的一个JavaScript库，它的作用如其名，就是用来创建并操作immutable的对象的。我们知道，JavaScript里面的对象除了`string`、`number`、`boolean`、`null`、`undefined`以外的类型都是mutable的类型（待确认？），mutable的对象一大痛点就是不能方便的深拷贝，比如ES6中的`const`关键字仅仅是做了一层浅拷贝来判断目标对象是否遭到修改：

```javascript
const a = 1;
a = 2;  // raise TypeError
const b = {'c': 2};
b.c = 3;
// b is actually changed, oops!
console.log(b);  // { c: 3 }
```

回到reducer函数上来，如果我们的state对象是immutable的话，所有问题就都解决了。而[immutable.js](https://github.com/facebook/immutable-js/)正是这一把🔑，它不仅实现了对象的immutable，并且十分高效，每次改变一个对象，（内存中）仅仅是改变的那部分做了更新，其余部分还是指向原来的对象（当然根节点肯定是要更新的），简单的原理示意如下：

![immutable.js原理](/images/2017-04-25-immutable原理.gif)

### immutable.js in Redux###

由于Redux原生只支持JavaScript原生的object对象作为state对象，所以**使用[immutable.js](https://github.com/facebook/immutable-js/)后所有和state对象接触的部分都要改写**。

这里以一个简单的表单应用为例，假设我的state对象结构如下：

```javascript
let _defaultState = {
    inputs: {
        username: ''
    },
    response: {}
};
```

使用了[immutable.js](https://github.com/facebook/immutable-js/)后，reducer函数中数据的处理要稍作改变，这里当一个`CACHE_INPUT` action来的时候，我要改变`state.inputs.username`，像下面这样`state.setIn`返回的直接就是一个新的对象，是不是超简单？

```javascript
import {fromJS} from 'immutable'

export default function (state = fromJS(_defaultState), action) {
    switch (action.type) {
        case 'CACHE_INPUT':
            return state.setIn(['inputs', 'username'], action.value);

        default:
            return state;
    }
}
```

而在container组件的`mapStateToProps`函数也需做相应改变来获取对应的state中的数据：

```javascript
const authState = (state) => state.get('auth');

const mapStateToProps = (state, ownProps) => {
    return {
        username: authState(state).getIn(['inputs','username']),
    };
};
```

最后，Redux本身提供的`combineReducers`函数在这是用不了的，如果仍想用这个函数的话，推荐使用[redux-immutablejs](https://github.com/indexiatech/redux-immutablejs)提供的`combineReducers`函数。

### 后记###

开始只是因为开发一个React app，发现Redux devtools的time travel功能用不了了，无论什么时间节点得到的状态都是最新的状态。然后突然想到Redux可以time travel其实是因为规定了reducer函数是纯函数的缘故，就想简单记录下这个发现，没想到一下子写了这么多。可见写出来收获还是大的，哇咔咔。

### Reference###

1. [What is the most efficient way to deep clone an object in JavaScript?](http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript)
2. [facebook immutable.js 意义何在，使用场景？](https://www.zhihu.com/question/28016223)
3. [Immutable 详解及 React 中实践](https://github.com/camsong/blog/issues/3)