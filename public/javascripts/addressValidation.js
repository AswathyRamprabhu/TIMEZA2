document.addEventListener('DOMContentLoaded', function () {
    const addressForm = document.getElementById('addaddressform');
    const addressInput = document.querySelector('input[name="address"]');
    const addressError = document.getElementById('address-error');
    const cityInput = document.querySelector('input[name="city"]');
    const cityError = document.getElementById('city-error');
    const stateInput = document.querySelector('input[name="state"]');
    const stateError = document.getElementById('state-error');
    const pincodeInput = document.querySelector('input[name="pincode"]');
    const pincodeError = document.getElementById('pincode-error');

    addressForm.addEventListener('submit', function (event) {
        // Check if any field is empty and validate
        if (!isValidAddress(addressInput.value) || !isValidCity(cityInput.value) || !isValidState(stateInput.value) || !isValidPincode(pincodeInput.value)) {
            event.preventDefault(); // Prevent form submission

            if (!isValidAddress(addressInput.value)) {
                addressError.textContent = 'Invalid input';
                addressError.style.display = 'block';
            } else {
                addressError.style.display = 'none';
            }

            if (!isValidCity(cityInput.value)) {
                cityError.textContent = 'Invalid input';
                cityError.style.display = 'block';
            } else {
                cityError.style.display = 'none';
            }

            if (!isValidState(stateInput.value)) {
                stateError.textContent = 'Invalid input';
                stateError.style.display = 'block';
            } else {
                stateError.style.display = 'none';
            }

            if (!isValidPincode(pincodeInput.value)) {
                pincodeError.textContent = 'Invalid input';
                pincodeError.style.display = 'block';
            } else {
                pincodeError.style.display = 'none';
            }
        }
    });

    function isValidAddress(address) {
        const addressPattern = /^(?!\s*$)[\w\s\d!@#$%^&*(),.?":{}|<>_-]+$/;
        return addressPattern.test(address);
    }

    function isValidCity(city) {
        const cityPattern = /^[A-Z][a-zA-Z]*$/;
        return cityPattern.test(city);
    }

    function isValidState(state) {
        const validIndianStates = [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
            'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
            'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
            'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
            'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
            'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Delhi', 'Puducherry'
        ];
        return state.trim() !== '' && validIndianStates.includes(state);
    }

    function isValidPincode(pincode) {
        const validPincodePattern = /^\d{6}$/;
        if (!validPincodePattern.test(pincode)) {
            return false;
        }
        for (let i = 0; i <= 9; i++) {
            if (pincode.indexOf(i.toString().repeat(6)) !== -1) {
                return false;
            }
        }
        return pincode.trim() !== '';
    }
});
