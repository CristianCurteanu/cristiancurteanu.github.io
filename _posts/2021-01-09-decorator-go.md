---
layout: post
title:  "Design patterns in Go: Decorator"
date:   2021-01-09T16:41:59Z
permalink: /blog/go/decorator-design-pattern
description: "Here we will see how Decorator design pattern can be implemented and used for solving real world problem"
categories: ["Software engineering", "Golang"]
tags: ["go", "golang", "decorator", "design-patterns"]
image: https://images.unsplash.com/photo-1513593854556-94df5c54a8d6?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1850&q=80
---



Avoiding redundant code, or better say, codebase overbloating, is essential to keep the code clean. By using an example of notification event, sent via both email or slack, can help us better understand how we can use `Decorator` design pattern.

### Problem

Imagine that you are working on a notification part of your system. It should be used in different parts of the system, and sometimes you may need to send notification only by email, sometimes only by Slack, but there are also cases when you should do both.

Now, of course for all notification types you can a specific structure, thus for now resulting into 3 services. However, when there will be added another one, the number will grow to at least 8 variations of service classes.

An easier approach would be to have a logic that accept from external world what notification it requires, and to have structure only for specific notification medium, not all combinations of them.

### Solution

Here, the `Decorator` pattern might be useful. The idea is to have an instance, with specific interface, that will be injected into wrapper objects, that will still implement that specific interface, but will have also other functionalities around the base instance data.

Now, let's see how a decorator could be implemented, in order to solve the problem described above. First we will need a Notifier interface:

```go
type Notifier interface {
	Send(_ string)
}
```

The next thing we need to have, are the message notifier structure, which will basically hold the message data:

```go
type MessageNotifier struct {
	message string
}

func (mn MessageNotifier) Send(message string) {
	mn.message = message
}
```


After, there will be defined the base notifier, that will have a `MessageNotifier` injected:

```go
type NotifierDecorator struct {
	notifier Notifier
}

func (nd *NotifierDecorator) Send(message string) {
	nd.notifier.Send(message)
}
```

It will also call the the notifier's `Send` message.

The only things more we need is the concrete notifiers, first it will be the email:

```go
type EmailNotifierDecorator struct {
	NotifierDecorator
}

func (snd EmailNotifierDecorator) Send(message string) {
	snd.NotifierDecorator.Send(message)
	snd.SendEmail(message)
}

func NewEmailNotifier(notifier Notifier) EmailNotifierDecorator {
	cons := EmailNotifierDecorator{}
	cons.NotifierDecorator.notifier = notifier
	return cons
}

func (snd EmailNotifierDecorator) SendEmail(message string) {
	fmt.Println("Sending Message via SMS:", message)
}
```

And, the slack notifier decorator:

```go
type SlackNotifierDecorator struct {
	NotifierDecorator
}

func NewSlackNotifier(notifier Notifier) SlackNotifierDecorator {
	cons := SlackNotifierDecorator{}
	cons.NotifierDecorator.notifier = notifier
	return cons
}

func (snd SlackNotifierDecorator) Send(message string) {
	snd.NotifierDecorator.Send(message)
	snd.SendApi(message)
}

func (snd SlackNotifierDecorator) SendApi(message string) {
	fmt.Println("Sending Message to Slack:", message)
}
```

The service object will decide, whether email or slack notification will be executed, but in order to test it that is works properly, we will run it agains both decorators:

```go
	var notifier Notifier
	notifier = MessageNotifier{}

	notifier = NewSmsNotifier(notifier)
	notifier = NewSlackNotifier(notifier)

	notifier.Send("Processing is done!")
```

which will produce following result:

```
Sending Message via SMS: Processing is done!
Sending Message to Slack: Processing is done!
```



### Conclusion

This way, the logic for sending messages using different mediums, was isolated from the message notification component. If there will be added another notifiacation medium, let's say SMS, it will be required only to add logic of requesting that communication mechanism to notification service, and to add the implementation of SMS notification decorator struct. This way the components remain isolated, and the system very extendable.