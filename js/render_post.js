function renderPost(post) {
  return `
    <div class="row shadow p-5">
      <a href="${post.url}" class="text-dark">
        <h3>${post.title}</h3>
      </a>
      <p class="text-decoration-underline text-black-50">${post.date}</p>
      <p class="text-dark">${post.description}</p>
      <a href="${post.url}">Read article</a>
    </div>
  `
}
