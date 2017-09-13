---
layout: post
title: "Stateless component and react-redux"
category: Javascript
tags: [react-redux, React]
date: 2017-09-13
---

在React中引入Redux的一大好处就是将组件的状态移出来，这样React组件就变成了纯View层的对象，可以专心只做View相关的事情了，是所谓“低耦合”。那么，既然React组件不存储状态了， 是否可以将原先的组件都替换为无状态的函数组件呢？

### Use stateless component with react-redux

尝试一下，便知行不行：

App.js:

```jsx
import React from 'react';

const App = (props) => {
    return (
        <div className="App">
            <input type="text" onChange={props.handleInputChange} value={props.input} />
        </div>
    );
};

export default App;
```

container.js:

```javascript
import {connect} from 'react-redux'
import App from './App'

const mapStateToProps = (state, ownProps) => {
    return state;
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        handleInputChange: (event) => {
            dispatch({type: 'INPUT_CHANGE', value: event.target.value});
        }
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
```

<!--break-->

reducer.js:

```javascript
const _defaultState = {
    input: 'javascript',
};

export default function reducer(state = _defaultState, action) {
    switch (action.type) {
        case 'INPUT_CHANGE':
            return {
                input: action.value,
            };

        default:
            return state;
    }
}
```

以上三段代码分别是无状态的组件、将组件赋予状态的装饰部分以及状态的处理部分（[全部代码](https://github.com/cuyu/react-widgets/tree/master/stateless-component-with-redux)）。结果是可以和从`React.Component`继承的类组件一样工作，即`connect`函数可以接受任何类型的React组件！

###How?

这个问题的关键在于`connect`函数。`connect`函数首先返回的其实是一个高阶组件，所谓高阶组件其实是类似高阶函数的一个概念，即一个函数，它支持一个组件作为输入，并返回一个组件。当然，把它理解为装饰器也可以，并且在最新的ES7语法中是可以这样写的：

```jsx
@connect(mapStateToProps, mapDispatchToProps)
class MyComponent {
}
```

`connect`返回的高阶组件再以我们的组件函数作为输入，最终返回了一个包装过的组件。

具体它是怎么做的，我们需要看一下`connect`函数的实现，通过debug，我们可以看到最终它会返回下面这个函数对象（省略了部分原型方法），其中函数输入的`Component`即React提供的Component类（函数），而`WrappedComponent`（函数中是通过闭包得到的外部的变量）才是放进去包装的我们自己定义的React组件：

```javascript
var Connect = function (_Component) {
  _inherits(Connect, _Component);

  function Connect(props, context) {
    _classCallCheck(this, Connect);

    var _this = _possibleConstructorReturn(this, _Component.call(this, props, context));

    _this.version = version;
    _this.state = {};
    _this.renderCount = 0;
    _this.store = props[storeKey] || context[storeKey];
    _this.propsMode = Boolean(props[storeKey]);
    _this.setWrappedInstance = _this.setWrappedInstance.bind(_this);

    invariant(_this.store, 'Could not find "' + storeKey + '" in either the context or props of ' + ('"' + displayName + '". Either wrap the root component in a <Provider>, ') + ('or explicitly pass "' + storeKey + '" as a prop to "' + displayName + '".'));

    _this.initSelector();
    _this.initSubscription();
    return _this;
  }

  // ...

  Connect.prototype.render = function render() {
    var selector = this.selector;
    selector.shouldComponentUpdate = false;

    if (selector.error) {
      throw selector.error;
    } else {
      return createElement(WrappedComponent, this.addExtraProps(selector.props));
    }
  };

  return Connect;
}(Component);
```

可以看到返回的`Connect`函数其实也是一个React组件，它首先继承了React的`Component`类（通过`_inherits`函数，参考[关于JavaScript的原型链和继承](http://cuyu.github.io/javascript/2017/09/12/%E5%85%B3%E4%BA%8EJavaScript%E7%9A%84%E5%8E%9F%E5%9E%8B%E9%93%BE%E5%92%8C%E7%BB%A7%E6%89%BF#别人家的代码)来看它干了什么），然后它提供了一个自己的`render`函数，该函数会使用React的`createElement`函数创建一个新的组件并返回，当然，是在我们定义的`WrappedComponent`的基础之上（`createElement`在这里可以看做就是一个往输入组件的实例注入`props`的函数）。所以，**`connect`函数其实是用这里的`Connect`组件作为父组件，将输入的组件作为子组件进行了包装。**

如果稍微了解下React的源码（可以参考[React组件是如何渲染的](http://cuyu.github.io/javascript/2017/04/20/React%E7%BB%84%E4%BB%B6%E6%98%AF%E5%A6%82%E4%BD%95%E6%B8%B2%E6%9F%93%E7%9A%84)），就会知道我们写的组件正是会被编译成`ReactElement`类型的对象的，并且根据输入的组件类型在渲染时会选择调用它的`render`函数或它自身（输入为函数时，即stateless functional component）。因此，**React支持什么类型的组件，`connect`函数就支持什么类型的组件作为输入**。而且，这里`createElement`的第二个参数就是在输入的组件基础上添加的属性。

以上解释了`connect`函数可以接受stateless component的原因，但当Redux中状态改变时，作为`Connect`的子组件，我们输入的组件是怎样被重新渲染的呢？为此，首先要知道作为子组件，在父组件重新渲染时会发生什么。通过对React代码调试可知：

- 在组件中调用的`this.props`中的`this`到底是什么。尝试一下，你会发现其实`this.__proto__ === App.prototype`，所以`this`就是`App`（我们定义的组件）的实例化对象，而`this.props`就是绑定在实例化对象上的名为`props`的属性。
- 实际运行时，所有组件会在第一次加载时都会被先实例化，且每个实例化的对象都有一个指针指向它的子组件的实例化对象。在之后组件的实例需要重新渲染的时候，该组件的`render`函数返回的组件类并不会被再次实例化，React会将返回的组件类中的属性拿出来并注入到该实例的子组件实例上去。
- 一个组件无论外面包了多少层父组件，该组件内的`this`总是指向该组件的实例化对象。

综上，每当Redux中的状态发生变化时，首先触发的是`Connect`组件的实例中的状态变化，进而会重新渲染`Connect`组件，即重新调用`createElement`函数在输入组件的基础上生成新的组件类型（注意此时返回的仍是组件类，而非实例），然后React会把这个新生成的组件类的中的`props`注入到之前实例化好的子组件的实例对象中，这个子组件就是我们输入的被包装的组件。

### 结论

`react-redux`的`connect`函数可以接受任何类型的React组件作为输入，输出一个添加（绑定）了包含状态的属性的新的组件。使用无状态的组件可以更好地贴合Redux的意图，降低耦合，代码更简洁明了（相比性能上可能带来的损耗要更重要，参考这个[讨论](https://github.com/airbnb/javascript/issues/937)）。

