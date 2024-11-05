class VideoPlayer {
  constructor(container) {
    this.container = container;
    this.video = container.querySelector("video");
    this.controls = container.querySelector(".video-controls");
    this.playPauseBtn = container.querySelector(".play-pause");
    this.progress = container.querySelector(".progress-bar");
    this.progressFilled = container.querySelector(".progress-bar-filled");
    this.currentTime = container.querySelector(".current-time");
    this.duration = container.querySelector(".duration");
    this.muteBtn = container.querySelector(".mute-unmute");
    this.volumeSlider = container.querySelector(".volume-slider");
    this.fullscreenBtn = container.querySelector(".fullscreen");
    this.loading = container.querySelector(".loading-spinner");
this.modal = document.querySelector(".video-modal");
this.modalContainer = this.modal.querySelector(".modal-video-container");



    this.dragging = false;
    this.lastVolume = 1;
    this.bufferingTimeout = null;
this.setupModal();
    this.initializePlayer();
    this.setupEventListeners();
    this.setupMobileOptimization();
  }

  initializePlayer() {
    // Set initial volume from localStorage or default
    const savedVolume = localStorage.getItem("videoPlayerVolume");
    if (savedVolume !== null) {
      this.video.volume = parseFloat(savedVolume);
      this.volumeSlider.value = this.video.volume;
    }

    // Add to your initializePlayer method
    this.container
      .querySelector(".play-overlay")
      .addEventListener("click", () => this.togglePlay());
    this.video.addEventListener("play", () =>
      this.container.classList.add("video-playing")
    );
    this.video.addEventListener("pause", () =>
      this.container.classList.remove("video-playing")
    );
    // Set initial mute state
    const isMuted = localStorage.getItem("videoPlayerMuted") === "true";
    this.video.muted = isMuted;
    this.updateMuteButton();
  }

  setupEventListeners() {
    // Video events
    this.video.addEventListener("loadedmetadata", () =>
      this.handleLoadedMetadata()
    );
    this.video.addEventListener("timeupdate", () => this.updateProgress());
    this.video.addEventListener("play", () => this.updatePlayButton());
    this.video.addEventListener("pause", () => this.updatePlayButton());
    this.video.addEventListener("waiting", () => this.showBuffering());
    this.video.addEventListener("playing", () => this.hideBuffering());
    this.video.addEventListener("ended", () => this.handleVideoEnd());

    // Control events
    this.playPauseBtn.addEventListener("click", () => this.togglePlay());
    this.muteBtn.addEventListener("click", () => this.toggleMute());
    this.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen());

    // Progress bar events
    this.progress.addEventListener("mousedown", (e) => this.startDragging(e));
    document.addEventListener("mousemove", (e) => this.handleDragging(e));
    document.addEventListener("mouseup", () => this.stopDragging());
    this.progress.addEventListener("click", (e) => this.handleProgressClick(e));

    // Volume control
    this.volumeSlider.addEventListener("input", (e) =>
      this.handleVolumeChange(e)
    );
    this.volumeSlider.addEventListener("change", (e) => this.saveVolume(e));

    // Error handling
    this.video.addEventListener("error", () => this.handleError());
  }

  setupMobileOptimization() {
    if ("ontouchstart" in window) {
      this.container.classList.add("touch-device");
      this.setupTouchEvents();
    }
  }

  setupTouchEvents() {
    let touchStartX = null;
    let touchStartTime = null;

    this.video.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    });

    this.video.addEventListener("touchend", (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndTime = Date.now();

      const dragDistance = Math.abs(touchEndX - touchStartX);
      const touchDuration = touchEndTime - touchStartTime;

      if (dragDistance < 10 && touchDuration < 200) {
        this.togglePlay();
      }
    });
  }

  togglePlay() {
    if (this.video.paused) {
      this.video.play().catch((error) => {
        console.error("Error playing video:", error);
        this.handleError();
      });
    } else {
      this.video.pause();
    }
  }

  updatePlayButton() {
    const icon = this.video.paused ? "play" : "pause";
    this.playPauseBtn.innerHTML = `<i class="fas fa-${icon}"></i>`;
  }

  handleVolumeChange(e) {
    this.video.volume = e.target.value;
    this.video.muted = e.target.value === "0";
    this.updateMuteButton();
  }

  saveVolume(e) {
    localStorage.setItem("videoPlayerVolume", e.target.value);
    localStorage.setItem("videoPlayerMuted", this.video.muted);
  }

  toggleMute() {
    if (this.video.muted) {
      this.video.muted = false;
      this.video.volume = this.lastVolume;
      this.volumeSlider.value = this.lastVolume;
    } else {
      this.lastVolume = this.video.volume;
      this.video.muted = true;
      this.volumeSlider.value = 0;
    }
    this.updateMuteButton();
    localStorage.setItem("videoPlayerMuted", this.video.muted);
  }

  updateMuteButton() {
    let volumeIcon = "volume-up";
    if (this.video.muted || this.video.volume === 0) {
      volumeIcon = "volume-mute";
    } else if (this.video.volume < 0.5) {
      volumeIcon = "volume-down";
    }
    this.muteBtn.innerHTML = `<i class="fas fa-${volumeIcon}"></i>`;
  }

  startDragging(e) {
    this.dragging = true;
    this.updateVideoProgress(e);
  }

  handleDragging(e) {
    if (this.dragging) {
      this.updateVideoProgress(e);
    }
  }

  stopDragging() {
    this.dragging = false;
  }

  handleProgressClick(e) {
    this.updateVideoProgress(e);
  }

  updateVideoProgress(e) {
    const progressRect = this.progress.getBoundingClientRect();
    const percent = (e.clientX - progressRect.left) / progressRect.width;
    this.progressFilled.style.width = `${percent * 100}%`;
    this.video.currentTime = percent * this.video.duration;
  }

  updateProgress() {
    if (!this.dragging) {
      const percent = (this.video.currentTime / this.video.duration) * 100;
      this.progressFilled.style.width = `${percent}%`;
      this.currentTime.textContent = this.formatTime(this.video.currentTime);
    }
  }

  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await this.container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }

  handleLoadedMetadata() {
    this.duration.textContent = this.formatTime(this.video.duration);
    this.loading.style.display = "none";
  }

  showBuffering() {
    clearTimeout(this.bufferingTimeout);
    this.bufferingTimeout = setTimeout(() => {
      this.loading.style.display = "block";
    }, 300);
  }

  hideBuffering() {
    clearTimeout(this.bufferingTimeout);
    this.loading.style.display = "none";
  }

  handleVideoEnd() {
    this.progressFilled.style.width = "100%";
    this.updatePlayButton();
  }

  handleError() {
    this.container.classList.add("error");
    const errorMessage = document.createElement("div");
    errorMessage.className = "video-error";
    errorMessage.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error loading video</p>
        `;
    this.container.appendChild(errorMessage);
  }

  formatTime(seconds) {
    const date = new Date(seconds * 1000);
    const mm = date.getUTCMinutes();
    const ss = String(date.getUTCSeconds()).padStart(2, "0");
    return `${mm}:${ss}`;
  }
}

// Initialize all video players on the page
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".custom-video-player").forEach((container) => {
    new VideoPlayer(container);
  });
});
