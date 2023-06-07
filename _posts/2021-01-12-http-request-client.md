---
layout: tw_post
title:  "Create an alternative for Fetch API on top of XMLHttpRequest"
date:   2021-01-12T13:12:59Z
permalink: /blog/js/fetch-api-alternative
description: "Let's build a HTTP client library, similar to Fetch API function, on top of XMLHttpRequest"
categories: ["JavaScript"]
tags: ["js", "javascript", "http", "promises"]
image: https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1850&h=750&q=80
---


When using `fetch` API function from the JS standard library, it annoys me every single time I want to process the response. So, I decided to create a wrapper for XMLHttpRequest prototype, which will make it simpler to handle the response, and will have similar interface with Fetch API (basically an alternative for Fetch API on top of XMLHttpRequest).

### Getting started

`XMLHttpRequest` provides quite a simple API for handling HTTP requests, even though is oriented on callbacks interface, that are responding for specific events, and provide data from response.

Let's start with first version of `httpRequest` API function:

```js
let httpRequest = function(method, url, { headers, body, options } = {}) {
  method = method.toUpperCase()

  let xhr = new XMLHttpRequest()
  xhr.withCredentials = true;
  xhr.open(method, url)

  xhr.setRequestHeader("Content-Type", "application/json")
  for (const key in headers) {
    if (Object.hasOwnProperty.call(headers, key)) {
      xhr.setRequestHeader(key, headers[key])
    }
  }
  
  xhr.send(body)

  return new Promise((resolve, reject) => {
    xhr.onload = function() {
      resolve(new HttpResponse(xhr))
    }

    xhr.onerror = function() {
      reject(new HttpError(xhr))
    }
  })
}
```

As we can see here, the function receives the HTTP method and URL as required parameters. After creating the basic objects it needs to operate with, it sends the request. The function is returning a promise, that wraps the event callbacks for `xhr` request object. When a specific event is triggered, the promise resolvers are sending wrapped values of `HttpResponse` and `HttpError`.

As a side note, here was also enabled the CORS, by setting the `withCredentials` to a `true` value; which means that it should be enabled on the server as well, in order to execute requests properly.

Now, we will define the `HttpResponse` prototypes:

```javascript
let HttpResponse = function(xhr) {
  this.body = xhr.response
  this.status = xhr.status
  this.headers = xhr.getAllResponseHeaders().split("\r\n").reduce((result, current) => {
    let [name, value] = current.split(': ');
    result[name] = value;
    return result;
  })
  this.parser = new DOMParser();
}

HttpResponse.prototype.json = function() {
  return JSON.parse(this.body)
}

HttpResponse.prototype.getAsDOM = function() {
  return this.parser.parseFromString(this.body, "text/html")
}
```

The only thing that it does it takes in the `XMLHttpRequest` object, and decomposes only those specific fields, that represents most interest when handling an HTTP Response: `status`, `body` and `headers` . The `parser` field is defined to be used in `getAsDOM` method. That specific method parses a `text/html` content, and transforms it into a DOM object.

The `json` method is pretty straightforward: it parses a JSON from the body.

Let's take a look on `HttpError` prototype now: 

```javascript
let HttpError = function(xhr) {
  this.body = xhr.response
  this.status = xhr.status
  this.headers = xhr.getAllResponseHeaders().split("\r\n").reduce((result, current) => {
    let [name, value] = current.split(': ');
    result[name] = value;
    return result;
  })
}

HttpError.prototype.toString = function() {
  let json = JSON.parse(this.body)
  return "["+ this.status + "] Error: " + json.error || json.errors.map(e => e.message).join(", ")
}
```

This is pretty similar with `HttpResponse` prototype, however, it just provides only a functionality to unwrap the error messages following a specific convention for JSON error messages.

Let's check how it works:

```js
let response = await httpRequest("GET", "https://api.your-domain.com/resource/1")
response.json()
```

This will return a JSON body of the response. 

### Track progress of the upload

Another feature that `Fetch` API lacks, is the upload progress tracking. We can also add it, as a callback to `options` field of the input object. Also, we need to track if there is something wrong during request, to receive an error.

The second version will cover all these changes:

```js
let httpRequest = function(method, url, { headers, body, options } = {}) {
  method = method.toUpperCase()

  let xhr = new XMLHttpRequest()
  xhr.withCredentials = true;
  xhr.open(method, url, true)

  xhr.setRequestHeader("Content-Type", "application/json")
  for (const key in headers) {
    if (Object.hasOwnProperty.call(headers, key)) {
      xhr.setRequestHeader(key, headers[key])
    }
  }

  if (options && options.hasOwnProperty("checkProgress")) {
    xhr.upload.onprogress = options.checkProgress
  }
  xhr.send(body)

  return new Promise((resolve, reject) => {
    xhr.onload = function() {
      resolve(new HttpResponse(xhr))
    }

    xhr.onerror = function() {
      reject(new HttpError(xhr))
    }

    xhr.onabort = function() {
      reject(new HttpError(xhr))
    }
  })
}
```


Let's see how it will look for a `POST` request:

```js
let response = await httpRequest("POST", "https://api.your-domain.com/resource", {
  body: JSON.stringify({"subject":"TEST!"}),
  options: {
    checkProgress: function(e) {
      console.log('e:', e)
    }
  }
})
response.status
```


Let's take a look one more time on the full implementation:

```javascript

let HttpResponse = function(xhr) {
  this.body = xhr.response
  this.status = xhr.status
  this.headers = xhr.getAllResponseHeaders().split("\r\n").reduce((result, current) => {
    let [name, value] = current.split(': ');
    result[name] = value;
    return result;
  })
  this.parser = new DOMParser();
}

HttpResponse.prototype.json = function() {
  return JSON.parse(this.body)
}

HttpResponse.prototype.getAsDOM = function() {
  return this.parser.parseFromString(this.body, "text/html")
}


let HttpError = function(xhr) {
  this.body = xhr.response
  this.status = xhr.status
  this.headers = xhr.getAllResponseHeaders().split("\r\n").reduce((result, current) => {
    let [name, value] = current.split(': ');
    result[name] = value;
    return result;
  })
}

HttpError.prototype.toString = function() {
  let json = JSON.parse(this.body)
  return "["+ this.status + "] Error: " + json.error || json.errors.join(", ")
}

let httpRequest = function(method, url, { headers, body, options } = {}) {
  method = method.toUpperCase()

  let xhr = new XMLHttpRequest()
  xhr.withCredentials = true;
  xhr.open(method, url, true)

  xhr.setRequestHeader("Content-Type", "application/json")
  for (const key in headers) {
    if (Object.hasOwnProperty.call(headers, key)) {
      xhr.setRequestHeader(key, headers[key])
    }
  }

  if (options && options.hasOwnProperty("checkProgress")) {
    xhr.upload.onprogress = options.checkProgress
  }
  xhr.send(body)

  return new Promise((resolve, reject) => {
    xhr.onload = function() {
      resolve(new HttpResponse(xhr))
    }

    xhr.onerror = function() {
      reject(new HttpError(xhr))
    }

    xhr.onabort = function() {
      reject(new HttpError(xhr))
    }
  })
}
```


This small piece of code take advantage of the `XMLHttpRequest` library, and still has a similar API. Of course there is a lot of space for improvement, so if you can, please share your ideas in the comments.