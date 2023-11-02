document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form'); // Assuming your form has only one form element

    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent the form from submitting

        // Validate the username
        const usernameInput = form.querySelector('input[name="username"]');
        const username = usernameInput.value;
        const errorMessage = form.querySelector('.error-message');

        if (!/^[A-Z][a-zA-Z]*$/.test(username)) {
            errorMessage.textContent = 'Username should start with an uppercase letter and contain only letters.';
            return; // Do not proceed with form submission
        }

        // If validation passes, you can submit the form
        form.submit();
    });
});
