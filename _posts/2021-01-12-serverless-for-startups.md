---
layout: post
title:  "Why you should go serverless if you are a startup?"
date:   2021-01-12T19:15:59Z
permalink: /blog/serverless-for-startups
description: "Let's discuss about pros and cons for choosing to build your bussiness systems using a Serverless architecture provided by the major Cloud Platforms"
categories: ["Bussiness"]
tags: ["bussiness", "startups", "design", "architecture", "software", "programming"]
cover: https://images.unsplash.com/photo-1523726491678-bf852e717f6a?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80
---


The time is money: that's what we all know. 

But for startups that is even more critical. Pivoting on a monolithic back-end it's usually a pain in the ass, especially when using technology stack that is not fully ready for that purpose. Eventually the app will grow as a big ball of mud, which will  be really hard to maintain, which is even more true for poorly designed systems.

The costs of maintainance for such systems will grow exponentially over time.

Going serverless can help solve some of issues related to modularity. I am not talking about Serverless framework (the tool), but as a system architecture as a whole. Of course the Serverless framework can be used, but I find it very limited. 

For instance, the AWS does provide tool like CDK (Cloudformation Development Kit), which is a tool for defining the Cloud architecture using libraries and languages like JavaScript, TypeScript, Python and so on. This approach is much more flexible than an YAML from Serverless framework.

### What it means to have a serverless app?

Basically the whole idea of serverless applications is that code runs on small containers deployed on some Cloud provider platform (AWS, GCP, Azure, ...). The HTTP requests are routed to them by a gateway layer service, which takes the role of a router. But the containers are fully isolated, and they can be configured individually, they scale individually and they run only as requested. If no requests are received by containers, they are destroyed/stopped.

The cloud providers usually charge by the time when containers are running. If containers are not running, they don't charge at all.

Let's take a look on what advantages this brings.

### Easy to configure and maintain

I think that's obvious. First of all, it's not required a devops or system administrator to run the server to maintain and configure the environment. It is all done by cloud provider, and it is done automatically. 

All the cloud functions configurations it is possible to be done by developers. If for instance, it is deployed on AWS, all configuration can be done in CDK scripts. The Cloudformation will take care of the setup automatically.

Each container will have the handler deployed, in which will be defined the logic for handling the request. It can also have reusable components to operate with, that will be available across the application.

### Reliable and Resilient

The containers are managed by cloud provider. So if there are some issues with a physical machine to run the container, cloud provider usually will create the container on a different machine, which will makes the request processable.

This way you can rely on your system, as it will be running.

Also, you are secured from most of server attacks, as cloud providers comply with security standards. Of course, this doesn't secure from application level attacks.

### Cost efficient

Since the cloud providers are charging only for the time the handler code is running, you will not be required to pay if there will be no traffic on your website. But, operating costs for a running system, are low as well. For example, on [AWS Lambda pricing page](https://aws.amazon.com/lambda/pricing/), pricing for 2GB container is $0.0000000333 per ms. Now, a good API response should have less than 100ms. Let's consider a response time of 30ms. This way, in order to be charged with \$1, the app should perform 1.000.000 requests. If there cache will also be used, this number can be higher.

Also, you don't need to take in account the maintenance costs, as Cloud Engineers (they also write the app code) are usually able to handle the maintainence of the environment.

Now let's check out some of the disadvantages

### Serverless is not cloud agnostic

Or saying the other way around, it is cloud native approach. This means your app will depend on some functionalities, that are related to specific cloud provider.

But this can be fixed, by adding an adapter for handling logic, and a http request/response layer. This way, the migration to a cloud native app to a cloud agnostic can be not that complicated, which can be usefull when services like AWS Lambda or GCP Cloud Functions will stop to exist.

### Costs are actually growing linearly

For the example provided, the cost calculation was made for 1.000.000 requests per function. Now imagine that you will have 10 other lambda function, with a similar average traffic. This means that costs will grow to $10. When the traffic will hit 10.000.000 requests per function on average, you will have to pay \$100 dollars. However the value provided by these 100.000.000 requests will grow as well, the charging price is not constant.

To solve this issue, the functions can be redesigned, so that there will be less calls to lambda functions made, or to optimize allocated resources with which functions are configured to operate with (the costs will drop significantly, if there are redundant resources allocated).

Of course when setting up a container based architecture, the costs will also grow linearly, however the bootstrap costs are much higher than in case of a serverless architecture. However the slope is much lower when traffic increases.





### Conclusion

Taking in consideration that a serverless app can be designed with DDD in mind, and can be extremely modular, the pivoting can be done very easily, which is crucial for a startup. Also, taking in account that for a tech startup the most expensive resource are experience and knowledge of engineers, going serverless is a very good choice, since the resources required to maintain and run it at a moderate traffic are reasonable

And of course resilience and security provided by cloud providers will guarantee that your app will run (unless there will be bugs in application code, that will crash one, or some more, functions).

However, if you are targeting a much higher traffic, then you should think twice before going serverless. Even though, with a higher traffic, I still think that the operating costs are negligible, but the advantage of a cloud provider taking care of inner details for managing the servers infrastructure, will save you much more resources in a long run.