
var newsletterSubmitBtn = document.querySelector('button[data-subscription-input]')
var newsletterEmailInput = document.getElementById(newsletterSubmitBtn.dataset['subscriptionInput'])
var successMessage = document.getElementById('subscription-success')

successMessage.style.display = "none"

newsletterSubmitBtn.addEventListener('click', async function(event) {
    event.preventDefault()
    try {
        response = await fetch('https://api.airtable.com/v0/appCDLZKbd7e0C9T2/Newsletter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer keymclD7OmM2sb4C8'
          },
          body: JSON.stringify({
            fields: {
                Email: newsletterEmailInput.value
            }
          }),
          mode: "cors"
        });
        newsletterEmailInput.value = ""
      } catch (error) {
        successMessage.style.display = "none"
      } finally {
        successMessage.style.display = "inline-block"
        setTimeout(() => {
          successMessage.style.display = "none"
        }, 3500)
      }
})