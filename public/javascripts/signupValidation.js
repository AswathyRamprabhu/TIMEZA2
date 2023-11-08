document.addEventListener('DOMContentLoaded', function () {
  const signupForm = document.getElementById('otpform');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneNumberInput = document.getElementById('phonenumber');
  const passwordInput = document.getElementById('form3Example4c');
  const otpInput = document.getElementById('typeOtpX');
  const errorDiv = document.querySelector('.error-message');

  // Create error message elements for each input
  const nameError = document.createElement('div');
  const emailError = document.createElement('div');
  const phoneNumberError = document.createElement('div');
  const passwordError = document.createElement('div');
  const otpError = document.createElement('div');

  // Function to validate the name
  function validateName(name) {
    if (name.trim() === '') {
      return 'Name is required';
    }
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return 'Name should only contain letters and spaces';
    }
    return '';
  }

  // Function to validate the email
  function validateEmail(email) {
    if (email.trim() === '') {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Invalid email format';
    }
    return '';
  }

  // Function to validate the phone number
  function validatePhoneNumber(phoneNumber) {
    if (phoneNumber.trim() === '') {
      return 'Phone number is required';
    }
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      return 'Phone number should have exactly 10 digits';
    }
    if (/^(\d)\1{9}$/.test(phoneNumber)) {
      return 'Phone number cannot consist of the same digit repeated 10 times';
    }
    return '';
  }


  // Function to validate the password
  function validatePassword(password) {
    // Minimum length of 8 characters
  if (password.length < 8) {
    return 'Password should have at least 8 characters';
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return 'Password should include at least one uppercase letter';
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return 'Password should include at least one lowercase letter';
  }

  // At least one digit
  if (!/\d/.test(password)) {
    return 'Password should include at least one digit';
  }

  // At least one special character
  if (!/[!@#$%^&*]/.test(password)) {
    return 'Password should include at least one special character (!@#$%^&*)';
  }

  // Return null if the password is strong
  return '';
}

  // Function to handle input events and display error messages under the respective input
  function handleInput(inputField, validationFunction, errorElement) {
    inputField.addEventListener('input', function () {
      const errorMessage = validationFunction(inputField.value);
      errorElement.textContent = errorMessage;
    });
  }

  // Add input event listeners for each input field
  handleInput(nameInput, validateName, nameError);
  handleInput(emailInput, validateEmail, emailError);
  handleInput(phoneNumberInput, validatePhoneNumber, phoneNumberError);
  handleInput(passwordInput, validatePassword, passwordError);

  // Function to handle form submission
  function handleSubmit(event) {
    const name = nameInput.value;
    const email = emailInput.value;
    const phoneNumber = phoneNumberInput.value;
    const password = passwordInput.value;
    const otp = otpInput.value;

    let isValid = true;
    let errorMessage = '';

    if (name.trim() === '') {
      errorMessage = 'Name is required';
      nameError.textContent = errorMessage;
      isValid = false;
    } else if (!/^[A-Za-z\s]+$/.test(name)) {
      errorMessage = 'Name should only contain letters and spaces';
      nameError.textContent = errorMessage;
      isValid = false;
    } else if (email.trim() === '') {
      errorMessage = 'Email is required';
      emailError.textContent = errorMessage;
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorMessage = 'Invalid email format';
      emailError.textContent = errorMessage;
      isValid = false;
    } else if (phoneNumber.trim() === '') {
      errorMessage = 'Phone number is required';
      phoneNumberError.textContent = errorMessage;
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(phoneNumber)) {
      errorMessage = 'Phone number should have exactly 10 digits';
      phoneNumberError.textContent = errorMessage;
      isValid = false;
    } else if (password.length < 4) {
      errorMessage = 'Password should have at least 4 characters';
      passwordError.textContent = errorMessage;
      isValid = false;
    } else if (!/\d/.test(password)) {
      errorMessage = 'Password should contain at least one number';
      passwordError.textContent = errorMessage;
      isValid = false;
    } else if (otp.trim() === '') {
      errorMessage = 'Enter the OTP';
      otpError.textContent = errorMessage;
      isValid = false;
    }

    if (!isValid) {
      event.preventDefault();
    }
  }

  // Add event listener to form submit event
  signupForm.addEventListener('submit', handleSubmit);

  // Append error message elements to their respective input containers
  nameInput.parentNode.appendChild(nameError);
  emailInput.parentNode.appendChild(emailError);
  phoneNumberInput.parentNode.appendChild(phoneNumberError);
  passwordInput.parentNode.appendChild(passwordError);
  otpInput.parentNode.appendChild(otpError);
});





