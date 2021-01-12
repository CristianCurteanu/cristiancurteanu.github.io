---
layout: post
title:  "Mutexes and RWMutex in Golang"
date: 2021-01-07T15:35:59Z
permalink: /blog/go/mutex-and-rwmutex
description: "Have you ever experienced in memory race conditions in Golang? Here is how you can solve them, by using sync package"
categories: ["Golang"]
tags: ["go", "golang", "concurrency", "mutex", "race-condition"]
cover: https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1800&h=850&q=80
---


If you have ever used processing using multiple threads, you probably are fully aware about what are race conditions.

Just to recap, it happens when two processing threads are accessing the same value in memory, and are changing it. Because of non-deterministic nature of concurrent threads, the value stored will comply for only one specific thread, which leads to a inconsistent behaviour. If you are working on a payment system, or a banking software this can can cost business huge amount of money.

To avoid that, there is a mechanism in go for locking the value in the memory, called `Mutext`. This stands for mutual exclusion, and what it means is that it keeps track of which thread has access to specific value in memory, at specific point in time.

Let's consider the following piece of code:

```go
type Account struct {
	balance int
	Name    string
}

func (a *Account) Withdraw(amount int) {
	a.balance -= amount
}

func (a *Account) Deposit(amount int) {
	a.balance += amount
}

func (a *Account) GetBalance() int {
	return a.balance
}
```

It is a pretty simple structure in Go, that keeps track of accounts balance, nothing so special. However, if we will try to withdraw, or deposit an amount on some specific account from multiple goroutines, it will inevitably lead to a race condition, like this:

```go
var account Account
account.Name = "Test account"

for i := 0; i < 20; i++ {
  wg.Add(1)
  go account.Deposit(100)
}

for i := 0; i < 10; i++ {
  wg.Add(1)
  go account.Withdraw(100)
}

wg.Wait()
fmt.Printf("Balance: %d\n", account.GetBalance())
```

This means, that when running this code several times, the value of balance will be inconsistent, meaning it will have different values. In order to avoid that, we need to add locks for both reading and writing to the values. In our case, the `Mutex` lock will be added as a field to this structure, which Golang runtime will understand, that this lock is applied for the scope of this specific struct:

```go
type Account struct {
	balance int
	Name    string
	lock    sync.Mutex
}

func (a *Account) Withdraw(amount int, wg *sync.WaitGroup) {
	defer wg.Done()
	a.lock.Lock()
	a.balance -= amount
	a.lock.Unlock()
}

func (a *Account) Deposit(amount int, wg *sync.WaitGroup) {
	defer wg.Done()
	a.lock.Lock()
	a.balance += amount
	a.lock.Unlock()
}

func (a *Account) GetBalance() int {
	a.lock.Lock()
	defer a.lock.Unlock()

	return a.balance
}
```

and the client code will now look like this:

```go
	var account Account
	var wg sync.WaitGroup

	account.Name = "Test account"

	for i := 0; i < 20; i++ {
		wg.Add(1)
		go account.Deposit(100, &wg)
	}

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go account.Withdraw(100, &wg)
	}

	wg.Wait()
	fmt.Printf("Balance: %d\n", account.GetBalance())
```


Now, it is more consistent, and the value of the balance will be the same.

### Problem solved, why we need RWMutex?

That's fair enough. But the problem is, that when using `Mutex` the value from the memory will be locked until the `Unlock` method will be invoked. This is also valable for the reading phase. In order to make reading accessible for multiple threads, the `Mutex` can be replaced with `RWMutex`, and for reading it will be used `RLock` and `RUnlock` methods.

In this case the code will look something like this:

```go
type Account struct {
	balance int
	Name    string
	lock    sync.RWMutex
}

func (a *Account) Withdraw(amount int, wg *sync.WaitGroup) {
	defer wg.Done()
	a.lock.Lock()
	a.balance -= amount
	a.lock.Unlock()
}

func (a *Account) Deposit(amount int, wg *sync.WaitGroup) {
	defer wg.Done()
	a.lock.Lock()
	a.balance += amount
	a.lock.Unlock()
}

func (a *Account) GetBalance() int {
	a.lock.RLock()
	defer a.lock.RUnlock()

	return a.balance
}
```



### Conclusion

Race conditions very often are hard to detect, and can lead to serious bugs in system functionality. The most straightforward approach would be to use `Mutex` for locking your critical data. The `RWMutex` can be used if, and only if there are a limited number of concurrent readers of that data. Starting from a number of concurrent readers, it may become ineffective to use `RWMutex`.
