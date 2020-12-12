let searchButton = document.getElementById("post-search-btn")
let searchBar = document.getElementById("post-search-bar")
let url = new URL(window.location.href)

searchButton.addEventListener("click", async function(e) {
  e.preventDefault()

  let data = await (await (fetch("/api/posts.json")
    .then(res => {
      return res.json()
    })
    .catch(err => {
      console.log('Error: ', err)
    })
  ))

  let filteredPosts = []
  if (searchBar.value === "") {
    let contentFilter = new ContentFilter({
      searchParams: url.searchParams
    })
    if (url.searchParams.has("tag")) {
      await contentFilter.emptyPostsContainer().setType("tag").setEndpoint("/api/tags.json").fetchData()
      contentFilter.renderContent()
      return
    } else if (url.searchParams.has("category")) {
      await contentFilter.emptyPostsContainer().setType("category").setEndpoint("/api/categories.json").fetchData()
      contentFilter.renderContent()
      return
    } else {
      filteredPosts = data
    }
  } else {
    let searchBarValue = searchBar.value.toLowerCase()
    filteredPosts = data.filter(post => {
      let isTitle = post.title.toLowerCase().includes(searchBarValue)
      let isDescription = post.description.toLowerCase().includes(searchBarValue)
      let isTag = post.tags.includes(searchBarValue)

      return isTitle || isDescription || isTag
    })
  }

  let content = filteredPosts.map(post => renderPost(post)).join("")
  let postsContainer = document.getElementById("posts-container")
  postsContainer.innerHTML = content
})
