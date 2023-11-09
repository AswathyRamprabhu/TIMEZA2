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


// Get references to elements
// const form = document.getElementById("otpform");
// const myButton = document.getElementById("sendOtp");
// const otpmessage = document.getElementById('otpmessage');

// myButton.addEventListener("click", function (e) {
//   e.preventDefault();

//   fetch("/sendotp", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ email: form.email.value }),
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       console.log(data);
//       if (data.status === "OTP_SEND") {
//         otpmessage.textContent = "OTP sent to your mail";
//       } else {
//         otpmessage.textContent = "Failed to send OTP"; // Add this for error handling
//       }
//     })
//     .catch((error) => {
//       console.error(error);
//       otpmessage.textContent = "Error sending OTP"; // Display an error message
//     });
// });

// function validateNumber(event) {
//   var input = event.target;
//   input.value = input.value.replace(/\D/g, "");
// }

document.addEventListener("DOMContentLoaded", function () {
  const myButton = document.getElementById("sendOtp");
  const form = document.getElementById("otpform");

  const otpmessage = document.getElementById('otpmessage');
  console.log("Button clicked!"); 
  myButton.addEventListener("click", function (e) {
    e.preventDefault();
    console.log("Send OTP button clicked!"); // Add this line

    console.log("Before fetch");
  fetch("/sendotp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: form.email.value }),
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    console.log("Server response:", data); // Log the server response

    if (data.status === "OTP_SEND") {
      otpmessage.textContent = "OTP sent to your mail!";
      otpmessage.style.display = "block";
      console.log('Email sent:', data.emailResponse); // Log the email response
    } else {
      otpmessage.textContent = "Failed to send OTP!";
      otpmessage.style.display = "block";
    }
  })
  .catch((error) => {
    console.error("Fetch error:", error);
    otpmessage.textContent = "Error sending OTP";
    otpmessage.style.display = "block";
  });
  
});
});