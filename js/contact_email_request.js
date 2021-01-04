let contactForm = document.getElementById("email-contact-form")
let alertSuccess = document.getElementsByClassName("alert-success")[0]
alertSuccess.style.display = "none"

let formSpinner = document.getElementById("form-spinner")
formSpinner.style.display = "none"

let form = {
  subject:   document.getElementById("contact-form_subject"),
  sender:    document.getElementById("contact-form_email"),
  content:   document.getElementById("contact-form_content"),
  full_name: document.getElementById("contact-form_fullname")
}

document.getElementById("form-submit").addEventListener("click", async function(event) {
  event.preventDefault()

  let response = null
  formSpinner.style.display = "inline-block"

  try {
    response = await fetch(contactForm.getAttribute("action-url"), {
      method: 'POST',
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Request-Method": "post",
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify({
              subject:   form.subject.value,
              sender:    form.sender.value,
              content:   form.content.value,
              full_name: form.full_name.value
            }),
      mode: "cors"
    });
    formSpinner.style.display = "none"
  } catch (error) {
    formSpinner.style.display = "none"
  }

  try {
    let data = await response.json();
    if (data.status === "OK") {
      alertSuccess.style.display = "block"
      formSpinner.style.display = "none"
    }
    formSpinner.style.display = "none"
  } catch (error) {
    formSpinner.style.display = "none"
  }
})
