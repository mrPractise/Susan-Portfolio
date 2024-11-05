// projects.js
document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.querySelector(".gallery");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const viewToggles = document.querySelectorAll(".toggle-btn");
  const modal = document.querySelector(".project-modal");
  const modalContent = modal?.querySelector(".modal-content");
  const modalClose = modal?.querySelector(".modal-close");
  const modalNavs = modal?.querySelectorAll(".modal-nav");
  let currentIndex = 0;
  let filteredItems = [];

  // Initialize masonry layout
  const masonryLayout = () => {
    if (gallery.classList.contains("masonry-view")) {
      const items = gallery.querySelectorAll(".gallery-item");
      items.forEach((item) => {
        const random = Math.random() * 0.5 + 0.5; // Random aspect ratio between 0.5 and 1
        item.style.height = `${Math.floor(300 * random)}px`;
      });
    }
  };

  // View toggle functionality
  viewToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      viewToggles.forEach((t) => t.classList.remove("active"));
      toggle.classList.add("active");

      const view = toggle.dataset.view;
      gallery.className = `gallery ${view}-view`;

      if (view === "masonry") {
        masonryLayout();
      } else {
        const items = gallery.querySelectorAll(".gallery-item");
        items.forEach((item) => (item.style.height = ""));
      }
    });
  });

  // Filter functionality
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      const items = gallery.querySelectorAll(".gallery-item");

      items.forEach((item) => {
        item.style.opacity = "0";
        item.style.transform = "translateY(20px)";

        setTimeout(() => {
          if (filter === "all" || item.dataset.category === filter) {
            item.style.display = "";
            setTimeout(() => {
              item.style.opacity = "1";
              item.style.transform = "translateY(0)";
            }, 50);
          } else {
            item.style.display = "none";
          }
        }, 300);
      });

      // Update filtered items array
      // Continuing projects.js
      // Update filtered items array
      filteredItems = Array.from(items).filter(
        (item) => filter === "all" || item.dataset.category === filter
      );

      if (gallery.classList.contains("masonry-view")) {
        setTimeout(masonryLayout, 350);
      }
    });
  });

  // Modal functionality
  const openModal = (item, index) => {
    currentIndex = index;
    const mediaContainer = modal.querySelector(".modal-media");
    const title = modal.querySelector(".modal-title");
    const description = modal.querySelector(".modal-description");
    const date = modal.querySelector(".metadata-value.date");
    const category = modal.querySelector(".metadata-value.category");
    const tools = modal.querySelector(".metadata-value.tools");

    // Clear previous content
    mediaContainer.innerHTML = "";

    // Check if item is video or image
    if (item.classList.contains("video-item")) {
      const video = item.querySelector("video").cloneNode(true);
      video.controls = true;
      mediaContainer.appendChild(video);
    } else {
      const img = item.querySelector("img").cloneNode(true);
      mediaContainer.appendChild(img);
    }

    // Update modal content
    title.textContent = item.querySelector("h3").textContent;
    description.textContent = item.querySelector("p").textContent;
    category.textContent = item.dataset.category;
    date.textContent = new Date().toLocaleDateString();
    tools.textContent = Array.from(item.querySelectorAll(".item-tags span"))
      .map((tag) => tag.textContent)
      .join(", ");

    // Show modal with animation
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Update navigation visibility
    updateModalNavigation();
  };

  const closeModal = () => {
    modal.classList.remove("active");
    document.body.style.overflow = "";

    // Stop video if playing
    const video = modal.querySelector("video");
    if (video) {
      video.pause();
    }
  };

  const updateModalNavigation = () => {
    if (filteredItems.length <= 1) {
      modalNavs.forEach((nav) => (nav.style.display = "none"));
      return;
    }

    modalNavs[0].style.display = currentIndex > 0 ? "" : "none";
    modalNavs[1].style.display =
      currentIndex < filteredItems.length - 1 ? "" : "none";
  };

  const navigateModal = (direction) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < filteredItems.length) {
      openModal(filteredItems[newIndex], newIndex);
    }
  };

  // Add click handlers to gallery items
  document.querySelectorAll(".gallery-item").forEach((item, index) => {
    item.addEventListener("click", () => openModal(item, index));
  });

  // Modal event listeners
  if (modal) {
    modalClose.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    modalNavs[0].addEventListener("click", () => navigateModal(-1));
    modalNavs[1].addEventListener("click", () => navigateModal(1));

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("active")) return;

      switch (e.key) {
        case "Escape":
          closeModal();
          break;
        case "ArrowLeft":
          navigateModal(-1);
          break;
        case "ArrowRight":
          navigateModal(1);
          break;
      }
    });
  }

  // Video preview functionality
  document.querySelectorAll(".video-item").forEach((item) => {
    const video = item.querySelector("video");
    const playButton = item.querySelector(".play-button");

    // Preview on hover
    item.addEventListener("mouseenter", () => {
      video.play().catch(() => {
        // Handle autoplay restrictions
        playButton.style.opacity = "1";
      });
    });

    item.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });

    // Handle play button click
    playButton?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (video.paused) {
        video.play();
        playButton.style.opacity = "0";
      } else {
        video.pause();
        playButton.style.opacity = "1";
      }
    });
  });

  // Lazy loading for images and videos
  const lazyLoad = () => {
    const options = {
      root: null,
      rootMargin: "50px",
      threshold: 0.1,
    };

    const loadItem = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const item = entry.target;
          const media = item.querySelector("img, video");

          if (media.tagName === "IMG") {
            media.src = media.dataset.src;
          } else if (media.tagName === "VIDEO") {
            media.src = media.dataset.src;
            media.poster = media.dataset.poster;
          }

          observer.unobserve(item);
        }
      });
    };

    const observer = new IntersectionObserver(loadItem, options);
    document.querySelectorAll(".gallery-item").forEach((item) => {
      observer.observe(item);
    });
  };

  // Handle window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (gallery.classList.contains("masonry-view")) {
        masonryLayout();
      }
    }, 250);
  });

  // Initialize
  masonryLayout();
  lazyLoad();
});