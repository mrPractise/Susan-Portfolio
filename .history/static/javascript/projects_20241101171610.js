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


// Single initialization point
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.gallery = ProjectGalleryManager.initialize();
  }, { once: true });
} else {
  window.gallery = ProjectGalleryManager.initialize();
}