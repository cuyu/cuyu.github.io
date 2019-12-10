---
layout: post
title: "K8S troubleshooting notes"
category: Framework
tags: [Kubernetes]
date: 2019-12-10
---

1. 由于minikube使用的并不是本地安装的docker deamon，所以它并不会使用本地build好的image，而是从remote去pull。如果想当场build之后就在minikube中使用，可以在build image之前设置为使用minikube的docker：

   ```sh
   eval $(minikube docker-env)
   ```

   并且将对应的K8S的schema中的[imagePullPolicy](https://kubernetes.io/docs/api-reference/v1/definitions/#_v1_container)设为Never，这样就会使用刚build好的本地的image了。

2. 在使用minikube的docker制作image是碰到过pip install failed的情况，排查下来的原因是minikube中的docker（cpu、内存）资源不足，导致安装某些包需要编译时失败了。通过给minikube分配更多的资源解决，比如：

   ```sh
   minikube start --memory 4096 --cpus 4
   ```

3. 想要mount本地的文件、文件夹到某个pod的某个container中？首先你需要先把本地的路径mount到minikube创建的VM中：

   ```sh
   minikube start --mount --mount-string="$HOME/.minikube:/data/.minikube"
   ```

   通过`minikube ssh`可以登录minikube的VM中确认文件是否成功mount。

   然后，在K8S的schema中创建对应的volume并mount:

   ```yaml
         containers:
           - name: nginx
             image: nginx
             volumeMounts:
               - mountPath: /opt/kube-cert/
                 name: kube-cert
         volumes:
           - name: kube-cert
             hostPath:
               path: /data/.minikube/
               type: Directory
   ```

4. pod中的某个container启动失败了，可以通过一些命令来troubleshooting:

   ```sh
   # Get detailed info of the pod, xxx is the pod name
   kubectl get pod xxx --output=yaml
   # Print stdout of failed pod/container
   kubectl logs xxx
   # For container which can start up but got some issues, you can login to the box
   kubectl exec -it xxx bash
   ```

5. K8S的service可以被其他deployment的pod内直接访问（K8S会自动给service分配DNS name，就是service的name），而同一个pod内部的container之间互相访问则访问`localhost`就可以了，比如pod内起了一个MongoDB的container以及一个Nginx的container，那么Nginx可以通过`localhost:27017`来连接到该MongoDB。

6. 可以在一个yaml文件中定义多个service和deployment等的schema，这样通过`kubectl apply -f xxx.yaml`就可以同时都起起来。

