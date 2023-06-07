document.addEventListener("DOMContentLoaded", async function() {
  let url = new URL(window.location.href)

  let contentFilter = new ContentFilter({
    searchParams: url.searchParams
  })
  if (url.searchParams.has("tag")) {
    await contentFilter.emptyPostsContainer().setType("tag").setEndpoint("/api/tags.json").fetchData()
    contentFilter.renderContent()
  } else if (url.searchParams.has("category")) {
    await contentFilter.emptyPostsContainer().setType("category").setEndpoint("/api/categories.json").fetchData()
    contentFilter.renderContent()
  }
})

function ContentFilter({ searchParams, id = "posts-container" }) {
  this.searchParams = searchParams
  this.id = id
  this.data = null
  this.postsContainer = document.getElementById(id)
  return this
}

ContentFilter.prototype.emptyPostsContainer = function() {
  this.postsContainer.innerHTML = null
  return this
}

ContentFilter.prototype.setEndpoint = function(endpoint) {
  this.endpoint = endpoint
  return this
}

ContentFilter.prototype.setType = function(type) {
  this.type = type
  return this
}

ContentFilter.prototype.fetchData = async function() {
  let data = await (await (fetch(this.endpoint)
    .then(res => {
      return res.json()
    })
    .catch(err => {
      console.log('Error: ', err)
    })
  ))
  this.data = data
  return this
}

ContentFilter.prototype.renderContent = function() {
  let posts = this.data.find(e => e.name === this.searchParams.get(this.type)).posts
  let content = posts.map(post => renderPost(post)).join("")
  this.postsContainer.innerHTML = content
}


const button = document.querySelector('[data-collapse-toggle]');
if (button) {
  const menu = document.querySelector('#' + button.dataset.collapseToggle);
  button.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });
}


(function () {
  var width = window.innerWidth;

  window.addEventListener('resize', function () {
    console.log(document.body.clientWidth + ' wide by ' + document.body.clientHeight+' high');
    console.log('ev :>> ', ev);
  });
})();
