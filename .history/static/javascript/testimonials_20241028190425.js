const createIntersectionObserver = (options = {}) => {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          // Unobserve after animation is triggered
          if (!options.persistent) {
            observer.unobserve(entry.target);
          }
        }
      });
    },
    {
      threshold: 0.0,
      rootMargin: "0px",
      ...options,
    }
  );
};

// Testimonials Section Scripts
document.addEventListener("DOMContentLoaded", () => {
  const testimonialObserver = createIntersectionObserver();
  document.querySelectorAll(".testimonial-card").forEach((el) => {
    testimonialObserver.observe(el);
  });
});
