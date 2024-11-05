// projects.js
class ProjectGallery {
  constructor() {
    this.gallery = document.querySelector(".gallery");
    this.currentPage = 1;
    this.loading = false;
    this.initializeGallery();
  }

  initializeGallery() {
    this.setupViewToggle();
    this.setupFilters();
    this.setupInfiniteScroll();
    this.setupModalHandlers();
  }

  setupViewToggle() {
    document.querySelectorAll(".toggle-btn").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        document
          .querySelectorAll(".toggle-btn")
          .forEach((t) => t.classList.remove("active"));
        toggle.classList.add("active");
        this.gallery.className = `gallery ${toggle.dataset.view}-view`;
      });
    });
  }

  setupFilters() {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (this.loading) return;
        this.loading = true;

        try {
          const filter = btn.dataset.filter;
          const response = await fetch(`/projects/?category=${filter}`, {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          });
          const data = await response.json();

          this.gallery.innerHTML = data.html;
          this.currentPage = 1;
          history.pushState({}, "", `?category=${filter}`);

          document
            .querySelectorAll(".filter-btn")
            .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          // Reinitialize video players
          this.initializeVideoPlayers();
        } catch (error) {
          console.error("Filter error:", error);
        } finally {
          this.loading = false;
        }
      });
    });
  }

  setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.loading) {
        this.loadMoreProjects();
      }
    });

    this.observeLastItem(observer);
  }

  async loadMoreProjects() {
    if (this.loading) return;
    this.loading = true;

    try {
      const category =
        new URLSearchParams(window.location.search).get("category") || "all";
      const response = await fetch(
        `/projects/load-more/?page=${this.currentPage + 1}&category=${category}`
      );
      const data = await response.json();

      if (data.html) {
        this.gallery.insertAdjacentHTML("beforeend", data.html);
        this.currentPage++;
        this.observeLastItem();
        this.initializeVideoPlayers();
      }
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      this.loading = false;
    }
  }

  initializeVideoPlayers() {
    document.querySelectorAll(".custom-video-player").forEach((container) => {
      new VideoPlayer(container);
    });
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new ProjectGallery();
});
