---
layout: post
title: "React进阶之使用Redux管理组件状态"
category: Javascript
tags: [React, Redux, 心得]
date: 2017-02-27
---

刚刚接触Redux，看了官方的[文档](http://redux.js.org/)和[例子](https://github.com/reactjs/redux/tree/master/examples)以及[redux-tutorial项目](https://github.com/react-guide/redux-tutorial-cn)之后，写了一个简单的[半成品项目](https://github.com/cuyu/web-calculator)来练手，其中有4个branch，分别对应了使用全局变量来管理组件状态、使用React原生的`flux`库、使用`redux`和使用`redux`和`react-redux`对同一个问题的四种解决方法，有兴趣可以去看一看。下面讲一讲写了这个半成品项目之后的一些感受和小结。

### 明确组件的属性

默认情况下，React组件的属性是可以任意赋值的，为了对此加以限制，在定义React组件时，可以同时定义好它允许设置的属性以及对应的类型（通过定义组件`propTypes`属性来限定），比如：

```javascript
import React, {Component, PropTypes} from 'react';

class MyButton extends Component {
    static propTypes = {
        onClick: PropTypes.func.isRequired,
        completed: PropTypes.bool.isRequired,
        text: PropTypes.string.isRequired
    };

    render() {
        return (
            <button className="Button" onClick={this.props.onClick}>{this.props.text}</button>
        );
    }
}
```

这样做的好处是，设计组件时就可以定义好它的属性以及各属性的作用，使定义更明确，并且类似于接口的定义，之后使用组件时（redux就会大量使用组件的属性）也因此不会胡乱使用了，减少了bug出现的概率。

### Without `redux`

不使用`redux`，一种比较直接的方案是通过全局变量来分发状态的变化。

以下，在`Screen`组件中将组件本身赋予了一个全局变量：

```javascript
class Screen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '0',
        };
        window.SCREEN_OBJ = this;
    }

    render() {
        return (
            <div className="Screen">{this.state.value}</div>
        );
    }
}
```

在`Button`组件中，因此可以调用`Screen`组件的`setState`函数：

```javascript
class Button extends Component {
    handleClick() {
        let newValue = window.SCREEN_OBJ.state.value + this.props.name;
        window.SCREEN_OBJ.setState({value: newValue});
    }

    render() {
        return (
            <button className="Button" onClick={this.handleClick.bind(this)}>{this.props.name}</button>
        );
    }
}
```

<!--break-->

### With `redux`

单纯在React应用中使用`redux`。这个方案也会创建一个全局的变量`store`，各个组件通过`store`对象来获取/更新状态。

以下，在`Screen`组件中，在构造函数中，调用`store`的`subscribe`函数，将`Screen`组件的`setState`函数注册进去。当`store`中存储的状态方式改变时，会触发调用所有注册进去的函数（即广播者订阅者模式）：

```javascript
class Screen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '0',
        };
        // subscribe the redux store here so that we can pass the component object to the function
        store.subscribe(() => {
            this.setState(store.getState().value);
        });
    }

    render() {
        return (
            <div className="Screen">{this.state.value}</div>
        );
    }
}
```

在`Button`组件中，直接调用`store`的dispatch方法来更新store存储的状态：

```javascript
class Button extends Component {
    handleClick() {
        store.dispatch(appendActionCreator(this.props.name));
    }

    render() {
        return (
            <button className="Button" onClick={this.handleClick.bind(this)}>{this.props.name}</button>
        );
    }
}
```

对比使用全局变量的方案，最明显的是使用`redux`减少了直接操作React组件的风险（原来全局变量存放的React组件，现在是Redux的状态存储对象）。

### With `redux` and `react-redux`

在React应用中使用绑定好React和Redux接口的`react-redux`库（它的实现原理在于通过React组件的`contextTypes`属性可以获取父辈组件的属性信息，从而可以通过一个容器组件来把状态的改变分发给它的所有子组件，并且由于React组件属性的改变会触发重新渲染，也省去了我们写`setState`的功夫。）

以下，通过`react-redux`封装好的`Provider`组件，可以将`store`对象传递给它所有的子组件：

```javascript
ReactDOM.render((
    <Provider store={store}>
        <ChangeableScreen/>
    </Provider>
), screen);
```

然后，对`Screen`组件进行了一层装饰（类似Python里的装饰器），装饰的目的是将状态的改变映射到组件属性的改变：

```javascript
const mapStateToProps = (state, ownProps) => {
    return {
        value: state.value.value
    }
};

const ChangeableScreen = connect(mapStateToProps)(Screen);
export default ChangeableScreen
```

同样，对`Button`组件也进行装饰，这次需要做的是将`dispatch`函数和组件属性作映射，即`Button`组件的`onClick`属性对应了一个函数就在这里定义（注意组件进行装饰时并不需要知道具体的`store`对象是什么，`store`对象是由父组件`Provider`来告知的，因此装饰好的组件可以很方便地通过不同的`store`对象而产生不同的行为）：

```javascript
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onClick: () => {
            dispatch(appendNumber(ownProps.name))
        }
    }
};

const PlayableButton = connect((state, ownProps) => {
    return {}
}, mapDispatchToProps)(Button);

export default PlayableButton
```

对比之前单纯使用`redux`，使用`react-redux`后，组件的状态管理被完全提取出来，不再放在原组件内部，而是作为组件的装饰函数放在外部。这样组件内部就只需要定义好接口属性以及渲染的行为即可，提高了代码的复用性。而通过封装好的`Provider`组件，可以很方便地将`store`对象传递给所需要的组件，并且进一步隔离了`store`对象和组件的状态管理，使得每一块都能灵活复用和组合。

### 使用Redux DevTools Extension

Redux官方写了一个很强大的[浏览器插件](https://github.com/zalmoxisus/redux-devtools-extension)，可以很方便地查看组件在各个时段的状态，并且进行“time travel”，快速切换到任意一个状态。在浏览器上安装完插件后，使用也非常简单，只要在执行`createStore`时像如下传递一个全局变量到里面即可：

```javascript
import {createStore} from 'redux'
const store = createStore(
    reducer, /* preloadedState, */
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
```

需要**注意**的是，`createStore`的第二个参数是用来设置store的初始状态的，如果你发现你的组件的一些初始状态不太对头，可能是使用了这个插件的原因。

### Stateless component

现在我们将组件的所有状态都交由`redux`来管理，从而组件本身就可以不存储任何状态了，这就好比定义了一个函数，尽可能多的把需要的参数暴露出来，而不是在代码中hardcode写死，这样这个函数可以被更多次地复用。React的组件也是一样，通过把组件的状态暴露出来（在`redux`中是以组件属性的形式暴露），组件就变得更加通用，也更容易复用，同时测试也更方便。（甚至比如说各种事件的响应函数也可以暴露出来，而不是和组件绑定起来，当然具体是抽象到哪一步还是因各个项目而异。）

