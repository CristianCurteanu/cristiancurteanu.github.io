
document.addEventListener("scroll", function(e) {
  let navbar = document.getElementsByTagName("nav")[0];
  if (window.scrollY !== 0) {
    navbar.classList.remove("position-absolute", "bg-none", "text-white")
    navbar.classList.add("position-fixed", "bg-body")
    document.querySelectorAll("nav .text-white").forEach(e => { e.classList.remove("text-white"); e.classList.add("text-dark") })
  } else {
    navbar.classList.add("position-absolute", "bg-none", "text-white")
    navbar.classList.remove("position-fixed", "bg-body")
    document.querySelectorAll("nav .text-dark").forEach(e => { e.classList.add("text-white"); e.classList.remove("text-dark") })
  }
})
