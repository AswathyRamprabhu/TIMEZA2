// const form = document.getElementById("otpform");
// const myButton = document.getElementById("sendOtp");
// const email = document.getElementById("email")
// const otpmessage = document.getElementById('otpmessage');


// myButton.addEventListener("click", function (e) {
//   console.log("otp validation page");

//   e.preventDefault()

//   fetch("/sendotp", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ email: form.email.value }),
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       if (data.status === "OTP_SEND") {
//         otpmessage.textContent = "OTP sent to your mail"
//       }
//     })
//     .catch((error) => console.error(error));
// });

// function validateNumber(event) {
//   var input = event.target;
//   input.value = input.value.replace(/\D/g, "");
// }



console.log("otp validation page");

// Get references to elements
const form = document.getElementById("otpform");
const myButton = document.getElementById("sendOtp");
const otpmessage = document.getElementById('otpmessage');

myButton.addEventListener("click", function (e) {
  e.preventDefault();

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
        otpmessage.textContent = "OTP sent to your mail";
      } else {
        otpmessage.textContent = "Failed to send OTP"; // Add this for error handling
      }
    })
    .catch((error) => {
      console.error(error);
      otpmessage.textContent = "Error sending OTP"; // Display an error message
    });
});

function validateNumber(event) {
  var input = event.target;
  input.value = input.value.replace(/\D/g, "");
}
