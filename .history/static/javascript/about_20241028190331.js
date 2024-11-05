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

// About Section Scripts
document.addEventListener("DOMContentLoaded", () => {
  const aboutObserver = createIntersectionObserver();
  document
    .querySelectorAll(".profile-card, .about-text, .timeline-item")
    .forEach((el) => {
      aboutObserver.observe(el);
    });
});
