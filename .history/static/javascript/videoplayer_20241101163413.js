class VideoPlayer {
  static modalInitialized = false;
  static modalInstance = null;
  constructor(container) {
    // Check if this video container is already initialized
    if (container.dataset.initialized === "true") {
      return;
    }

    // Only create the modal once for all video players
    if (!VideoPlayer.modalInitialized) {
      this.createModal();
      VideoPlayer.modalInitialized = true;
      VideoPlayer.modalInstance = document.querySelector(".video-modal");
    }
    this.container = container;
    this.video = container.querySelector("video");
    this.modal = VideoPlayer.modalInstance;
    this.modalVideo = null;
    this.isModalOpen = false;
    // Mark this container as initialized
    container.dataset.initialized = "true";

    this.initializePlayer();
    this.createModal();
    this.setupEventListeners();
    this.setupMainVideoControls();
  }

  initializePlayer() {
    this.video.preload = "metadata";
    this.video.playsInline = true;
  }
  createModal() {
    if (document.querySelector(".video-modal")) {
      return;
    }

    const modalHTML = `
      <div class="video-modal">
        <div class="modal-content">
          <button class="modal-close">&times;</button>
          <div class="modal-video-container"></div>
          <div class="video-controls">
            <button class="play-pause">
              <i class="fas fa-play"></i>
            </button>
            <div class="progress-bar">
              <div class="progress-bar-filled"></div>
            </div>
            <div class="time">
              <span class="current-time">0:00</span>
              <span>/</span>
              <span class="duration">0:00</span>
            </div>
            <div class="volume-control">
              <button class="mute-unmute">
                <i class="fas fa-volume-up"></i>
              </button>
              <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1">
            </div>
            <button class="fullscreen">
              <i class="fas fa-expand"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
  setupEventListeners() {
    // Modal close button
    const closeBtn = this.modal.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    // Close on background click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isModalOpen) {
        this.closeModal();
      }
    });

    // Video error handling
    this.video.addEventListener("error", () => {
      console.error("Video error:", this.video.error);
      this.handleVideoError();
    });
  }

  setupMainVideoControls() {
    const controls = this.container.querySelector(".video-controls");
    if (!controls) return;

    // Play/Pause for main video
    const playPauseBtn = controls.querySelector(".play-pause");
    playPauseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleMainVideo();
    });

    // Progress bar for main video
    const progressBar = controls.querySelector(".progress-bar");
    const progressFilled = controls.querySelector(".progress-bar-filled");

    progressBar.addEventListener("click", (e) => {
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      this.video.currentTime = pos * this.video.duration;
    });

    // Update progress for main video
    this.video.addEventListener("timeupdate", () => {
      const percent = (this.video.currentTime / this.video.duration) * 100;
      progressFilled.style.width = `${percent}%`;
      controls.querySelector(".current-time").textContent = this.formatTime(
        this.video.currentTime
      );
    });

    // Duration for main video
    this.video.addEventListener("loadedmetadata", () => {
      controls.querySelector(".duration").textContent = this.formatTime(
        this.video.duration
      );
    });

    // Video play/pause state update
    this.video.addEventListener("play", () => this.updateMainPlayButton());
    this.video.addEventListener("pause", () => this.updateMainPlayButton());

    // Volume control for main video
    const volumeSlider = controls.querySelector(".volume-slider");
    const muteBtn = controls.querySelector(".mute-unmute");

    volumeSlider.addEventListener("input", (e) => {
      this.video.volume = e.target.value;
      this.updateVolumeIcon(controls);
    });

    muteBtn.addEventListener("click", () => {
      this.video.muted = !this.video.muted;
      this.updateVolumeIcon(controls);
    });

    // Fullscreen for main video
    const fullscreenBtn = controls.querySelector(".fullscreen");
    fullscreenBtn.addEventListener("click", () =>
      this.toggleFullscreen(this.container)
    );
  }

  toggleMainVideo() {
    if (this.video.paused) {
      const playPromise = this.video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => console.error("Play error:", error));
      }
    } else {
      this.video.pause();
    }
    this.updateMainPlayButton();
  }

  updateMainPlayButton() {
    const playPauseBtn = this.container.querySelector(".play-pause");
    if (!playPauseBtn) return;

    const isPlaying = !this.video.paused;
    playPauseBtn.innerHTML = `<i class="fas fa-${
      isPlaying ? "pause" : "play"
    }"></i>`;
  }

  openModal() {
    this.isModalOpen = true;
    this.modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Clone video for modal
    const videoClone = this.video.cloneNode(true);
    const container = this.modal.querySelector(".modal-video-container");
    container.innerHTML = "";
    container.appendChild(videoClone);
    this.modalVideo = videoClone;

    // Set playback position
    this.modalVideo.currentTime = this.video.currentTime;

    // Setup modal video controls
    this.setupModalControls();

    // Handle orientation change
    this.handleOrientation();

    // Add screen orientation change listener
    if (screen.orientation) {
      screen.orientation.addEventListener("change", () =>
        this.handleOrientation()
      );
    }

    // Play the video
    const playPromise = this.modalVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error("Auto-play error:", error);
        this.updatePlayButton(true);
      });
    }

    // Add active class for animation
    setTimeout(() => {
      this.modal.classList.add("active");
    }, 10);

    // Request fullscreen on mobile devices
    if (window.innerWidth <= 768) {
      this.requestFullscreenVideo();
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.modal.classList.remove("active");

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.log(err));
    }

    // Remove orientation change listener
    if (screen.orientation) {
      screen.orientation.removeEventListener("change", () =>
        this.handleOrientation()
      );
    }

    // Pause modal video
    if (this.modalVideo && !this.modalVideo.paused) {
      this.modalVideo.pause();
    }

    // Reset original video
    this.video.currentTime = this.modalVideo ? this.modalVideo.currentTime : 0;

    // Clean up
    setTimeout(() => {
      this.modal.style.display = "none";
      document.body.style.overflow = "";
      const container = this.modal.querySelector(".modal-video-container");
      container.innerHTML = "";
      this.modalVideo = null;
    }, 300);
  }

  setupModalControls() {
    const controls = this.modal.querySelector(".video-controls");
    if (!controls) return;

    // Play/Pause
    const playPauseBtn = controls.querySelector(".play-pause");
    playPauseBtn.addEventListener("click", () => this.togglePlay());

    // Progress bar
    const progressBar = controls.querySelector(".progress-bar");
    const progressFilled = controls.querySelector(".progress-bar-filled");

    progressBar.addEventListener("click", (e) => {
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      this.modalVideo.currentTime = pos * this.modalVideo.duration;
    });

    // Update progress
    this.modalVideo.addEventListener("timeupdate", () => {
      const percent =
        (this.modalVideo.currentTime / this.modalVideo.duration) * 100;
      progressFilled.style.width = `${percent}%`;
      controls.querySelector(".current-time").textContent = this.formatTime(
        this.modalVideo.currentTime
      );
    });

    // Duration
    this.modalVideo.addEventListener("loadedmetadata", () => {
      controls.querySelector(".duration").textContent = this.formatTime(
        this.modalVideo.duration
      );
    });

    // Volume control
    const volumeSlider = controls.querySelector(".volume-slider");
    const muteBtn = controls.querySelector(".mute-unmute");

    volumeSlider.addEventListener("input", (e) => {
      this.modalVideo.volume = e.target.value;
      this.updateVolumeIcon(controls);
    });

    muteBtn.addEventListener("click", () => {
      this.modalVideo.muted = !this.modalVideo.muted;
      this.updateVolumeIcon(controls);
    });

    // Fullscreen
    const fullscreenBtn = controls.querySelector(".fullscreen");
    fullscreenBtn.addEventListener("click", () =>
      this.toggleFullscreen(this.modal.querySelector(".modal-content"))
    );
  }

  togglePlay() {
    if (!this.modalVideo) return;

    if (this.modalVideo.paused) {
      const playPromise = this.modalVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => console.error("Play error:", error));
      }
    } else {
      this.modalVideo.pause();
    }
    this.updatePlayButton();
  }

  updatePlayButton(forcePlay = false) {
    const playPauseBtn = this.modal.querySelector(".play-pause");
    if (!playPauseBtn) return;

    const isPlaying = forcePlay ? false : !this.modalVideo.paused;
    playPauseBtn.innerHTML = `<i class="fas fa-${
      isPlaying ? "pause" : "play"
    }"></i>`;
  }

  updateVolumeIcon(controls) {
    const muteBtn = controls.querySelector(".mute-unmute");
    if (!muteBtn) return;

    const video = this.isModalOpen ? this.modalVideo : this.video;
    let icon = "volume-up";
    if (video.muted || video.volume === 0) {
      icon = "volume-mute";
    } else if (video.volume < 0.5) {
      icon = "volume-down";
    }
    muteBtn.innerHTML = `<i class="fas fa-${icon}"></i>`;
  }

  async toggleFullscreen(element) {
    if (!document.fullscreenElement) {
      try {
        await element.requestFullscreen();
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    } else {
      await document.exitFullscreen();
    }
  }

  handleOrientation() {
    if (window.innerWidth <= 768) {
      const container = this.modal.querySelector(".modal-video-container");
      if (window.matchMedia("(orientation: landscape)").matches) {
        container.style.height = "100vh";
        container.style.width = "100vw";
      } else {
        container.style.height = "auto";
        container.style.width = "100%";
        container.style.paddingTop = "56.25%";
      }
    }
  }

  async requestFullscreenVideo() {
    const modalContent = this.modal.querySelector(".modal-content");
    try {
      if (modalContent.requestFullscreen) {
        await modalContent.requestFullscreen();
      } else if (modalContent.webkitRequestFullscreen) {
        await modalContent.webkitRequestFullscreen();
      } else if (modalContent.msRequestFullscreen) {
        await modalContent.msRequestFullscreen();
      }
    } catch (err) {
      console.log("Fullscreen request failed:", err);
    }
  }
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  handleVideoError() {
    const container = this.isModalOpen
      ? this.modal.querySelector(".modal-video-container")
      : this.container;

    const errorMsg = document.createElement("div");
    errorMsg.className = "video-error";
    errorMsg.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error loading video. Please try again.</p>
        `;

    container.innerHTML = "";
    container.appendChild(errorMsg);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing gallery...');
  new ProjectGallery();
});





