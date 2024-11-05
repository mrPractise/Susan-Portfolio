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

// Contact Section Scripts
const initContact = () => {
  const contactAnimations = document.querySelectorAll(
    ".contact-animate-slide, .contact-animate-fade"
  );

  // Contact animations
  const contactObserver = createIntersectionObserver();
  contactAnimations.forEach((el) => {
    contactObserver.observe(el);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initContact();
});
