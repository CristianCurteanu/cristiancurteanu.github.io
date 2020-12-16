---
layout: post
title:  "Factory method in Go"
date:   2020-12-13 16:41:59 +0200
permalink: /golang/factory-method-pattern
description: "Here you can take a look on how to implement factory pattern using Golang"

categories: ["Software engineering"]
tags: ["go", "golang", "factory-method", "design-patterns"]
cover: https://images.unsplash.com/photo-1516937941344-00b4e0337589?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1800&q=85
---

What are you going to do, if at some point it will be required to add an object, that might have similar interface as existing one, but different logic? This kind of scenario could take place very often, especially in case of data models, or third party integration service objects.

Externally, those models can be evaluated as identical, as they accomplish same task for the business logic, but the services objects they invoke, or third parties that are used may vary. In order to solve this problem on this low level, I would consider using Factory Method design pattern.



### The Problem



Let's imagine a real life scenario: you have been integrated PayPal as a payment method to your app. You have defined a service for that purpose, that actually implements all business logic related to this payments service, it have been tested and works properly. But at some point, business requires you to add Stripe payment method as well. Now there are two options to do that:

1. We can add another Stripe service instance, which will receive all payment requisites as input, an will do it's mambo-jumbo logic once called a `run` method;
2. We can isolate the implementations for payment methods to different instances, that will satisfy specific contract, and call it's logic from one specific place, which will be `PaymentService`



Now, there are several problems with the first approach, and the most noticeable is that you put too much responsibility to a single instance, thus breaking *Single Responsibility Principle*, which says that a specific instance type should be responsible to do one single thing.

Another issue, is that it is really hard to replicate this kind of service, as the business logic is coupled together in the context of a single instance. So if you would like to extend your system for a multitude of payments services, it will be a hard time (or at least harder than it could be).

Now, it's the code time! First, let's take a look on how a possible interface for a PayPal payment service object would look like:

```go
// Inside a payment handler function, all preprocessing is done.
paypalConfig := services.GetPayPalConfig()
service := services.NewPayPalService(paypalConfig)
payment, err := service.NewPayment(paymentData)
if err != nil {
  // ... Handle error
}
result, err = payment.Execute()
if err != nil {
  // ... Handle error
}

// handle the transaction result
```

As a disclaimer, this is not an accurate PayPal implementation, but rather a higher level overview of how interface looks like.

So, to understand the sample above, it just creates an instance of PayPal payment service, using a predefined `paypalConfig` instance, after which prepares a `payment` request to be executed. If a payment has been instantiated properly, it triggers the payment execution process, and returns a `result` that can be used for any further processing. Simple enough!

If there will be added a new service, for Stripe payments processor, the external interface will look like this:



```go
if serviceType == "PAYPAL" {
  paypalConfig := services.GetPayPalConfig()
  service := services.NewPayPalService(paypalConfig)
  payment, err := service.NewPayment(paymentData)
  if err != nil {
    // ... Handle error
  }
  result, err = payment.Execute()
  if err != nil {
    // ... Handle error
  }
} else if serviceType == "STRIPE" {
  stripeConfig := services.GetStripeConfig()
  service := services.NewStripeService(stripeConfig)
  transaction, err := service.NewTransaction(paymentData)
  if err != nil {
    // ... Handle error
  }
  result, err = transaction.Execute()
  if err != nil {
    // ... Handle error
  }
} else {
  // ... Raise an error of unknow payment type
}
```



At some point it will grow as a big ball of mud. Overall it looks similar, but has some distinctive parts for each service object. They both use configuration data injected on initialisation, and use similar interface for handling "transaction". This means that a payment provider can have similar interface for transaction execution. This means that we have our instance type that should be **created** (because this is a creational design pattern)

### Solution

Of course, there should be an instance that would trigger this initialization. This is the responsibilities of the "Factories". Basically those are instances that will have a method for creating a payment provider object, and some logic wrapped around those provider instances.

