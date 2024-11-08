// Updated work.js
document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const portfolioItems = document.querySelectorAll(".portfolio-item");
  const lightbox = document.querySelector(".portfolio-lightbox");
  const lightboxImg = lightbox?.querySelector(".lightbox-image-container img");
  const lightboxTitle = lightbox?.querySelector(".lightbox-title");
  const lightboxDesc = lightbox?.querySelector(".lightbox-description");
  const lightboxDate = lightbox?.querySelector(".metadata-date");
  const lightboxCategory = lightbox?.querySelector(".metadata-category");
  const lightboxClose = lightbox?.querySelector(".lightbox-close");

  // Check if device is mobile
  const isMobile = () => window.innerWidth <= 768;

  // Initialize portfolio items with staggered animation
  portfolioItems.forEach((item, index) => {
    setTimeout(() => {
      item.querySelector(".portfolio-card").classList.add("visible");
    }, 100 * index);
  });

  // Portfolio filtering with smooth transitions
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;

      portfolioItems.forEach((item, index) => {
        const shouldShow = filter === "all" || item.dataset.category === filter;

        if (shouldShow) {
          item.style.display = "block";
          setTimeout(() => {
            item.classList.add("visible");
          }, 100 * index);
        } else {
          item.classList.remove("visible");
          setTimeout(() => {
            item.style.display = "none";
          }, 400);
        }
      });
    });
  });

  // Enhanced lightbox functionality
  if (lightbox && lightboxImg) {
    const viewButtons = document.querySelectorAll(".view-project");

    viewButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const item = button.closest(".portfolio-item");
        const img = item.querySelector("img");
        const title = item.querySelector("h3").textContent;
        const desc = item.querySelector("p").textContent;
        const category = item.querySelector(".category").textContent;

        lightboxImg.src = img.src;
        lightboxTitle.textContent = title;
        lightboxDesc.textContent = desc;
        lightboxCategory.textContent = category;
        lightboxDate.textContent = new Date().toLocaleDateString();

        lightbox.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    });

    // Close lightbox handlers
    const closeLightbox = () => {
      lightbox.classList.remove("active");
      document.body.style.overflow = "";
    };

    lightboxClose?.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("active")) {
        closeLightbox();
      }
    });
  }

  // Handle window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const mobile = isMobile();
      document.body.classList.toggle("is-mobile", mobile);

      // Reset transformations on mobile
      if (mobile) {
        portfolioItems.forEach((item) => {
          const card = item.querySelector(".portfolio-card");
          const img = item.querySelector(".portfolio-image img");
          card.style.transform = "";
          img.style.transform = "";
        });
      }
    }, 250);
  });
});
