// about.js
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
  const aboutObserver = createIntersectionObserver();
  document
    .querySelectorAll(".profile-card, .about-text, .timeline-item")
    .forEach((el) => {
      aboutObserver.observe(el);
    });
});
