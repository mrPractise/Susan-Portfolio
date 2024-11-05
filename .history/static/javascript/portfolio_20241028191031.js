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
      threshold: 0.0,
      rootMargin: "0px",
      ...options,
    }
  );
  return observer;
};

// Portfolio Section Scripts
const initPortfolio = () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const portfolioItems = document.querySelectorAll(".portfolio-item");
  const lightbox = document.querySelector(".portfolio-lightbox");
  const lightboxImg = lightbox?.querySelector("img");
  const lightboxClose = lightbox?.querySelector(".portfolio-lightbox-close");

  // Portfolio filtering
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;

      portfolioItems.forEach((item) => {
        if (filter === "all" || item.dataset.category === filter) {
          item.style.display = "block";
          setTimeout(() => item.classList.add("visible"), 100);
        } else {
          item.classList.remove("visible");
          setTimeout(() => (item.style.display = "none"), 500);
        }
      });
    });
  });

  // Lightbox functionality
  if (lightbox && lightboxImg && lightboxClose) {
    portfolioItems.forEach((item) => {
      item.addEventListener("click", () => {
        const imgSrc = item.querySelector("img").src;
        lightboxImg.src = imgSrc;
        lightbox.classList.add("active");
        lightbox.setAttribute("aria-hidden", "false");
      });
    });

    lightboxClose.addEventListener("click", () => {
      lightbox.classList.remove("active");
      lightbox.setAttribute("aria-hidden", "true");
    });

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("active")) {
        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");
      }
    });
  }

  // Initialize portfolio items as visible
  setTimeout(() => {
    portfolioItems.forEach((item) => item.classList.add("visible"));
  }, 500);
};

document.addEventListener("DOMContentLoaded", () => {
  initPortfolio();
});
