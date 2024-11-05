const createIntersectionObserver = (options = {}) => {
  const observer = new IntersectionObserver(
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
      threshold: 0.1,
      rootMargin: "0px",
      ...options,
    }
  );
  return observer;
};

// Contact Section Scripts
const initContact = () => {
  const contactAnimations = document.querySelectorAll(
    ".contact-animate-slide, .contact-animate-fade"
  );

  const contactObserver = createIntersectionObserver();
  contactAnimations.forEach((el) => {
    contactObserver.observe(el);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initContact();
});
