
class VideoPlayer {
    constructor(container) {
        this.container = container;
        this.video = container.querySelector('video');
        this.controls = container.querySelector('.video-controls');        
        this.playPauseBtn = container.querySelector('.play-pause');
        this.progress = container.querySelector('.progress-bar');
        this.progressFilled = container.querySelector('.progress-bar-filled');
        this.currentTime = container.querySelector('.current-time');
        this.duration = container.querySelector('.duration');
        this.muteBtn = container.querySelector('.mute-unmute');
        this.volumeSlider = container.querySelector('.volume-slider');
        this.fullscreenBtn = container.querySelector('.fullscreen');    
        this.initializePlayer();
    }
    
    initializePlayer() {
      // Initial setup
      this.updateTimestamp();

      // Play/Pause
      this.playPauseBtn.addEventListener("click", () => this.togglePlay());
      this.video.addEventListener("click", () => this.togglePlay());

      // Update progress
      this.video.addEventListener("timeupdate", () => this.updateProgress());

      // Click on progress bar
      this.progress.addEventListener("click", (e) => this.scrub(e));

      // Volume control
      this.muteBtn.addEventListener("click", () => this.toggleMute());
      this.volumeSlider.addEventListener("input", (e) => this.updateVolume(e));

      // Fullscreen
      this.fullscreenBtn.addEventListener("click", () =>
        this.toggleFullscreen()
      );

      // Update button icons
      this.video.addEventListener("play", () => {
        this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      });

      this.video.addEventListener("pause", () => {
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      });

      // Add this to your VideoPlayer class constructor
      this.video.addEventListener("loadedmetadata", () => {
        this.updateTimestamp();
        // Check if video is actually loaded
        if (this.video.readyState >= 2) {
          console.log("Video loaded successfully");
        } else {
          console.error("Video failed to load");
        }
      });

      // Add error handling
      this.video.addEventListener("error", () => {
        console.error("Video error:", this.video.error);
      });

      // Mobile optimization
      if ("ontouchstart" in window) {
        this.container.classList.add("touch-device");
      }
    }
    
    togglePlay() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }
    
    updateProgress() {
        const percent = (this.video.currentTime / this.video.duration) * 100;
        this.progressFilled.style.width = `${percent}%`;
        this.updateTimestamp();
    }
    
    scrub(e) {
        const scrubTime = (e.offsetX / this.progress.offsetWidth) * this.video.duration;
        this.video.currentTime = scrubTime;
    }
    
    toggleMute() {
        this.video.muted = !this.video.muted;
        this.muteBtn.innerHTML = this.video.muted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
    }
    
    updateVolume(e) {
        this.video.volume = e.target.value;
        this.video.muted = e.target.value === 0;
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    formatTime(seconds) {
        const date = new Date(seconds * 1000);
        const mm = date.getUTCMinutes();
        const ss = String(date.getUTCSeconds()).padStart(2, '0');
        return `${mm}:${ss}`;
    }
    
    updateTimestamp() {
        this.currentTime.textContent = this.formatTime(this.video.currentTime);
        this.duration.textContent = this.formatTime(this.video.duration || 0);
    }
}

// Initialize all video players on the page
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.custom-video-player').forEach(container => {
        new VideoPlayer(container);
    });
});
