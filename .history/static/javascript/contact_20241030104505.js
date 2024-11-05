document.addEventListener("DOMContentLoaded", () => {
  // Keep your existing animation observer code here
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "50px",
    }
  );

  const contactElements = document.querySelectorAll(
    ".contact-animate-slide, .contact-animate-fade"
  );

  contactElements.forEach((element) => {
    observer.observe(element);
    element.style.opacity = "0";
    if (element.classList.contains("contact-animate-slide")) {
      element.style.transform = "translateX(-20px)";
    } else if (element.classList.contains("contact-animate-fade")) {
      element.style.transform = "translateY(20px)";
    }
  });

  // Form handling
  const contactForm = document.querySelector(".contact-form form");

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear any existing messages and errors
    clearMessages();
    clearErrors();

    // Disable submit button to prevent double submission
    const submitButton = contactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const formData = new FormData(contactForm);
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage(data.message, "success");
        contactForm.reset();
      } else {
        showMessage(data.message, "error");
        if (data.errors) {
          displayErrors(data.errors);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      showMessage("An error occurred. Please try again later.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  function clearMessages() {
    const messages = document.querySelectorAll(".alert");
    messages.forEach((message) => message.remove());
  }

  function clearErrors() {
    const errorMessages = contactForm.querySelectorAll(".error-message");
    errorMessages.forEach((error) => error.remove());

    const errorInputs = contactForm.querySelectorAll(".input-error");
    errorInputs.forEach((input) => input.classList.remove("input-error"));
  }

  function displayErrors(errors) {
    Object.entries(errors).forEach(([field, messages]) => {
      const inputElement = contactForm.querySelector(`#${field}`);
      if (inputElement) {
        inputElement.classList.add("input-error");

        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.textContent = messages[0];
        inputElement.parentNode.appendChild(errorDiv);
      }
    });
  }

  function showMessage(message, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `alert alert-${type}`;
    messageDiv.textContent = message;

    contactForm.insertBefore(messageDiv, contactForm.firstChild);

    if (type === "success") {
      // Keep success message visible longer
      setTimeout(() => messageDiv.remove(), 5000);
    }
  }
});
