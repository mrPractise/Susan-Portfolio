

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const phoneInput = document.querySelector("#phone");
  const submitButton = form.querySelector('button[type="submit"]');

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Disable button to prevent double submission
      submitButton.disabled = true;
      submitButton.innerHTML = "Processing...";

      // Get the phone number and format it
      let phoneNumber = phoneInput.value.trim();

      // Format the phone number
      if (phoneNumber.startsWith("+")) {
        phoneNumber = phoneNumber.slice(1);
      }
      if (phoneNumber.startsWith("0")) {
        phoneNumber = "254" + phoneNumber.slice(1);
      }
      if (!phoneNumber.startsWith("254")) {
        phoneNumber = "254" + phoneNumber;
      }

      // Create form data
      const formData = new FormData();
      formData.append("phone", phoneNumber);

      // Send request
      fetch(form.action, {
        method: "POST",
        headers: {
          "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")
            .value,
        },
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Show success message
            alert(
              data.message || "Please check your phone for the M-Pesa prompt"
            );

            // Optional: Redirect to a confirmation page
            // window.location.href = '/confirmation/';
          } else {
            // Show error message
            alert(data.message || "Payment failed. Please try again.");

            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = "Pay Now";
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred. Please try again.");

          // Re-enable submit button
          submitButton.disabled = false;
          submitButton.innerHTML = "Pay Now";
        });
    });
  }
});
