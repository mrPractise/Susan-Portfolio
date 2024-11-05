const createIntersectionObserver = (options = {}) => {
  const observer = new IntersectionObserver(
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
      threshold: 0.1,
      rootMargin: "0px",
      ...options,
    }
  );
  return observer;
};

// Testimonials Section Scripts
const initTestimonials = () => {
  const testimonialObserver = createIntersectionObserver();
  document.querySelectorAll(".testimonial-card").forEach((el) => {
    testimonialObserver.observe(el);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initTestimonials();
});