Let's start from a higher level:



```go
// Inside a payment handler function,
service, err := NewPaymentService(serviceType)
if err != nil {
  // handle error
}
result, err := service.MakePayment(paymentData)
if err != nil {
  // handle error
}
// handle result
```



Now, let's define `PaymentService`, which will basically will be a struct that should have `GetPaymentProvider` method to define which Provider instance should be instantiated, and `MakePayment` method, which will trigger logic to make payment. Hence, it's a good idea to define an interface, as we have a contract for this type of instances.

Let's code, first we define the interface for payments services:

```go
// The interface for the Payments services
type IPaymentService interface {
	GetPaymentProvider() (PaymentProvider, error)
	MakePayment(_ interface{}) (Result, error)
	// Other methods, that can be useful for payments services
}
```

Next, let's define implementation of Payments service:



```go
type PaymentService struct {
	providerType string
	provider     PaymentProvider
}

func NewPaymentService(serviceType string) (IPaymentService, error) {
	var err error
	var service PaymentService

	service.providerType = serviceType
	service.provider, err = service.GetPaymentProvider()
	if err != nil {
		return service, err
	}
	return service, err
}

var providers map[string]PaymentProvider = map[string]PaymentProvider{
	"PAYPAL": NewPayPalProvider(),
}

func (ps PaymentService) GetPaymentProvider() (PaymentProvider, error) {
	provider, ok := providers[ps.providerType]
	if !ok {
		return nil, errors.New("Unknow provider type given")
	}

	return provider, nil
}

func (ps PaymentService) MakePayment(paymentData interface{}) (Result, error) {
	var result Result

	result, err := ps.provider.MakeTransaction(paymentData)
	if err != nil {
		return result, err
	}

	return result, nil
}
```

Here on initialization, it is defined the provider instance as a field of payment service, and the method where the transation is triggered. There is also `providers` global variable, which stores all payment providers references in a map, which will be used later on. This part is critical on extending the functionality, as the `PaymentService` uses it to retrieve the proper provider.

Let's take a look on the code for Paypal provider. First we will define the provider interface:

```go
type PaymentProvider interface {
	MakeTransaction(_ interface{}) (Result, error)
}

// For the sake of simplicity, the Result will be a struct, as follows
type Result struct {
	data   string
	status string
}

```


Now let's see the PayPal payments service provider implementation:

```go
type PayPalPaymentProvider struct {
	auth string // Or any other kind Configuration object, that might store configuration in ENV variables
}

func NewPayPalProvider() PaymentProvider {
	return PayPalPaymentProvider{os.Getenv("PAYPAL_AUTH_KEY")}
}

func (pp PayPalPaymentProvider) MakeTransaction(data interface{}) (Result, error) {
	var result Result

	// Here will actually be the logic for executing a transaction

	return result, nil
}
```


At first sight, this is big chunk of code, that seems redundant. But let's have a look, how we can integrate Stripe payments service:

```go
type StripePaymentProvider struct {
  config StripeProviderConfig
}

func NewStripeProvider() PaymentProvider {
  return StripePaymentProvider{GetStripeConfig()}
}

func (pp StripePaymentProvider) MakeTransaction(data interface{}) (Result, error) {
	var result Result

	// Here will actually be the logic for executing a transaction

	return result, nil
}
```

and, to add the initialization on service `providers` global instance, which now will look like this:

```go
// ...
var providers map[string]PaymentProvider = map[string]PaymentProvider{
	"PAYPAL": NewPayPalProvider(),
	"STRIPE": NewStripeProvider(),
}
// ...
```


and that's it.



#### Conclusion


Now, let's figure out, where is the Factory Method: it is the `GetPaymentProvider` method. Based on the input, it defines which provider type will be used, and it will return the actual payment provider instance.

Besides, as you might noticed, we decoupled the logic, to an instance that is specialized to handle transaction request with PayPal API. And, we can externd the `PaymentService` without changing it's internal logic.