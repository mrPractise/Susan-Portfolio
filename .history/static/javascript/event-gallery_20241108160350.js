document.addEventListener("DOMContentLoaded", function () {
  const gallery = {
    currentIndex: 0,
    items: [],

    init() {
      this.lightbox = document.querySelector(".lightbox");
      this.lightboxContent = document.querySelector(".lightbox-content");
      this.lightboxClose = document.querySelector(".lightbox-close");
      this.filterContainer = document.querySelector(".filter-container");
      this.loadMoreBtn = document.querySelector(".load-more");
      this.galleryGrid = document.querySelector(".gallery-grid");
      this.currentPage = 1;

      // Initialize items array from existing gallery items
      this.initializeItems();
      this.setupEventListeners();
    },

    initializeItems() {
      this.items = Array.from(document.querySelectorAll(".gallery-item")).map(
        (item) => ({
          id: item.dataset.id,
          title: item.querySelector(".item-title").textContent,
          date: item.querySelector(".item-date").textContent,
          media_type: item.classList.contains("video") ? "video" : "image",
          thumbnail_url: item.querySelector("img").src,
          file_url: item.dataset.fileUrl,
          description:
            item.querySelector(".item-description")?.textContent || "",
        })
      );
    },

    setupEventListeners() {
      // Filter buttons
      this.filterContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("filter-btn")) {
          this.handleFilterClick(e.target);
        }
      });

      // Gallery item clicks
      this.galleryGrid.addEventListener("click", (e) => {
        const item = e.target.closest(".gallery-item");
        if (item) {
          const index = Array.from(this.galleryGrid.children).indexOf(item);
          this.openLightbox(index);
        }
      });

      // Lightbox navigation
      document.addEventListener("keydown", (e) => {
        if (!this.lightbox.classList.contains("active")) return;

        if (e.key === "ArrowLeft") this.navigateLightbox("prev");
        if (e.key === "ArrowRight") this.navigateLightbox("next");
        if (e.key === "Escape") this.closeLightbox();
      });

      // Load more button
      if (this.loadMoreBtn) {
        this.loadMoreBtn.addEventListener("click", () => this.loadMoreItems());
      }

      // Lightbox close button
      this.lightboxClose.addEventListener("click", () => this.closeLightbox());

      // Close lightbox when clicking outside content
      this.lightbox.addEventListener("click", (e) => {
        if (e.target === this.lightbox) {
          this.closeLightbox();
        }
      });

      // Prevent lightbox close when clicking video
      this.lightboxContent.addEventListener("click", (e) => {
        if (e.target.tagName === "VIDEO") {
          e.stopPropagation();
        }
      });
    },

    async handleFilterClick(button) {
      const category = button.dataset.category;

      // Update active state
      this.filterContainer.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.classList.toggle("active", btn === button);
      });

      // Reset state
      this.currentPage = 1;

      try {
        const url = new URL(window.location.href);
        url.searchParams.set("category", category);
        url.searchParams.set("page", "1");

        const response = await fetch(url, {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        // Update gallery
        this.items = data.items;
        this.updateGalleryGrid(data.items);
        this.updateLoadMoreButton(data.has_next);
      } catch (error) {
        console.error("Error fetching filtered items:", error);
      }
    },

    async loadMoreItems() {
      try {
        this.currentPage++;
        const url = new URL(window.location.href);
        url.searchParams.set("page", this.currentPage.toString());

        const response = await fetch(url, {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        this.items = [...this.items, ...data.items];
        this.appendItems(data.items);
        this.updateLoadMoreButton(data.has_next);
      } catch (error) {
        console.error("Error loading more items:", error);
        this.currentPage--; // Revert page increment on error
      }
    },

    openLightbox(index) {
      this.currentIndex = index;
      this.updateLightboxContent();
      this.lightbox.classList.add("active");
      document.body.style.overflow = "hidden"; // Prevent background scrolling

      // Add navigation arrows if more than one item
      if (this.items.length > 1) {
        this.addLightboxNavigation();
      }
    },


    updateLightboxContent() {
        const item = this.items[this.currentIndex];
        let content;

        // Pause any existing videos
        const existingVideos = this.lightboxContent.querySelectorAll('video');
        existingVideos.forEach(video => video.pause());

        if (item.media_type === 'video') {
            content = `
                <div class="video-container">
                    <video controls playsinline>
                        <source src="${item.file_url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div class="lightbox-info">
                    <h3>${item.title}</h3>
                    <p class="item-date">${item.date}</p>
                    ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                </div>
            `;
        } else {
            content = `
                <img src="${item.file_url}" alt="${item.title}">
                <div class="lightbox-info">
                    <h3>${item.title}</h3>
                    <p class="item-date">${item.date}</p>
                    ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                </div>
            `;
        }

        this.lightboxContent.innerHTML = content;

        // If it's a video, set up the video element
        if (item.media_type === 'video') {
            const video = this.lightboxContent.querySelector('video');
            video.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        this.updateNavigationState();
    },

    updateNavigationState() {
      const prevBtn = this.lightbox.querySelector(".prev-btn");
      const nextBtn = this.lightbox.querySelector(".next-btn");

      if (prevBtn && nextBtn) {
        prevBtn.disabled = this.currentIndex === 0;
        nextBtn.disabled = this.currentIndex === this.items.length - 1;
      }
    },

    navigateLightbox(direction) {
      const newIndex =
        direction === "prev" ? this.currentIndex - 1 : this.currentIndex + 1;

      if (newIndex >= 0 && newIndex < this.items.length) {
        this.currentIndex = newIndex;
        this.updateLightboxContent();
      }
    },

    addLightboxNavigation() {
      // Only add navigation if it doesn't already exist
      if (!this.lightbox.querySelector(".lightbox-navigation")) {
        const navigationHTML = `
                    <div class="lightbox-navigation">
                        <button class="nav-btn prev-btn" aria-label="Previous">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="nav-btn next-btn" aria-label="Next">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                `;

        this.lightboxContent.insertAdjacentHTML("afterend", navigationHTML);

        // Add event listeners to navigation buttons
        this.lightbox
          .querySelector(".prev-btn")
          .addEventListener("click", () => this.navigateLightbox("prev"));
        this.lightbox
          .querySelector(".next-btn")
          .addEventListener("click", () => this.navigateLightbox("next"));
      }
    },

    closeLightbox() {
      // Pause any playing videos
      const videos = this.lightboxContent.querySelectorAll("video");
      videos.forEach((video) => video.pause());

      this.lightbox.classList.remove("active");
      document.body.style.overflow = ""; // Restore scrolling
    },

    updateLoadMoreButton(hasNext) {
      if (this.loadMoreBtn) {
        this.loadMoreBtn.style.display = hasNext ? "block" : "none";
      }
    },

    updateGalleryGrid(items) {
      this.galleryGrid.innerHTML = items
        .map((item) => this.createItemHTML(item))
        .join("");
    },

    appendItems(items) {
      const newHTML = items.map((item) => this.createItemHTML(item)).join("");
      this.galleryGrid.insertAdjacentHTML("beforeend", newHTML);
    },

    createItemHTML(item) {
      return `
                <div class="gallery-item ${
                  item.media_type === "video" ? "video" : ""
                }" 
                     data-id="${item.id}"
                     data-file-url="${item.file_url}">
                    <img src="${item.thumbnail_url}" alt="${item.title}">
                    ${
                      item.media_type === "video"
                        ? '<div class="video-indicator"><i class="fas fa-play"></i></div>'
                        : ""
                    }
                    <div class="item-overlay">
                        <h3 class="item-title">${item.title}</h3>
                        <p class="item-date">${item.date}</p>
                        ${
                          item.description
                            ? `<p class="item-description">${item.description}</p>`
                            : ""
                        }
                    </div>
                </div>
            `;
    },
  };

  // Initialize the gallery
  gallery.init();
});
