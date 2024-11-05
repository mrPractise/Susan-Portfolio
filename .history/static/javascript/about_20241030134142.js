// about.js
document.addEventListener("DOMContentLoaded", () => {
  // Initialize skill bars
  function initSkillBars() {
    const skillBars = document.querySelectorAll(".skill-bar");
    skillBars.forEach((bar) => {
      const progress = bar.querySelector(".skill-progress");
      const percentage = bar.dataset.percentage;
      progress.style.transform = `scaleX(${percentage / 100})`;
    });
  }

  // Animate timeline items on scroll
  const observerOptions = {
    threshold: 0.2,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".timeline-item").forEach((item) => {
    observer.observe(item);
  });

  // Initialize counters for stats
  function animateCounters() {
    const stats = document.querySelectorAll(".stat-number");
    stats.forEach((stat) => {
      const target = parseInt(stat.textContent);
      let current = 0;
      const increment = target / 50;
      const duration = 1500;
      const step = duration / 50;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          stat.textContent = Math.floor(current) + "+";
          setTimeout(updateCounter, step);
        } else {
          stat.textContent = target + "+";
        }
      };

      updateCounter();
    });
  }

  // Add parallax effect to profile card
  function initParallax() {
    const card = document.querySelector(".profile-card");
    if (!card) return;

    document.addEventListener("mousemove", (e) => {
      const { clientX, clientY } = e;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const moveX = (clientX - centerX) / 20;
      const moveY = (clientY - centerY) / 20;

      card.style.transform = `perspective(1000px) rotateY(${moveX}deg) rotateX(${-moveY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg)";
    });
  }

  // Animate timeline progress
  function animateTimeline() {
    const track = document.querySelector(".timeline-track");
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            track.style.background = "var(--gradient)";
            track.style.transition = "background 1.5s ease";
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(track);
  }

  // Add hover effects for timeline items
  function initTimelineHover() {
    const items = document.querySelectorAll(".timeline-item");
    items.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        const marker = item.querySelector(".item-marker");
        marker.style.transform = "scale(1.3)";
        marker.style.transition = "transform 0.3s ease";
      });

      item.addEventListener("mouseleave", () => {
        const marker = item.querySelector(".item-marker");
        marker.style.transform = "scale(1)";
      });
    });
  }

  // Animate skill bars on card flip
  function initSkillBarAnimation() {
    const card = document.querySelector(".profile-card");
    const skillBars = document.querySelectorAll(".skill-progress");

    card.addEventListener("mouseenter", () => {
      setTimeout(() => {
        skillBars.forEach((bar) => {
          const percentage = bar.parentElement.dataset.percentage;
          bar.style.transform = `scaleX(${percentage / 100})`;
          bar.style.transition = "transform 1s ease";
        });
      }, 400); // Wait for card flip animation
    });

    card.addEventListener("mouseleave", () => {
      skillBars.forEach((bar) => {
        bar.style.transform = "scaleX(0)";
      });
    });
  }

  // Add smooth scroll for internal links
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });
  }

  // Initialize animations when section becomes visible
  function initSectionAnimation() {
    const section = document.querySelector(".about-section");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          initSkillBars();
          animateCounters();
          animateTimeline();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(section);
  }

  // Add dynamic background effect
  function initBackgroundEffect() {
    const background = document.querySelector(".about-background");
    if (!background) return;

    document.addEventListener("mousemove", (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth) * 100;
      const y = (clientY / window.innerHeight) * 100;

      background.style.background = `
                radial-gradient(
                    circle at ${x}% ${y}%,
                    rgba(112, 119, 161, 0.1),
                    transparent 50%
                )
            `;
    });
  }

  // Handle responsive features
  function handleResponsive() {
    const isMobile = window.innerWidth <= 768;
    const card = document.querySelector(".profile-card");

    if (isMobile) {
      // Disable parallax on mobile
      card.style.transform = "none";
      document.removeEventListener("mousemove", initParallax);
    } else {
      // Re-enable features for desktop
      initParallax();
    }
  }

  // Initialize all features
  function init() {
    initSectionAnimation();
    initTimelineHover();
    initSkillBarAnimation();
    initSmoothScroll();
    initBackgroundEffect();
    handleResponsive();

    // Handle window resize
    window.addEventListener("resize", handleResponsive);
  }

  // Start initialization
  init();
});