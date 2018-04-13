---
layout: post
title: "About neural network"
category: Machine Learning
tags: [neural network]
date: 2018-03-30
---

1. 学习率是指每次进行梯度下降时，各个参数按照梯度进行调整的比例。学习率越高，则每次迭代参数调整得越大，训练的效率也就越高；但学习率太高，可能会导致训练无法收敛（why？）。

2. 目前，神经网络的隐层的激活函数一般选择ReLu函数（sigmoid函数或tanh函数也可以，但存在vanishing gradient问题，会导致某些情况下训练效率很低），而输出层则一般会根据需求来定：

   - 用于回归一般选择线性函数即可（因为没有边界的要求）
   - 用于分类则使用softmax函数或sigmoid函数

   (参考[这里](https://stats.stackexchange.com/questions/218542/which-activation-function-for-output-layer))

3. 同样学习率、同样的迭代次数下，如果训练得到的模型预测误差仍不同，则还有可能是每次训练的权重的初始值不同且迭代次数不足导致。

4. 损失函数用于计算

5. 适当地提升dropout可以减少训练模型的overfitting，