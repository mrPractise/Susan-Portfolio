// Video Player Class
class VideoPlayer {
  static modalInstance = document.querySelector(".video-modal");
  static initializedVideos = new Set();

  constructor(container) {
    const videoId = container.getAttribute("data-video-id");

    // Prevent double initialization
    if (VideoPlayer.initializedVideos.has(videoId)) {
      console.log(`Skipping already initialized video: ${videoId}`);
      return;
    }

    console.log(`Initializing new video player: ${videoId}`);

    this.container = container;
    this.video = container.querySelector("video");
    this.modal = VideoPlayer.modalInstance;
    this.modalVideo = null;
    this.isModalOpen = false;
    this.videoId = videoId;

    if (this.video && this.modal) {
      VideoPlayer.initializedVideos.add(videoId);
      this.initializePlayer();
      this.setupEventListeners();
      this.setupMainVideoControls();
    }
  }

  initializePlayer() {
    if (!this.video) {
      console.error(`No video element found for video ${this.videoId}`);
      return;
    }
    console.log(`Setting up video ${this.videoId}`);
    this.video.preload = "metadata";
    this.video.playsInline = true;
  }

  setupEventListeners() {
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
      if (e.key === "Escape" && this.isModalOpen) {
        this.closeModal();
      }
    });

    this.video.addEventListener("error", () => {
      console.error("Video error:", this.video.error);
      this.handleVideoError();
    });
  }
  setupMainVideoControls() {
    const controls = this.container.querySelector(".video-controls");
    if (!controls) return;

    const playPauseBtn = controls.querySelector(".play-pause");
    playPauseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleMainVideo();
    });

    const progressBar = controls.querySelector(".progress-bar");
    const progressFilled = controls.querySelector(".progress-bar-filled");

    progressBar.addEventListener("click", (e) => {
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      this.video.currentTime = pos * this.video.duration;
    });

    this.video.addEventListener("timeupdate", () => {
      const percent = (this.video.currentTime / this.video.duration) * 100;
      progressFilled.style.width = `${percent}%`;
      controls.querySelector(".current-time").textContent = this.formatTime(
        this.video.currentTime
      );
    });

    this.video.addEventListener("loadedmetadata", () => {
      controls.querySelector(".duration").textContent = this.formatTime(
        this.video.duration
      );
    });

    this.video.addEventListener("play", () => this.updateMainPlayButton());
    this.video.addEventListener("pause", () => this.updateMainPlayButton());

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

