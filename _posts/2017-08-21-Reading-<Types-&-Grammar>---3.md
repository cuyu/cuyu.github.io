---
layout: post
title: "Reading &lt;Types & Grammar&gt; - 3"
category: Javascript
tags: [You Dont Know JS, 读书笔记]
date: 2017-08-21
---

# Chapter 5: Grammar

> ## Statements & Expressions
>
> ```javascript
> var a = 3 * 6;
> var b = a;
> b;
> ```
>
> In this snippet, `3 * 6` is an expression (evaluates to the value `18`). But `a` on the second line is also an expression, as is `b` on the third line. The `a` and `b` expressions both evaluate to the values stored in those variables at that moment, which also happens to be `18`.
>
> Moreover, each of the three lines is a statement containing expressions. `var a = 3 * 6` and `var b = a` are called "declaration statements" because they each declare a variable (and optionally assign a value to it). The `a = 3 * 6`and `b = a` assignments (minus the `var`s) are called assignment expressions.
>
> The third line contains just the expression `b`, but it's also a statement all by itself (though not a terribly interesting one!). This is generally referred to as an "expression statement."

“声明”和“表达式”的概念在几乎任何语言都是通用的。

---

> It's a fairly little known fact that statements all have completion values (even if that value is just `undefined`).

> Let's consider `var b = a`. What's the completion value of that statement?
>
> The `b = a` assignment expression results in the value that was assigned (`18` above), but the `var` statement itself results in `undefined`. Why? Because `var` statements are defined that way in the spec.

> The general idea is to be able to treat statements as expressions -- they can show up inside other statements -- without needing to wrap them in an inline function expression and perform an explicit `return ..`.
>
> For now, statement completion values are not much more than trivia.

这个设计我感觉是有点多余的，如果仅仅是为了省掉一行return语句的话

---

> **Note:** Would you think `++a++` was legal syntax? If you try it, you'll get a `ReferenceError` error, but why? Because side-effecting operators **require a variable reference** to target their side effects to. For `++a++`, the `a++` part is evaluated first (because of operator precedence -- see below), which gives back the value of `a` *before* the increment. But then it tries to evaluate `++42`, which (if you try it) gives the same `ReferenceError` error, since `++` can't have a side effect directly on a value like `42`.

这波解释很精妙。

---

> This behavior that an assignment expression (or statement) results in the assigned value is primarily useful for chained assignments, such as:
>
> ```javascript
> var a, b, c;
>
> a = b = c = 42;
> ```
>
> Here, `c = 42` is evaluated to `42` (with the side effect of assigning `42` to `c`), then `b = 42` is evaluated to `42` (with the side effect of assigning `42` to `b`), and finally `a = 42` is evaluated (with the side effect of assigning `42` to `a`).

这里之所以可以连续赋值，正是因为`c=42`除了赋值这个操作外还会将所赋的值返回出来。

<!--break-->

---

> ```javascript
> // `foo` labeled-loop
> foo: for (var i=0; i<4; i++) {
> 	for (var j=0; j<4; j++) {
> 		// whenever the loops meet, continue outer loop
> 		if (j == i) {
> 			// jump to the next iteration of
> 			// the `foo` labeled-loop
> 			continue foo;
> 		}
>
> 		// skip odd multiples
> 		if ((j * i) % 2 == 1) {
> 			// normal (non-labeled) `continue` of inner loop
> 			continue;
> 		}
>
> 		console.log( i, j );
> 	}
> }
> // 1 0
> // 2 0
> // 2 1
> // 3 0
> // 3 2
> ```
>
> **Note:** `continue foo` does not mean "go to the 'foo' labeled position to continue", but rather, "continue the loop that is labeled 'foo' with its next iteration." So, it's not *really* an arbitrary `goto`.

原来`continue`后面还能跟一个变量（`break`也同理），使用这种方式就可以不用设置flag再判断了，对于多重循环还是很有用的！

---

> Starting with ES6, another place that you'll see `{ .. }` pairs showing up is with "destructuring assignments" (see the *ES6 & Beyond* title of this series for more info), specifically `object` destructuring. Consider:
>
> ```javascript
> function getData() {
> 	// ..
> 	return {
> 		a: 42,
> 		b: "foo"
> 	};
> }
>
> var { a, b } = getData();
>
> console.log( a, b ); // 42 "foo"
> ```

Python里面类似的操作叫unpack，但只有在作为函数输入时可以这样做：

```python
def func(a, b):
  print a, b

d = {'a': 1, 'b': 2}
func(**d)  # 1, 2
```

---

> ##Operator Precedence
>
> For a complete list of operator precedence, see "Operator Precedence" on the MDN site (* <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence>).

确实没想到`&&`的优先级要高于`||`，一直以为它们的优先级是一样的。

---

> In general, operators are either left-associative or right-associative, referring to whether **grouping happens from the left or from the right**.
>
> It's important to note that associativity is *not* the same thing as left-to-right or right-to-left processing.

> Consider the `? :` ("ternary" or "conditional") operator:
>
> ```javascript
> a ? b : c ? d : e;
> ```
>
> `? :` is right-associative, so which grouping represents how it will be processed?
>
> The answer is `a ? b : (c ? d : e)`.

即使是一样优先级的操作，是从左往右依次执行还是从右往左执行也是根据操作而不同的！（以前一直以为都是从左往右执行~）

---

> ## Automatic Semicolons
>
> ASI (Automatic Semicolon Insertion) is when JavaScript assumes a `;` in certain places in your JS program even if you didn't put one there.

> It's important to note that ASI will only take effect in the presence of a newline (aka line break). Semicolons are not inserted in the middle of a line.

“动态语言要什么分号。”--写惯了Python的我表示赞同。

---

> One of the most hotly contested *religious wars* in the JS community (besides tabs vs. spaces) is whether to rely heavily/exclusively on ASI or not.
>
> Most, but not all, semicolons are optional, but the two `;`s in the `for ( .. ) ..` loop header are required.

> Another way of looking at it is that relying on ASI is essentially considering newlines to be significant "whitespace." Other languages like Python have true significant whitespace. But is it really appropriate to think of JavaScript as having significant newlines as it stands today?
>
> My take: **use semicolons wherever you know they are "required," and limit your assumptions about ASI to a minimum.**

说的也有道理，毕竟JavaScript不像Python那样对缩进要求严格，如果两行直接仅仅有一个换行符作为连接，似乎是有些不保险。

---

> ## `try..finally`
>
> A `return` inside a `finally` has the special ability to override a previous `return` from the `try` or `catch` clause, but only if `return` is explicitly called:
>
> ```javascript
> function bar() {
> 	try {
> 		return 42;
> 	}
> 	finally {
> 		// override previous `return 42`
> 		return;
> 	}
> }
>
> bar();	// undefined
> ```

永远不要在`finally`语句中放入`return`、`continue`、`break`等语句（Python中也同样适用）。

---

> ## `switch`
>
> If the `case` expression resulted in something that was truthy but not strictly `true` (see Chapter 4), it wouldn't work. This can bite you if you're for instance using a "logical operator" like `||` or `&&` in your expression:
>
> ```javascript
> var a = "hello world";
> var b = 10;
>
> switch (true) {
> 	case (a || b == 10):
> 		// never gets here
> 		break;
> 	default:
> 		console.log( "Oops" );
> }
> // Oops
> ```
>
> Since the result of `(a || b == 10)` is `"hello world"` and not `true`, the strict match fails. In this case, the fix is to force the expression explicitly to be a `true` or `false`, such as `case !!(a || b == 10)`.

感觉这会是一个大坑。