// contact.js
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
  const contactAnimations = document.querySelectorAll(
    ".contact-animate-slide, .contact-animate-fade"
  );

  const contactObserver = createIntersectionObserver();
  contactAnimations.forEach((el) => {
    contactObserver.observe(el);
  });
});
