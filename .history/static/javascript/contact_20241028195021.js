document.addEventListener("DOMContentLoaded", () => {
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

  // Observe contact info and form
  const contactElements = document.querySelectorAll(
    ".contact-animate-slide, .contact-animate-fade"
  );

  contactElements.forEach((element) => {
    observer.observe(element);
    // Set initial state
    element.style.opacity = "0";
    if (element.classList.contains("contact-animate-slide")) {
      element.style.transform = "translateX(-20px)";
    } else if (element.classList.contains("contact-animate-fade")) {
      element.style.transform = "translateY(20px)";
    }
  });
});
