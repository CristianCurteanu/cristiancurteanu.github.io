function renderPost(post) {
  console.log('post.target', post)
  // return `
  //   <div class="row shadow p-5">
  //     <a href="${post.url}" target="${post.target}" class="text-dark">
  //       <h3>${post.title}</h3>
  //     </a>
  //     <p class="text-decoration-underline text-black-50">${post.date}</p>
  //     <p class="text-dark">${post.description}</p>
  //     <a href="${post.url}" target="${post.target}">Read article</a>
  //   </div>
  // `
  return `
    <div class="lg:flex">
      <img src="${ post.image }" class="object-cover w-full h-56 rounded-lg lg:w-64" alt="">
      <div class="flex flex-col justify-between py-6 lg:mx-6">
          <a href="${post.url}" class="text-xl font-semibold text-gray-800 hover:underline dark:text-white ">
              ${ post.title }
          </a>
          <p>
              ${ post.description }
          </p>
          <span class="text-sm text-gray-500 dark:text-gray-300">
              ${ post.date }
          </span>
      </div>
    </div>
  `
}
