// testimonials.js
document.addEventListener("DOMContentLoaded", () => {
  // Create intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add visible class with a slight delay for each card
          setTimeout(() => {
            entry.target.classList.add("visible");
          }, Array.from(entry.target.parentElement.children).indexOf(entry.target) * 200);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "50px",
    }
  );

  // Select and observe all testimonial cards
  const cards = document.querySelectorAll(".testimonial-card");

  if (cards.length > 0) {
    cards.forEach((card) => {
      observer.observe(card);
      // Initial state
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
    });
  } else {
    console.warn("No testimonial cards found on the page");
  }
});