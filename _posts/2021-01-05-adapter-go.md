---
layout: tw_post
title:  "Design patterns in Go: Adapter"
date:   2021-01-06T16:41:59Z
permalink: /blog/go/adapter-design-pattern
description: "Here we will see how Adapter design pattern can be implemented and used"

categories: ["Software engineering", "Golang"]
tags: ["go", "golang", "adapter", "design-patterns"]
image: https://images.unsplash.com/photo-1570544389273-27246c0ba489?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1800&h=750&q=80
---



There might be cases when two different types of objects should be used for a similar processing. It's easy when those types share similar interface, but how about the cases when interfaces are different. Obviously, there should be a mechanism for translating the difference to the consumer object. Here is where `Adapter` design patern comes to help.

### Problem

Let's imagine a case, that you have integrated a payment service, and you have only single payment functionality in place. But, here comes a request form bussiness, in which a subscription should be added, eventually a subscription payment should be added as well. Let's consider the third party payment service pretty rudimentary, and it does not have it's own subscription payments functionality, only transactions API.

This way you need to adapt the incoming payment request, in order to perform a transaction. For that purpose an adapter structure will be created in order to translate the subscription payment request.

### Solution

Let's take a look on the code:

```go
type StripeService struct{}

func NewStripeService() StripeService {
	return StripeService{}
}

func (s StripeService) Execute(amount int, sender, receiver string) error {
	var err error

	// ... handling all Stripe API transaction logic, and return err if it occurs
	fmt.Printf("Paying $%d from %s to %s\n", amount, sender, receiver)

	return err
}

type Service interface {
	Execute(amount int, sender, receiver string) error
}

type PaymentsService struct {
	service Service
}

func NewPaymentsService(service Service) PaymentsService {
	return PaymentsService{service}
}

func (p PaymentsService) MakeTransaction(payment Payment) error {
	var err error

	err = p.service.Execute(
		payment.GetAmount(),
		payment.GetSenderID(),
		payment.GetRecipientID(),
	)

	return err
}
```

Here are defined the Stripe library with specific interface, and payments service, which actually handles the payment logic.

Next, we will take a look on `SinglePayment` structure:

```go
type Payment interface {
	GetAmount() int
	GetRecipientID() string
	GetSenderID() string
}

type SinglePayment struct {
	senderID    string
	recipientID string
	amount      int
}

func NewSinglePayment(amount int, senderID, recipientID string) *SinglePayment {
	return &SinglePayment{senderID, recipientID, amount}
}

func (sp SinglePayment) GetAmount() int {
	return sp.amount
}

func (sp SinglePayment) GetSenderID() string {
	return sp.senderID
}

func (sp SinglePayment) GetRecipientID() string {
	return sp.recipientID
}
```


Now, let's assume that subscription structure will have a different interface, like following:

```go
type SubscriptionPayment struct {
	customerID       string
	subscriptionPlan string
	units            int
}

func NewSubscriptionPayment(customerId, subscriptionPlan string, units int) *SubscriptionPayment {
	return &SubscriptionPayment{customerId, subscriptionPlan, units}
}

func (sb SubscriptionPayment) GetCustomerPaymentID() (string, error) {
	customer, err := customers.Find(sb.customerID)
	if err != nil {
		return "", err
	}

	return customer.paymentId, nil
}

func (sb SubscriptionPayment) GetSubscriptionPlan() string {
	return sb.subscriptionPlan
}

func (sb SubscriptionPayment) GetTimeUnits() int {
	return sb.units
}
```

In order to make it suitable for `PaymentsService` structure, we need to implement `Payment` interface. However that would break Single Responsibility Principle of this struct. This means we will need an adapter structure defined:

```go
type SubscriptionPaymentsAdapter struct {
	payment           SubscriptionPayment
	subscriptionPlans map[string]int
}

func NewSubscriptionPaymentsAdapter(payment SubscriptionPayment) *SubscriptionPaymentsAdapter {
	plans := map[string]int{
		"MONTHLY": 9990,
		"YEARLY":  24990,
	}
	return &SubscriptionPaymentsAdapter{payment, plans}
}

func (sp SubscriptionPaymentsAdapter) GetAmount() int {
	planFee, ok := sp.subscriptionPlans[sp.payment.GetSubscriptionPlan()]
	if !ok {
		return 0
	}
	return planFee * sp.payment.GetTimeUnits()
}

func (sp SubscriptionPaymentsAdapter) GetSenderID() string {
	id, _ := sp.payment.GetCustomerPaymentID()
	return id
}

func (sp SubscriptionPaymentsAdapter) GetRecipientID() string {
	return os.Getenv("COMPANY_PAYMENT_ID")
}
```


The code for handling this kind of architecture will be as follows:

```go
	var payment Payment
	service := NewPaymentsService(NewStripeService())
	payment = NewSinglePayment(200, "A", "B")

	service.MakeTransaction(payment)

	subscriptionPayment := NewSubscriptionPayment("2", "MONTHLY", 2)
	payment = NewSubscriptionPaymentsAdapter(*subscriptionPayment)
	service.MakeTransaction(payment)
```


This way, the subscription payment, that at first sight is not compatible with payment interface, can be used as a payment. Of course this example illustrates only the payment logic part, but this can be valable for different functionalities as well.



### Conclusion

This pattern is also useful for wrapping up some third party library code so that can not be changed, and it will provide application specific logic, based on other kind of interfaces
