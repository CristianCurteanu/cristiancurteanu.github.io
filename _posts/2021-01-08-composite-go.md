---
layout: tw_post
title:  "Design patterns in Go: Composite"
date:   2021-01-08T18:30:59Z
permalink: /blog/go/composite-design-pattern
description: "Here we will see how Composite design pattern can be implemented and used"
categories: ["Software engineering", "Golang"]
tags: ["go", "golang", "composite", "design-patterns"]
image: https://images.unsplash.com/photo-1445294211564-3ca59d999abd?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2800&h=550&q=80
---


Imagine that you have several types of objects, for which you have to extract same data. Things are getting more interesting when you have hierarchies of such types. How this can solved: obviously using `Composite` design pattern. Let's see a more specific example, in order to understand better.

### Problem

Let's imagine that your are building the ordering model for an ecommerce app. The business asks you to calculate the price of the entire order, including the delivery price that is added for company's service.

As a naive approach, you will sum all items' prices with delivery cost. That works really great if you have specific products. But let's imagine that business also asks you to model some product binding, for which can be applied a discount. Well, that a bit trickier, and if you will apply the same naive approach, it will result into more code that needs to be adjusted.

But in this case, it would be easier to use a common interface for the entire types hierarchy, that will extract the prices for all products and bindings, and sum it up with delivery price. This is how the `Composite` design pattern works.

### Solution

So basically the __Composite__ design pattern imply a definition of an interface that will be used and implemented by a container, that will expose the interface for the outside world. In our case described above, the container role has the `Order` object.

Let's define the common interface:

```go
type Pricing interface {
	GetPrice() int
}
```

It is pretty straightforward, it just return an int, that will have the role of pricing. The `int` data type is chosen for a reason.

Next let's define the `Product` struct:

```go
type Product struct {
	Name  string
	Price int
}

func NewProduct(name string, price int) *Product {
	return &Product{name, price}
}

func (p Product) GetPrice() int {
	return p.Price
}
```

And the `ProductBinding`:

```go
type ProductBinding struct {
	Items    []Product
	Discount int
}

func NewProductBinding(discount int) *ProductBinding {
	return &ProductBinding{Discount: discount}
}

func (pb *ProductBinding) Add(item Product) *ProductBinding {
	pb.Items = append(pb.Items, item)

	return pb
}

func (pb ProductBinding) GetPrice() int {
	var result int

	for _, item := range pb.Items {
		result += item.Price
	}

	return result - pb.Discount
}

```

and of course the `Order` struct:

```go
type Order struct {
	DeliveryPrice int
	Package       []Pricing
}

func (o Order) GetPrice() int {
	result := o.DeliveryPrice

	for _, item := range o.Package {
		result += item.GetPrice()
	}

	return result
}

func (o *Order) SetPrice(price int) *Order {
	o.DeliveryPrice = price

	return o
}

func (o *Order) Add(item Pricing) *Order {
	o.Package = append(o.Package, item)

	return o
}
```


As you noticed, all structures implemend the `Pricing` interface, and this is critical, since the `Order` struct, does operate with that type of objects, even if the internals of each type, is very different.

Now, let's see the client's code, how all these structures can be used:

```go
var order Order

singleItem := NewProduct("iPhone", 35590)

binding := NewProductBinding(2000)
binding.Add(*NewProduct("iPhone Charger", 12200))
binding.Add(*NewProduct("AirPods", 15900))

order.SetPrice(1500)
order.Add(singleItem)
order.Add(binding)

fmt.Printf("Total price: %d\n", order.GetPrice())
```

which will produce:

```
Total price: 63190
```


You can do the math, but I am pretty sure the result is correct :smile:



### Conclusion

This way, new kind of items can be added to business logic model, and it will still operate properly, and calculate the package delivery cost, simply by implementing the `Pricing` interface.
