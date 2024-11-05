

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const phoneInput = document.querySelector("#phone");
  const submitButton = form.querySelector('button[type="submit"]');

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Disable button
      submitButton.disabled = true;
      submitButton.innerHTML = "Processing...";

      // Format phone number
      let phoneNumber = phoneInput.value.trim();

      // Create form data
      const formData = new FormData();
      formData.append("phone", phoneNumber);

      // Get the CSRF token
      const csrfToken = document.querySelector(
        "[name=csrfmiddlewaretoken]"
      ).value;

      // Send request
      fetch(form.action, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        body: formData,
      })
        .then((response) => {
          // Check if redirect occurred
          if (response.redirected) {
            window.location.href = response.url;
            return;
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            // Only process if we have data (not redirected)
            if (data.success) {
              alert("Please check your phone for the M-Pesa prompt");
              // Optional: Redirect to confirmation page
              if (data.redirect_url) {
                window.location.href = data.redirect_url;
              }
            } else {
              alert(data.message || "An error occurred. Please try again.");
              submitButton.disabled = false;
              submitButton.innerHTML = "Pay Now";
            }
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          // Don't show error if we're being redirected
          if (!error.message.includes("JSON")) {
            alert("An error occurred. Please try again.");
            submitButton.disabled = false;
            submitButton.innerHTML = "Pay Now";
          }
        });
    });
  }
});
