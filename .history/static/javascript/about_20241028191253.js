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

// About Section Scripts
const initAbout = () => {
  const aboutObserver = createIntersectionObserver();
  document
    .querySelectorAll(".profile-card, .about-text, .timeline-item")
    .forEach((el) => {
      aboutObserver.observe(el);
    });
};

document.addEventListener("DOMContentLoaded", () => {
  initAbout();
});
