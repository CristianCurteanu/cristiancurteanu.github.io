---
layout: post
title:  "Design patterns in Go: Abstract Factory"
date:   2020-12-13 16:41:59 +0200
permalink: /blog/go/abstract-factory-pattern
description: "Let's take a brief look on how we can benefit from Abstract Factory Design pattern, by solving a real world problem"

categories: ["Software engineering"]
tags: ["go", "golang", "abstract-factory", "design-patterns"]
cover: https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1800&q=80
---


Have you ever been in situation when you have several services integration, but you would be required to have several client protocol implementation for that specific service? 

During my career as a software engineer I had such situation several times, and looking back on first time when I had it, I did not know about **Abstact Factory** pattern. That would make easier the implementation and maintenance by several orders of magnitude.

Let's take a look on how Abstract Factory design pattern can be used for such cases.

### The Problem

Let's say you are building an open source project: a CLI for interaction with different Git repository providers. It's main feature is that you can switch between different providers and execute remote commands via HTTPs. You decide to go with Github and Gitlab for starters.

Years are passing by, and GraphQL became a standard for web services API. Github announced that they are deprecating the REST API. No, they don't actually do it right now, and don't plan to (I guess) but let's imagine that , as this could be any other web API service provider.

Now you have to integrate with GraphQL. Moreover, you would need to integrate any other Git provider with GraphQL in order to avoid this kind of situations in future. 

A naive approach to implement it for first time would be to have service structures that will contain all the logic for REST communication with that specific Git provider. This kind of approach however will increase the rigidity of your code, and you will need to pass around different service components, which, let's face it, is error prone, and creates a tight coupling from handling service perspective.

If the REST only interface would look something like this:

```go
//...

var service GitService
gitProvider := "GITHUB"

if gitProvider == "GITHUB" {
  service = NewGithubService()
} else if gitProvider == "GITLAB" {
  service = NewGitlabService()
} else {
  panic("Unknown GIT service provider given")
}

service.CreatePullRequest("This PR should be reviewed")
//...
service.MergePullRequest()

//...
```



Now that you will add one communication protocol, it will grow something like this:

```go
//...

gitProvider := "GITHUB"
protocol := "GRAPH_QL"

var service GitService


if gitProvider == "GITHUB" && protocol == "REST" {
  service = NewGithubRestService()
} else if gitProvider == "GITHUB" && protocol == "GRAPH_QL" {
  service = NewGithubGraphQLService()
} else if gitProvider == "GITLAB" && protocol == "REST" {
  service = NewGitlabRestService()
} else if gitProvider == "GITLAB" && protocol == "GRAPH_QL" {
  service = NewGitlabGraphQLService()
} else {
  panic("Unknown GIT service provider given")
}

service.CreatePullRequest("This PR should be reviewed")
//...
service.MergePullRequest()

//...
```



As you can see, it can grow exponentially if one more communication protocol will be added, and it can be a nightmare to be maintained or tested.

### Solution

Fortunately this can be fixed by using Abstract Factory. The interface we will end up with, will look something like this:

```go
// main.go

gitProvider := "GITHUB"
protocol := "GRAPH_QL"

var factories map[string]GitServiceFactory = map[string]GitServiceFactory{
	"GITHUB": NewGithubServiceFactory(),
	"GITLAB": NewGitlabServiceFactory(),
}

factory, found := factories[gitProvider]
if !found {
  panic("Non existing git repository service name given")
}

service := NewGitHostingService(factory)
if protocol == "GRAPH_QL" {
  service.SetGraphqlService()
} else if protocol == "REST" {
  service.SetRestService()
} else {
  panic("Non existing communication protocol given")
}

service.CreatePullRequest("This PR should be reviewed")
//...
service.MergePullRequest()

//...
```



Here the number of conditions will grow by one if a new communication protocol will be added. Let's take a look on further implementation of this pattern, in order to understand the guidelines on how it can be implemented.

We will start with the client service, which will be a struct:

```go
type GitHostingService struct {
	factory GitServiceFactory
	service Service
}

func NewGitHostingService(factory GitServiceFactory) GitHostingService {
	return GitHostingService{factory: factory}
}

func (g *GitHostingService) SetRestService() *GitHostingService {
	g.service = g.factory.CreateRestService()

	return g
}

func (g *GitHostingService) SetGraphqlService() *GitHostingService {
	g.service = g.factory.CreateGraphqlService()

	return g
}

func (g *GitHostingService) MergePullRequest() error {
	return g.service.MergePR()
}

func (g *GitHostingService) CreatePullRequest() error {
	return g.service.CreatePR()
}
```


