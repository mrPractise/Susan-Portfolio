document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("mpesaPaymentForm");
  const phoneInput = document.getElementById("phone");
  const payButton = document.getElementById("payButton");
  const originalButtonText = payButton.innerHTML;

  // Phone number formatting
  phoneInput.addEventListener("input", function (e) {
    // Remove any non-digits
    let value = this.value.replace(/\D/g, "");

    // Remove leading zero if present
    if (value.startsWith("0")) {
      value = value.substring(1);
    }

    // Limit to 9 digits (without prefix)
    value = value.substring(0, 9);

    // Update input value
    this.value = value;
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Disable the button
    payButton.disabled = true;
    payButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
      // Format phone number before sending
      let phoneNumber = phoneInput.value;
      if (!phoneNumber.startsWith("254")) {
        phoneNumber = "254" + phoneNumber;
      }

      const formData = new FormData(form);
      formData.set("phone", phoneNumber);

      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRFToken": CSRF_TOKEN, // This will be defined in the template
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Show success message
        alert(
          result.message || "Please check your phone for the M-PESA prompt"
        );

        if (result.redirect_url) {
          window.location.href = result.redirect_url;
        }
      } else {
        // Show error message
        alert(result.message || "Payment initiation failed. Please try again.");
        // Reset button
        payButton.disabled = false;
        payButton.innerHTML = originalButtonText;
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
      // Reset button
      payButton.disabled = false;
      payButton.innerHTML = originalButtonText;
    }
  });
});
