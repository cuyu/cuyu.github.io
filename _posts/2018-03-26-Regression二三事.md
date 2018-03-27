---
layout: post
title: "回归分析二三事"
category: Machine Learning
tags: [tensorflow]
date: 2018-03-26
---

1. 一些经典的回归分析算法有：linear regression, logistic regression, SVR, Ridge regression等；
2. 这些经典的回归分析算法对于特征的选择要求比较高，比如：目标函数`y=x1*x2+2`（其中x1和x2为两个特征，y为输出），以x1和x2为输入并不能训练出一个能准确预测y的模型（即使是非线性的回归模型好像也不行），这时候就要以x1和x2的乘积作为一维特征作为输入来训练；
3. 通过计算预测值与真值的方差以及[r2](https://en.wikipedia.org/wiki/Coefficient_of_determination)（R-squared）来评估回归模型是否准确，其中r2约接近1则表示模型越准确；
4. 有时候使用`pyecharts`来生成图表能达到比`matlibplot`更好的展现效果；
5. 使用tensorflow的`DNNRegressor`训练时出现`NaN loss during training`的错误，有可能是因为某些特征的值太大了，经过几次训练迭代之后超出了float32的范围（当然也有可能是learning rate太高了，参考网上其他的解释），解决方法就是将这些特征通过转换来控制在某个取值范围内；
6. 如果你期望回归预测的值只包含非负数（比如预测的是价格，负数是没有意义的），那么可以通过一些数学转换来达到目的，比如使用对数：在训练时将目标值处理为log(x)，预测时把结果通过[Smearing retransformation](https://en.wikipedia.org/wiki/Smearing_retransformation)之类的方法重建出来（参考[这里](https://stats.stackexchange.com/questions/145383/getting-negative-predicted-values-after-linear-regression)和[这里](https://stats.stackexchange.com/questions/49857/using-duan-smear-factor-on-a-two-part-model)）（需要注意的是这种方式往往会降低预测的准确率）。或者，就直接把小于0的预测值设为0或某个固定的最小值；
7. tensorflow的训练模型可以传入一个`model_dir`来把模型保存在一个文件夹内，如果要修改参数来重新训练的话，可能需要把之前的模型删除或重新选择一个新的路径来存储模型，否则可能会报错（猜测tensorflow会存储训练的中间状态，这样在修改比如`steps`参数时就不用从头开始迭代了）；
8. 对于tensorflow中现成的一些神经网络模型（比如`DNNRegressor`），在生成的模型文件夹中也同时存放了`tensorboard`所需要的文件，因此我们可以直接使用`tensorboard`命令来查看训练的过程。