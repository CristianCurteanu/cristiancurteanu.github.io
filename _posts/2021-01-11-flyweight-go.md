---
layout: post
title:  "Design patterns in Go: Flyweight"
date: 2021-01-11T15:21:59Z
permalink: /blog/go/flyweight-

description: "Here we will see how Flyweight design pattern can be implemented and used for solving real world problem"
categories: ["Software engineering", "Golang"]
tags: ["go", "golang", "flyweight", "design-patterns"]
cover: https://images.unsplash.com/photo-1515339760107-1952b7a08454?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1850&h=750&q=80
---


There are cases, when there are lots of instances of a specific type, loaded in memory, should be processed. In that case the execution of that program will cost too much resources, and there also may be a risk of running out of memory, which may crash your system.

To avoid that, measures should be taken in order to optimise memory consumption, by refactoring the instances that are operated. One way of doing it is to use `Flyweight` design pattern.

### Problem

Let's say that you are working on a logging part of your system. There is an usecase when you should aggregate all the logs, in order to get some insights.

The problem with logging, is that it can grow very quickly, and it easily can consume all the RAM on a machine, if not processing correctly. This will be the case when all logging records will be mapped to instances directly, ie record fields will be mapped to instances' fields. This way, you will have a huge collection of data, which also will store redundant data, like the type and id of model entity that marked that specific log.

Let's see how flyweight can help us solve this problem.

### Solution

So when you have a huge collection of data objects, that needs to be processed, the memory is quite an important resource. If there are some marker fields, that groups that specific objects, that data can be moved to a separate instances, and there will be only a reference to that new instance be stored in the data object.

To understand how it looks in practice, let's get back to our logger problem. For the sake of simplicity, we will assume that the only data that is stored will the entity ID and type, and message of the action. It can be refactored to a more specific use cases, but this will add some reduntand complexity on understanding.


First let's define our flyweight object, which in our case will be `ActionType` struct:

```go
type ActionType struct {
	EntityType string
	EntityId   string
}

func NewActionType(entityType, entityId string) ActionType {
	return ActionType{entityType, entityId}
}

func (at ActionType) Print(message string) string {
	return fmt.Sprintf("[%s][%s]: `%s`", at.EntityType, at.EntityId, message)
}
```

It is important to store data for entity type and id inside the flyweight, as it the data that can group the objects.

Next, let's define the `Action`:

```go
type Action struct {
	Message    string
	actionType *ActionType
}

func NewAction(message string, actionType *ActionType) Action {
	return Action{message, actionType}
}

func (a *Action) GetActionType() *ActionType {
	return a.actionType
}

func (a Action) String() string {
	return a.actionType.Print(a.Message)
}
```

This struct is also pretty straightforward, as it just stores the message, and a reference to an action type.

Next, it there will be a factory struct, that creates action types if a new action type and id is added.

```go
type ActionFactory struct {
	actionTypes ActionTypes
}

func (af *ActionFactory) GetActionType(entityType, entityId string) *ActionType {
	actionType, err := af.actionTypes.Find(entityType, entityId)
	if err != nil {
		actionType = NewActionType(entityType, entityId)
		af.actionTypes = append(af.actionTypes, actionType)
	}
	return &actionType
}

type ActionTypes []ActionType

func (ats ActionTypes) Find(entityType, entityId string) (ActionType, error) {
	var actionType ActionType
	var err error

	for _, action := range ats {
		if action.EntityId == entityId && action.EntityType == entityType {
			return action, nil
		}
	}

	err = errors.New("Unable to find action")
	return actionType, err
}
```

In this code sample, it was also added action types helper type, that is exposing the collection of ActionType structs a method of `Find`, which is basically looking up if an action type for specific type and id was added. It will be used in the `ActionFactory` to check if there is no such action type defined yet, to be stored in the collection, otherwise to return the reference to it.

Last, let's define the `Logger` struct, which is basically the client for the `Flyweight`:

```go
type Logger struct {
	actions       []Action
	actionFactory ActionFactory
}

func NewLogger() *Logger {
	return &Logger{}
}

func (l *Logger) Record(entityType, entityId, message string) Action {
	var action Action

	actionType := l.actionFactory.GetActionType(entityType, entityId)
	action = NewAction(message, actionType)
	l.actions = append(l.actions, action)

	return action
}

func (l *Logger) PrintTypeLog(entityType string) {
	for _, action := range l.actions {
		if action.GetActionType().EntityType == entityType {
			fmt.Println(action)
		}
	}
}
```

It has two action, to store the action, and to print log for specific entity type. Of course, there can be variations for this aggregations, but for the sake of simplicity, we will have only this method for now.

Let's test it:

```go
	logger := NewLogger()

	logger.Record("User", "1", "Successfully registered")
	logger.Record("User", "1", "Order placed")
	logger.Record("Shipper", "1", "Package delivered")
	logger.Record("User", "1", "Signed off")
	logger.Record("User", "2", "Order placed")

	logger.PrintTypeLog("User")
```

which will produce:

```
[User][1]: `Successfully registered`
[User][1]: `Order placed`
[User][2]: `Order placed`
```


Also, if we will place a length checking log, for `ActionTypes` field inside `ActionFactory`, we will also notice that the length will grow only to 5. This means that no matter how many log messages will be stored, the Action will store only the `message` data, which will save a lot of memory, eventually.

### Conclusion

Flyweight gives an elegant way to handle large collection of data objects, in an efficient manner. There might be more than two field names given, but still the variations for a specific type of data object may be limited, and it can save a lot of memory, hence improve collection processing.