The `GitServiceFactory ` interface will have the role to provide the contract on how the factories should be created, and it will look like this:

```go
type GitServiceFactory interface {
	CreateRestService() RestService
	CreateGraphqlService() GraphqlService
}
```


The `Service` interface is actually a generic interface to more specific interfaces for REST and GraphQL protocols:

```go
type Service interface {
	CreatePR() error
	MergePR() error
}

type RestService interface {
	Service
}

type GraphqlService interface {
	Service
}
```


Note that I have added two more instances for each protocol. This is done because there might be different functionality for each protocol added separately, however they both inherit from `Service` interface. This means, that for every functionality that are common for all protocols, the method should be added to `Service` interface.


Next, let's take a look on implementation for factories for both services:

```go
// Github Factory
type GithubServiceFactory struct {
	Config GithubConfig
}

func NewGithubServiceFactory() GithubServiceFactory {
	return GithubServiceFactory{GithubConfig{""}}
}

func (ghs GithubServiceFactory) CreateRestService() RestService {
	return NewGithubRestService(ghs.Config)
}

func (ghs GithubServiceFactory) CreateGraphqlService() GraphqlService {
	return NewGithubGraphqlService(ghs.Config)
}

// Gitlab Factory
type GitlabConfig struct {
	Auth string
}

type GitlabServiceFactory struct {
	Config GitlabConfig
}

func NewGitlabServiceFactory() GitlabServiceFactory {
	return GitlabServiceFactory{GitlabConfig{""}}
}

func (gls GitlabServiceFactory) CreateRestService() RestService {
	return NewGitlabRestService(gls.Config)
}

func (gls GitlabServiceFactory) CreateGraphqlService() GraphqlService {
	return NewGitlabGraphqlService(gls.Config)
}
```

They are used for injecting it in `GitHostingService` so that it will not depend on the factories internally.



Next let's see how to implement communication services for each protocol and each service provider. Let's see __Github__ first:

```go
type GithubConfig struct {
	Auth string
}

type GithubRestService struct {
	config GithubConfig
}

func NewGithubRestService(config GithubConfig) GithubRestService {
	return GithubRestService{config}
}

func (ghr GithubRestService) CreatePR() error {
	fmt.Println("Request Github to CREATE a PR, using REST")

	// handling logic

	return nil
}

func (ghr GithubRestService) MergePR() error {
	fmt.Println("Request Github to MERGE a PR, using REST")

	// handling logic

	return nil
}

type GithubGraphqlService struct {
	config GithubConfig
}

func NewGithubGraphqlService(config GithubConfig) GithubGraphqlService {
	return GithubGraphqlService{config}
}

func (ghr GithubGraphqlService) CreatePR() error {
	fmt.Println("Request Github to CREATE a PR, using GraphQL")

	// handling logic  
  
	return nil
}

func (ghr GithubGraphqlService) MergePR() error {
	fmt.Println("Request Github to MERGE a PR, using GraphQL")

	// handling logic

	return nil
}
```


And, __Gitlab__ of course:

```go
type GitlabConfig struct {
	Auth string
}

type GitlabRestService struct {
	config GitlabConfig
}

func NewGitlabRestService(config GitlabConfig) GitlabRestService {
	return GitlabRestService{config}
}

func (ghr GitlabRestService) CreatePR() error {
	fmt.Println("Request Gitlab to CREATE a PR, using REST")

	// handling logic  
  
	return nil
}

func (ghr GitlabRestService) MergePR() error {
	fmt.Println("Request Gitlab to MERGE a PR, using REST")

	// handling logic

	return nil
}

type GitlabGraphqlService struct {
	config GitlabConfig
}

func NewGitlabGraphqlService(config GitlabConfig) GitlabGraphqlService {
	return GitlabGraphqlService{config}
}

func (ghr GitlabGraphqlService) CreatePR() error {
	fmt.Println("Request Gitlab to CREATE a PR, using GraphQL")

	// handling logic

	return nil
}

func (ghr GitlabGraphqlService) MergePR() error {
	fmt.Println("Request Gitlab to MERGE a PR, using GraphQL")

	// handling logic

	return nil
}
```

At this point the implementation of each request method logic is not relevant, most important is that this functionality can be extender much more easier. As an exercise, please take a look on how it can be extended, by adding new service provider, say __Bitbucket__.



### Conclusion

In the codebase that we have written, we can see that the layer of abstraction between client and different abstract types implementation is quite overwhelming. However it is flexible enough not to creat too much spaghetti code, and it also stick to single responsibility principle, which might not be the case for first naive approach.


