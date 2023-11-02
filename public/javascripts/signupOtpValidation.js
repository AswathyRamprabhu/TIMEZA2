
const form = document.getElementById("otpform");
const myButton = document.getElementById("sendOtp");
const email = document.getElementById("email")
const otpmessage = document.getElementById('otpmessage');


myButton.addEventListener("click", function (e) {
  e.preventDefault()

  fetch("/sendotp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: form.email.value }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "OTP_SEND") {
        otpmessage.textContent = "OTP sent to your mail"
      }
    })
    .catch((error) => console.error(error));
});

function validateNumber(event) {
  var input = event.target;
  input.value = input.value.replace(/\D/g, "");
}


