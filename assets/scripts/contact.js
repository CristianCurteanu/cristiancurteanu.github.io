let successMessage = document.getElementById("contact-success")
successMessage.style.display = "none"

let submitBtn = document.querySelector('button[data-contact="submit"]')

submitBtn.addEventListener("click", async function(event) {
  event.preventDefault()

  let response = null
  try {
    let data = {
      fields: {
        Email:   document.querySelector('input[data-contact="email"]').value,
        Name:    document.querySelector('input[data-contact="name"]').value,
        Message:   document.querySelector('textarea[data-contact="message"]').value,
      }
    }
  debugger

    response = await fetch("https://api.airtable.com/v0/appCDLZKbd7e0C9T2/Feedback", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer keymclD7OmM2sb4C8'
      },
      body: JSON.stringify(data),
      mode: "cors"
    });
  } catch (error) {
    successMessage.style.display = "none"
    console.log(error)
  } finally {
    successMessage.style.display = "inline-block"
    setTimeout(() => {
      successMessage.style.display = "none"
    }, 3500)
  }
})
