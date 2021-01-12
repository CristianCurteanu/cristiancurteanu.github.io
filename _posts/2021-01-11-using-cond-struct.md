---
layout: post
title:  "Using Go Cond struct"
date:   2021-01-11T18:52:59Z
permalink: /blog/go/cond-struct
description: "Take a look on an simple way to synchronize a custom made buffered structure, using Cond struct from Go standard library"
categories: ["Golang"]
tags: ["go", "golang", "concurrency", "cond", "synchronisation"]
cover: https://images.unsplash.com/photo-1549367805-f0ae50e2cf38?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1850&h=750&q=80
---



I challenged myself a while ago to make a piece of software in Go, that would download HTTP resources in a concurrent manner, just by giving a JSON file that will contain a list of URLs for all resources.

On the first attempt, I decided to split the list of URLs into batches, then for each URL in each batch, there will be a goroutine launched, and the entire batch will wait until all goroutines will finish their job, after which the next batch will be processed. 

The main problem with this approach is that, even if a resource have been downloaded, it is required to wait until the biggest resource will be downloaded, which makes it redundant to wait until the entire batch will be processed.

I was also thinking about enqueuing the urls that should be processed, however I failed to implement this idea using channels.

Recently, I found out about Go's `sync.Cond` structure. The main idea of this package is to block execution, until some, or all, goroutines will fire a signal for finishing the processing (pretty much like channels). But it proves itself as a more flexible solution than channels, and consumes less resources.

Let's take a look on implementation.

### Solution

I refined solution to a struct, which is more convenient, and using Mutex provides a more restrictive scope, which helps to prevent race conditions.

```go
type VideoDownloader struct {
	queue       []string
	urls        []string
	bufferSize  int
	downloaded  int
	cond        *sync.Cond
	filesFormat string
}

func NewHttpDownloader() *VideoDownloader {
	return &VideoDownloader{
		cond:        sync.NewCond(&sync.Mutex{}),
		bufferSize:  runtime.NumCPU(),
		filesFormat: "mp4",
	}
}
```


This is how the end structure looks like. I used builder pattern to set up the `urls`, `filesFormat` and `bufferSize`, and here are the method for instance setup:

```go
func (vd *HttpDownloader) SetBufferSize(size int) *HttpDownloader {
	vd.bufferSize = size

	return vd
}

func (vd *HttpDownloader) SetUrls(urls []string) *HttpDownloader {
	vd.urls = urls

	return vd
}

func (vd *HttpDownloader) SetFilesFormat(format string) *HttpDownloader {
	vd.filesFormat = format

	return vd
}
```

I think these are pretty straightforward. Let's take a look on downloading part, which is more interesting:

```go
func (vd *HttpDownloader) Download() {
	for i, url := range vd.urls {
		vd.cond.L.Lock()

		for len(vd.queue) == vd.bufferSize {
			vd.cond.Wait()
		}
		vd.queue = append(vd.queue, url)
		fmt.Println("Adding to queue #", i)

		go vd.getFile(url, i)
		vd.cond.L.Unlock()
	}
	vd.cond.L.Lock()
	for vd.downloaded != len(vd.urls) {
		vd.cond.Wait()
	}
	vd.cond.L.Unlock()
}

func (vd *HttpDownloader) getFile(url string, id int) {
	filename := fmt.Sprintf("%d.%s", id, vd.filesFormat)
	err := DownloadFile(filename, url)
	if err != nil {
		fmt.Println("err:", err)
		return
	}
	fmt.Println("Downloaded", filename)
	vd.cond.L.Lock()
	vd.queue = vd.queue[1:]
	vd.downloaded += 1
	vd.cond.L.Unlock()
	vd.cond.Signal()
}
```


In `Download` method, first we iterate though all the URLs, until we fill up the `queue`. If the queue will be full, we block the execution of this loop, until a resource will be downloaded and queue will dequeue an URL. This will actually happen in a invoked goroutine, in `getFile` method.

There is also one thing: the `downloaded` counter. After going through all the URLs, the loop exits and the runtime ends. Usually this causes several of last resources not to be downloaded. To avoid that, there is a second block, which will wait until all the resources will be downloaded.

Finally, the function that will actually run the download:

```go
func DownloadFile(filepath string, url string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Create the file
	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	return err
}
```



If it would be used in a main file, this is how the test code would look like:

```go
	jsonFile, err := os.Open("urls.json")
	if err != nil {
		fmt.Println(err)
	}
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)
	var urls []string

	json.Unmarshal(byteValue, &urls)

	videoDownloader := NewHttpDownloader()
	videoDownloader.SetBufferSize(3).SetUrls(urls).SetFilesFormat("mp4").Download()
```

As you can see here, this program is used to download a list of videos, exposed on the web via HTTP. 

The result of this would be the following:

```
Adding to queue # 0
Adding to queue # 1
Adding to queue # 2
Downloaded 1.mp4
Adding to queue # 3
Downloaded 2.mp4
Adding to queue # 4
Downloaded 3.mp4
Adding to queue # 5
Downloaded 5.mp4
Adding to queue # 6
Downloaded 0.mp4
Adding to queue # 7
Downloaded 6.mp4
Adding to queue # 8
Downloaded 4.mp4
Adding to queue # 9
Downloaded 8.mp4
Adding to queue # 10
Downloaded 7.mp4
Adding to queue # 11
Downloaded 11.mp4
Adding to queue # 12
Downloaded 10.mp4
Adding to queue # 13
Downloaded 9.mp4
Adding to queue # 14
Downloaded 12.mp4
Adding to queue # 15
Downloaded 13.mp4
Adding to queue # 16
Downloaded 16.mp4
Downloaded 15.mp4
Downloaded 14.mp4
```


This way, the videos were downloaded concurrently. Once a video was finished to be downloaded, the process started to download the next one. 

Even though that it is working, I think that it is still very raw, and I would highly appreciate any ideas and criticism in the comments.