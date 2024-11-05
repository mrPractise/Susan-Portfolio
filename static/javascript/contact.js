document.addEventListener("DOMContentLoaded", () => {
  // Keep existing animation observer code
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

  // Ensure alert container exists
  let alertContainer = document.querySelector(".alert-container");
  if (!alertContainer) {
    alertContainer = document.createElement("div");
    alertContainer.className = "alert-container";
    document.body.appendChild(alertContainer);
  }

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear any existing errors
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
        showAlert(data.message, "success");
        contactForm.reset();
      } else {
        showAlert(data.message || "Please correct the errors below.", "error");
        if (data.errors) {
          displayErrors(data.errors);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert("An error occurred. Please try again later.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });

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

  function showAlert(message, type) {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade`;
    alertDiv.setAttribute("role", "alert");
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" aria-label="Close">&times;</button>
    `;

    // Add to container
    alertContainer.appendChild(alertDiv);

    // Trigger animation
    setTimeout(() => {
      alertDiv.classList.add("show");
    }, 10);

    // Add close button handler
    const closeButton = alertDiv.querySelector(".btn-close");
    closeButton.addEventListener("click", () => closeAlert(alertDiv));

    // Auto-close after 5 seconds
    setTimeout(() => {
      closeAlert(alertDiv);
    }, 5000);
  }

  function closeAlert(alert) {
    alert.classList.remove("show");
    alert.classList.add("hiding");

    setTimeout(() => {
      alert.remove();
    }, 300);
  }
});
