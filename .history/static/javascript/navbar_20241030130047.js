// navbar.js
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navContent = document.querySelector(".nav-content");
  const navLinks = document.querySelectorAll(".nav-content a");
  const navOverlay = document.querySelector(".nav-overlay");

  // Mobile menu toggle with overlay
  mobileMenuBtn?.addEventListener("click", () => {
    navContent.classList.toggle("show");
    navOverlay.classList.toggle("show");
    document.body.style.overflow = navContent.classList.contains("show")
      ? "hidden"
      : "";
  });

  // Close mobile menu when clicking overlay
  navOverlay?.addEventListener("click", () => {
    navContent.classList.remove("show");
    navOverlay.classList.remove("show");
    document.body.style.overflow = "";
  });

  // Close mobile menu when pressing Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navContent.classList.contains("show")) {
      navContent.classList.remove("show");
      navOverlay.classList.remove("show");
      document.body.style.overflow = "";
    }
  });

  // Handle scroll events with improved section detection
  const handleScroll = () => {
    const sections = document.querySelectorAll("section[id]");
    const scrollY = window.pageYOffset;

    sections.forEach((section) => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 100;
      const sectionId = section.getAttribute("id");

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach((link) => link.classList.remove("active"));
        const correspondingLink = document.querySelector(
          `.nav-content a[href="#${sectionId}"]`
        );
        if (correspondingLink) {
          correspondingLink.classList.add("active");
        }
      }
    });
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll();

  // Smooth scrolling with offset for navbar
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const navHeight = navbar.offsetHeight;
        const targetPosition = targetSection.offsetTop - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        // Close mobile menu if open
        navContent.classList.remove("show");
        navOverlay.classList.remove("show");
        document.body.style.overflow = "";
      }
    });
  });
});
