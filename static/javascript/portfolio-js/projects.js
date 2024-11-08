// Project Gallery Manager and Class
const ProjectGalleryManager = {
  instance: null,

  initialize() {
    if (this.instance) {
      console.log("Gallery already initialized, skipping");
      return this.instance;
    }

    console.log("Creating new gallery instance");
    this.instance = new ProjectGallery();
    return this.instance;
  },
};

class ProjectGallery {
  constructor() {
    if (ProjectGalleryManager.instance) {
      console.log("Returning existing gallery instance");
      return ProjectGalleryManager.instance;
    }

    console.log("Setting up new gallery instance");
    this.gallery = document.querySelector(".gallery-grid");
    this.currentPage = 1;
    this.loading = false;
    this.currentCategory = window.INITIAL_DATA?.currentCategory || "all";
    this.currentView = window.INITIAL_DATA?.currentView || "grid";

    this.initialize();
  }

  initialize() {
    console.log("Setting up gallery components...");
    this.setupFilters();
    this.setupInfiniteScroll();
    this.initializeVideoPlayers();
  }

  setupFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");

    filterButtons.forEach((btn) => {
      if (btn.hasAttribute("data-listener-attached")) {
        return;
      }

      btn.setAttribute("data-listener-attached", "true");

      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (this.loading) return;

        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.loading = true;
        if (this.gallery) {
          this.gallery.style.opacity = "0.5";
        }

        try {
          const category = btn.dataset.filter;
          const response = await fetch(
            `/projects/?category=${category}&view=${this.currentView}`,
            {
              headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": document.querySelector(
                  "[name=csrfmiddlewaretoken]"
                ).value,
              },
            }
          );

          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

          const data = await response.json();

          if (data.html && this.gallery) {
            VideoPlayer.initializedVideos.clear();

            this.gallery.innerHTML = data.html;
            this.currentCategory = category;
            this.currentPage = 1;
            this.gallery.style.opacity = "1";

            const newUrl = new URL(window.location);
            newUrl.searchParams.set("category", category);
            window.history.pushState({}, "", newUrl);

            this.initializeVideoPlayers();
          }
        } catch (error) {
          console.error("Filter error:", error);
          this.handleError("Failed to filter projects");
        } finally {
          this.loading = false;
          if (this.gallery) {
            this.gallery.style.opacity = "1";
          }
        }
      });
    });
  }

  setupInfiniteScroll() {
    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.loading) {
        this.loadMoreProjects();
      }
    }, options);

    this.observeLastItem(observer);
  }

  async loadMoreProjects() {
    if (this.loading) return;
    this.loading = true;

    try {
      const response = await fetch(
        `/projects/?page=${this.currentPage + 1}&category=${
          this.currentCategory
        }&view=${this.currentView}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      const data = await response.json();

      if (data.html && this.gallery) {
        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = data.html;

        const items = tempContainer.querySelectorAll(".gallery-item");
        items.forEach((item) => this.gallery.appendChild(item));

        this.currentPage++;
        this.initializeVideoPlayers();

        if (data.has_next) {
          this.observeLastItem();
        }
      }
    } catch (error) {
      console.error("Load more error:", error);
      this.handleError("Failed to load more projects");
    } finally {
      this.loading = false;
    }
  }

  observeLastItem(observer = null) {
    if (!this.gallery) return;

    const items = this.gallery.querySelectorAll(".gallery-item");
    if (items.length > 0) {
      if (observer) {
        observer.observe(items[items.length - 1]);
      } else {
        const existingObserver = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && !this.loading) {
              this.loadMoreProjects();
            }
          },
          { rootMargin: "100px" }
        );

        existingObserver.observe(items[items.length - 1]);
      }
    }
  }

  initializeVideoPlayers() {
    console.log("Initializing video players...");
    const players = document.querySelectorAll(".custom-video-player");
    players.forEach((container) => {
      if (!container.hasAttribute("data-initialized")) {
        new VideoPlayer(container);
        container.setAttribute("data-initialized", "true");
      }
    });
  }
  handleError(message) {
    console.error(message);
    if (this.gallery) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "gallery-error";
      errorDiv.textContent = message;
      this.gallery.appendChild(errorDiv);
    }
  }
}

// Add this to your projects.js file, after the ProjectGallery class
class ImageModal {
  constructor() {
    this.modal = document.querySelector(".project-modal");
    this.currentImageId = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle image clicks
    document.addEventListener("click", (e) => {
      const imageContainer = e.target.closest(".item-inner > div:first-child");
      if (imageContainer && !imageContainer.querySelector("video")) {
        const img = imageContainer.querySelector("img");
        if (img) {
          console.log("Image clicked:", img.src); // Debug log
          this.openModal(img);
        }
      }
    });

    // Close modal handlers
    const closeBtn = this.modal.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("active")) {
        this.closeModal();
      }
    });

    // Navigation handlers
    const prevBtn = this.modal.querySelector(".modal-nav.prev");
    const nextBtn = this.modal.querySelector(".modal-nav.next");

    if (prevBtn)
      prevBtn.addEventListener("click", () => this.navigateImages("prev"));
    if (nextBtn)
      nextBtn.addEventListener("click", () => this.navigateImages("next"));
  }

  openModal(img) {
    if (!this.modal) {
      console.error("Modal element not found");
      return;
    }

    const mediaContainer = this.modal.querySelector(".modal-media");
    if (!mediaContainer) {
      console.error("Media container not found");
      return;
    }

    // Create new image element for modal
    const modalImg = document.createElement("img");
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modalImg.style.maxWidth = "100%";
    modalImg.style.maxHeight = "80vh";
    modalImg.style.objectFit = "contain";

    // Clear and set new content
    mediaContainer.innerHTML = "";
    mediaContainer.appendChild(modalImg);

    // Get project info from DOM
    const projectItem = img.closest(".gallery-item");
    if (projectItem) {
      const modalInfo = this.modal.querySelector(".modal-info");
      if (modalInfo) {
        const title = projectItem.querySelector("h3");
        const description = projectItem.querySelector(".description");
        const date = projectItem.querySelector(".date");
        const category = projectItem.querySelector(".item-category");

        if (title)
          this.modal.querySelector(".modal-title").textContent =
            title.textContent;
        if (description)
          this.modal.querySelector(".modal-description").textContent =
            description.textContent;
        if (date)
          this.modal.querySelector(".metadata-date").textContent =
            date.textContent;
        if (category)
          this.modal.querySelector(".metadata-category").textContent =
            category.textContent;
      }
      this.currentImageId = projectItem.dataset.projectId;
    }

    // Show modal
    this.modal.classList.add("active");
    this.modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Add active class to modal content after a small delay
    setTimeout(() => {
      const modalContent = this.modal.querySelector(".modal-content");
      if (modalContent) {
        modalContent.style.opacity = "1";
        modalContent.style.transform = "translateY(0)";
      }
    }, 10);
  }

  closeModal() {
    if (!this.modal) return;

    const modalContent = this.modal.querySelector(".modal-content");
    if (modalContent) {
      modalContent.style.opacity = "0";
      modalContent.style.transform = "translateY(20px)";
    }

    // Delay the modal hiding to allow for animation
    setTimeout(() => {
      this.modal.classList.remove("active");
      this.modal.style.display = "none"; // Add this line
      document.body.style.overflow = "";
      this.currentImageId = null;
    }, 300);
  }

  navigateImages(direction) {
    if (!this.currentImageId) return;

    const items = Array.from(document.querySelectorAll(".gallery-item"));
    const currentIndex = items.findIndex(
      (item) => item.dataset.projectId === this.currentImageId
    );
    let nextIndex;

    if (direction === "prev") {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = items.length - 1;
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= items.length) nextIndex = 0;
    }

    const nextItem = items[nextIndex];
    const nextImg = nextItem.querySelector("img");
    if (nextImg) {
      this.openModal(nextImg);
    }
  }
}
// Initialize the image modal
document.addEventListener('DOMContentLoaded', () => {
    window.imageModal = new ImageModal();
});

// Single initialization point
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.gallery = ProjectGalleryManager.initialize();
  }, { once: true });
} else {
  window.gallery = ProjectGalleryManager.initialize();
}