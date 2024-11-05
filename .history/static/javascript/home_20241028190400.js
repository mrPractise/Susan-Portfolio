// Home Section Scripts
document.addEventListener("DOMContentLoaded", () => {
  // Scroll down button functionality
  const scrollDownBtn = document.querySelector(".scroll-down");
  if (scrollDownBtn) {
    scrollDownBtn.addEventListener("click", () => {
      document.querySelector("#about").scrollIntoView({ behavior: "smooth" });
    });
  }
});
