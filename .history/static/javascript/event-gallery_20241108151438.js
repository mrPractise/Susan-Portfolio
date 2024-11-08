document.addEventListener("DOMContentLoaded", function () {
  const gallery = {
    currentIndex: 0,
    items: [],

    init() {
      this.lightbox = document.querySelector(".lightbox");
      this.lightboxContent = document.querySelector(".lightbox-content");
      this.filterContainer = document.querySelector(".filter-container");
      this.loadMoreBtn = document.querySelector(".load-more");
      this.currentPage = 1;

      this.setupEventListeners();
      this.loadInitialItems();
    },

    setupEventListeners() {
      // Filter buttons
      this.filterContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("filter-btn")) {
          this.handleFilterClick(e.target);
        }
      });

      // Gallery item clicks
      document.querySelector(".gallery-grid").addEventListener("click", (e) => {
        const item = e.target.closest(".gallery-item");
        if (item) {
          this.openLightbox(item);
        }
      });

      // Lightbox navigation
      document.addEventListener("keydown", (e) => {
        if (!this.lightbox.classList.contains("active")) return;

        if (e.key === "ArrowLeft") this.navigateLightbox("prev");
        if (e.key === "ArrowRight") this.navigateLightbox("next");
        if (e.key === "Escape") this.closeLightbox();
      });

      // Load more
      this.loadMoreBtn.addEventListener("click", () => this.loadMoreItems());

      // Lightbox close
      document
        .querySelector(".lightbox-close")
        .addEventListener("click", () => this.closeLightbox());
    },

    async loadInitialItems() {
      const response = await fetch(window.location.href);
      const data = await response.json();
      this.items = data.items;
      this.updateLoadMoreButton(data.has_next);
    },

    async handleFilterClick(button) {
      const category = button.dataset.category;

      // Update active state
      this.filterContainer.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.classList.toggle("active", btn === button);
      });

      // Reset state
      this.currentPage = 1;

      // Fetch filtered items
      const url = new URL(window.location.href);
      url.searchParams.set("category", category);
      url.searchParams.set("page", "1");

      const response = await fetch(url);
      const data = await response.json();

      // Update gallery
      this.items = data.items;
      this.updateGalleryGrid(data.items);
      this.updateLoadMoreButton(data.has_next);
    },

    async loadMoreItems() {
      this.currentPage++;
      const url = new URL(window.location.href);
      url.searchParams.set("page", this.currentPage.toString());

      const response = await fetch(url);
      const data = await response.json();

      this.items = [...this.items, ...data.items];
      this.appendItems(data.items);
      this.updateLoadMoreButton(data.has_next);
    },

    openLightbox(item) {
      const index = Array.from(item.parentElement.children).indexOf(item);
      this.currentIndex = index;
      this.updateLightboxContent();
      this.lightbox.classList.add("active");

      // Add navigation arrows if more than one item
      if (this.items.length > 1) {
        this.addLightboxNavigation();
      }
    },

    updateLightboxContent() {
      const item = this.items[this.currentIndex];
      const content =
        item.media_type === "video"
          ? `<video controls><source src="${item.file_url}" type="video/mp4"></video>`
          : `<img src="${item.file_url}" alt="${item.title}">`;

      this.lightboxContent.innerHTML = `
                ${content}
                <div class="lightbox-info">
                    <h3>${item.title}</h3>
                    <p>${item.date}</p>
                </div>
            `;
    },

    navigateLightbox(direction) {
      if (direction === "prev" && this.currentIndex > 0) {
        this.currentIndex--;
      } else if (
        direction === "next" &&
        this.currentIndex < this.items.length - 1
      ) {
        this.currentIndex++;
      }
      this.updateLightboxContent();
    },

    addLightboxNavigation() {
      const nav = `
                <button class="lightbox-nav prev">&lt;</button>
                <button class="lightbox-nav next">&gt;</button>
            `;
      this.lightboxContent.insertAdjacentHTML("beforeend", nav);

      this.lightboxContent
        .querySelector(".prev")
        .addEventListener("click", () => this.navigateLightbox("prev"));
      this.lightboxContent
        .querySelector(".next")
        .addEventListener("click", () => this.navigateLightbox("next"));
    },

    closeLightbox() {
      this.lightbox.classList.remove("active");
    },

    updateLoadMoreButton(hasNext) {
      this.loadMoreBtn.style.display = hasNext ? "block" : "none";
    },

    updateGalleryGrid(items) {
      const grid = document.querySelector(".gallery-grid");
      grid.innerHTML = items.map((item) => this.createItemHTML(item)).join("");
    },

    appendItems(items) {
      const grid = document.querySelector(".gallery-grid");
      const newHTML = items.map((item) => this.createItemHTML(item)).join("");
      grid.insertAdjacentHTML("beforeend", newHTML);
    },

    createItemHTML(item) {
      return `
                <div class="gallery-item ${
                  item.media_type === "video" ? "video" : ""
                }">
                    <img src="${item.thumbnail_url}" alt="${item.title}">
                    <div class="item-overlay">
                        <h3 class="item-title">${item.title}</h3>
                        <p class="item-date">${item.date}</p>
                    </div>
                </div>
            `;
    },
  };

  gallery.init();
});
