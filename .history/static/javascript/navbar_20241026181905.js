// Navbar functionality with improved scroll detection
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navContent = document.querySelector(".nav-content");
  const navLinks = document.querySelectorAll(".nav-content a");

  // Mobile menu toggle
  mobileMenuBtn?.addEventListener("click", () => {
    navContent.classList.toggle("show");
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target) && navContent.classList.contains("show")) {
      navContent.classList.remove("show");
    }
  });

  // Handle scroll events with improved section detection
  const handleScroll = () => {
    // Get all sections
    const sections = document.querySelectorAll("section[id]");

    // Get current scroll position
    const scrollY = window.pageYOffset;

    // Find the current section
    sections.forEach((section) => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 100; // Adjusted offset for navbar height
      const sectionId = section.getAttribute("id");

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        // Remove active class from all links
        navLinks.forEach((link) => link.classList.remove("active"));

        // Add active class to corresponding nav link
        const correspondingLink = document.querySelector(
          `.nav-content a[href="#${sectionId}"]`
        );
        if (correspondingLink) {
          correspondingLink.classList.add("active");
        }
      }
    });
  };

  // Add scroll event listener
  window.addEventListener("scroll", handleScroll);

  // Initial check for active section
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
      }
    });
  });
});
