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

  // Observe all testimonial cards
  document.querySelectorAll(".testimonial-card").forEach((card) => {
    observer.observe(card);
    // Set initial opacity to 0
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
  });
});
