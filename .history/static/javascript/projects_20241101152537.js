class ProjectGallery {
  constructor() {
    this.gallery = document.querySelector(".gallery");
    this.currentPage = 1;
    this.loading = false;
    this.currentCategory = window.INITIAL_DATA.currentCategory;
    this.currentView = window.INITIAL_DATA.currentView;
    this.initializeGallery();
  }

  initializeGallery() {
    this.setupViewToggle();
    this.setupFilters();
    this.setupInfiniteScroll();
    this.setupModalHandlers();
    this.initializeVideoPlayers();
  }

  setupFilters() {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (this.loading) return;

        // Remove active class from all buttons and add to clicked button
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.loading = true;
        this.gallery.classList.add("loading");

        try {
          const category = btn.dataset.filter;
          this.currentCategory = category;

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

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.html) {
            // Fade out current content
            this.gallery.style.opacity = "0";

            // After brief delay, update content and fade back in
            setTimeout(() => {
              this.gallery.innerHTML = data.html;
              this.currentPage = 1;
              this.gallery.style.opacity = "1";

              // Update URL without reload
              const newUrl = new URL(window.location);
              newUrl.searchParams.set("category", category);
              window.history.pushState({}, "", newUrl);

              // Reinitialize video players if needed
              this.initializeVideoPlayers();
            }, 300);
          }
        } catch (error) {
          console.error("Filter error:", error);
          this.handleError("Failed to filter projects");
        } finally {
          this.loading = false;
          this.gallery.classList.remove("loading");
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

    // Observe last item
    this.observeLastItem(observer);
  }

  async loadMoreProjects() {
    if (this.loading) return;
    this.loading = true;

    try {
      const response = await fetch(
        `/projects/load-more/?page=${this.currentPage + 1}&category=${
          this.currentCategory
        }&view=${this.currentView}`
      );
      const data = await response.json();

      if (data.html) {
        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = data.html;

        // Append new items
        const items = tempContainer.querySelectorAll(".gallery-item");
        items.forEach((item) => this.gallery.appendChild(item));

        this.currentPage++;

        // Initialize video players for new items
        this.initializeVideoPlayers();

        // Update observer for infinite scroll
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

  async reloadProjects() {
    if (this.loading) return;
    this.loading = true;

    try {
      const response = await fetch(
        `/projects/?category=${this.currentCategory}&view=${this.currentView}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );
      const data = await response.json();

      if (data.html) {
        this.gallery.innerHTML = data.html;
        this.currentPage = 1;
        this.initializeVideoPlayers();
      }
    } catch (error) {
      console.error("Reload error:", error);
      this.handleError("Failed to reload projects");
    } finally {
      this.loading = false;
    }
  }

  observeLastItem(observer = null) {
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
    document.querySelectorAll(".custom-video-player").forEach((container) => {
      if (!container.hasAttribute("data-initialized")) {
        new VideoPlayer(container);
        container.setAttribute("data-initialized", "true");
      }
    });
  }

  handleError(message) {
    // Add error handling UI if needed
    console.error(message);
    // Optionally show user-friendly error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "gallery-error";
    errorDiv.textContent = message;
    this.gallery.appendChild(errorDiv);
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new ProjectGallery();
});
