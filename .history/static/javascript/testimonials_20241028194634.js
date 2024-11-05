// testimonials.js
const createIntersectionObserver = (options = {}) => {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
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

document.addEventListener("DOMContentLoaded", () => {
  const testimonialObserver = createIntersectionObserver();
  document.querySelectorAll(".testimonial-card").forEach((el) => {
    testimonialObserver.observe(el);
  });
});
