class VideoPlayer {
  constructor(container) {
    this.container = container;
    this.video = container.querySelector("video");
    this.playOverlay = container.querySelector(".play-overlay");
    this.modal = null;
    this.modalVideo = null;
    this.isModalOpen = false;

    this.initializePlayer();
    this.createModal();
    this.setupEventListeners();
  }

  initializePlayer() {
    // Set initial states
    this.video.preload = "metadata";
    this.video.playsInline = true;

    // Show play overlay initially
    if (this.playOverlay) {
      this.playOverlay.style.display = "flex";
    }
  }

  createModal() {
    // Create modal if it doesn't exist
    if (!document.querySelector(".video-modal")) {
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
    this.modal = document.querySelector(".video-modal");
  }

  setupEventListeners() {
    // Play overlay click handler
    if (this.playOverlay) {
      this.playOverlay.addEventListener("click", (e) => {
        e.preventDefault();
        this.openModal();
      });
    }

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

    // Setup modal video controls
    this.setupModalControls();

    // Play the video
    const playPromise = this.modalVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error("Auto-play error:", error);
        // Show play button if autoplay fails
        this.updatePlayButton(true);
      });
    }

    // Add active class for animation
    setTimeout(() => {
      this.modal.classList.add("active");
    }, 10);
  }

  closeModal() {
    this.isModalOpen = false;
    this.modal.classList.remove("active");

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
    }, 300); // Match transition duration
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
      this.updateVolumeIcon();
    });

    muteBtn.addEventListener("click", () => {
      this.modalVideo.muted = !this.modalVideo.muted;
      this.updateVolumeIcon();
    });

    // Fullscreen
    const fullscreenBtn = controls.querySelector(".fullscreen");
    fullscreenBtn.addEventListener("click", () => this.toggleFullscreen());
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

  updateVolumeIcon() {
    const muteBtn = this.modal.querySelector(".mute-unmute");
    if (!muteBtn) return;

    let icon = "volume-up";
    if (this.modalVideo.muted || this.modalVideo.volume === 0) {
      icon = "volume-mute";
    } else if (this.modalVideo.volume < 0.5) {
      icon = "volume-down";
    }
    muteBtn.innerHTML = `<i class="fas fa-${icon}"></i>`;
  }

  async toggleFullscreen() {
    if (!document.fullscreenElement) {
      try {
        await this.modal.querySelector(".modal-content").requestFullscreen();
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    } else {
      await document.exitFullscreen();
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

// Initialize all video players
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".custom-video-player").forEach((container) => {
    new VideoPlayer(container);
  });
});
