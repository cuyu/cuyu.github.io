---
layout: post
title: "Create a form using React"
category: Javascript
tags: [React, 坑, Redux]
date: 2017-03-24
---

想用React实现一个简单的表单，其中主要的组件如下：

```javascript
class App extends Component {
    render() {
        return (
            <div className="App">
                <input type="text" value="" name="username"/>
            </div>
        );
    }
}
```

第一坑：运行时发现输入框中输入任何字符都没有反应。原因[官方文档](https://facebook.github.io/react/docs/forms.html)也作了说明，简单说就是需要我们自己实现一个`onChange`的事件函数。

---

因此，参考官方文档，且为了方便代码复用，写了如下一个`Input`组件，然后在`App`组件中使用这个组件来替换原来的`input`。

```javascript
class Input extends Component {
    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.props.value = event.target.value;
    }

    render() {
        return (
            <input {...this.props} onChange={this.handleChange}/>
        );
    }
}

class App extends Component {
    render() {
        return (
            <div className="App">
                <input type="text" value="" name="username"/>
            </div>
        );
    }
}
```

第二个坑出现了，运行时发现出现了如下的错误：

```
Uncaught TypeError: Cannot assign to read only property 'value' of object '#<Object>'
```

原因在于**React组件的属性是只读的**，因此在`handleChange`中不能再对`value`属性赋值了。

<!--break-->

---

行吧，那就用state来存储要改变的值：

```javascript
class Input extends Component {
    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
        this.state = {value: this.props.value};
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    render() {
        return (
            <input {...this.props} value={this.state.value} onChange={this.handleChange}/>
        );
    }
}
```

第三个坑来了：**在`constructor`函数执行时，组件对象的属性还没有生成**，所以这时候是无法读取到`this.props.value`的。

另外，注意这里在设定`<input>` tag时，把要覆盖父组件传递进来的属性的attributes放在`{...this.props}`后面，比如这里

---

回忆了一下React组件渲染的顺序，决定把组件状态初始化往后挪一挪，放到`componentWillMount`函数中：

```javascript
class Input extends Component {
    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
    }

    componentWillMount() {
        this.state = {value: this.props.value};
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    render() {
        return (
            <input {...this.props} value={this.state.value} onChange={this.handleChange}/>
        );
    }
}
```

这下大功告成了！

但实践中这种实现方式有一个“缺陷”，即`Input`组件value的改变是无法映射到其父组件的，即React中父组件是不知道子组件的状态/属性变化的。（React设计的初衷就是单向数据流，父组件就是不能知道子组件状态/属性的啊。）

---

为了方便管理我们的`Input`组件的状态，使用Redux对上述组件重新改造下，将组件的状态存放在Redux中。

In `components/BaseInput.js`:

```javascript
import React, {Component, PropTypes} from 'react';

function filterObject(target, whiteList) {
    let result = {};
    for (let i = 0; i < whiteList.length; ++i) {
        if (whiteList[i] in target) {
            result[whiteList[i]] = target[whiteList[i]];
        }
    }
    return result;
}


class BaseInput extends Component {
    static propTypes = {
        handleValueChange: PropTypes.func.isRequired,
    };

    render() {
        let filteredProps = filterObject(this.props, ['disabled', 'name', 'type']);  // Used to filter non-DOM props
        return (
            <input {...filteredProps} type="text" value={this.props.value} onChange={this.props.handleValueChange}/>
        );
    }
}

export default BaseInput;
```

In `containers/Input.js`:

```javascript
import {cache} from '../actions/action-creator'
import BaseInput from '../components/BaseInput'
import {connect} from 'react-redux'


const mapStateToProps = (state, ownProps) => {
    return {
        value: state[ownProps.id].value,
    }
};


const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        handleValueChange: (event) => {
            dispatch(cache(ownProps.id, event.target.value));
        },
    }
};

const Input = connect(mapStateToProps, mapDispatchToProps)(BaseInput);

export default Input;
```

In `actions/action-creator.js`

```javascript
export const cache = (id, value) => {
    return {
        type: 'CACHE',
        id: id,
        value: value,
    }
};
```

In `reducers/input-reducer.js`:

```javascript
export default function generateInputReducer(id) {
    return function (state = {value: ''}, action) {
        // Will only be executed if id is satisfied.
        if (action.id !== id) {
            return state;
        }
        switch (action.type) {
            case 'CACHE':
                return {
                    value: action.value
                };

            default:
                return state;
        }
    }
}
```

在`store.js`中，我们要创建多少`Input`组件就需要创建多少个相应的reducer，这里我们创建了两个：

```javascript
import {createStore, combineReducers} from 'redux'
import generateInputReducer from './reducers/input-reducer'

let rootReducer = combineReducers({
    firstname: generateInputReducer('firstname'),
    lastname: generateInputReducer('lastname'),
});

const store = createStore(rootReducer);

export {store}
```

在使用上面创建的`Input`组件时，只需要指定它们的`id`属性与`rootReducer`中的属性对应即可：

```javascript
class App extends Component {
    render() {
        return (
            <div className="App">
                <label>First name:</label>
                <Input id="firstname"/>
                <br/>
                <label>Last name:</label>
                <Input id="lastname"/>
                <br/>
            </div>
        );
    }
}
```

