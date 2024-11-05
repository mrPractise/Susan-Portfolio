// portfolio.js
document.addEventListener("DOMContentLoaded", () => {
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
      });
    });

    lightboxClose.addEventListener("click", () => {
      lightbox.classList.remove("active");
    });

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove("active");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("active")) {
        lightbox.classList.remove("active");
      }
    });
  }

  // Initialize portfolio items
  setTimeout(() => {
    portfolioItems.forEach((item) => item.classList.add("visible"));
  }, 500);
});
