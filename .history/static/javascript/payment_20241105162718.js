document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const phoneInput = document.querySelector("#phone");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Get the raw phone number
    let phoneNumber = phoneInput.value.trim();

    // Format the phone number using the same logic as the Python utility
    if (phoneNumber.startsWith("+")) {
      phoneNumber = phoneNumber.slice(1);
    }
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.slice(1);
    }
    if (!phoneNumber.startsWith("254")) {
      phoneNumber = "254" + phoneNumber;
    }

    // Update the input value before submission
    phoneInput.value = phoneNumber;

    // Continue with form submission
    this.submit();
  });

  // Validate input to only allow valid phone number formats
  phoneInput.addEventListener("input", function (e) {
    // Remove any non-digit characters except + at the start
    let value = this.value;
    if (value.startsWith("+")) {
      value = "+" + value.slice(1).replace(/\D/g, "");
    } else {
      value = value.replace(/\D/g, "");
    }

    // Handle different formats
    if (value.startsWith("+254")) {
      value = value.slice(0, 13); // +254 + 9 digits
    } else if (value.startsWith("254")) {
      value = value.slice(0, 12); // 254 + 9 digits
    } else {
      value = value.slice(0, 10); // 0 + 9 digits
    }

    this.value = value;
  });
});
