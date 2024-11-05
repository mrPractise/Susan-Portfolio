// Calendar initialization and navigation
document.addEventListener("DOMContentLoaded", function () {
  initializeCalendarNavigation();
  initializeScrollNavigation();
  initializeShareFunctionality();
});

function initializeCalendarNavigation() {
  document.getElementById("prevMonth").addEventListener("click", () => {
    const currentUrl = new URL(window.location);
    const currentMonth =
      parseInt(currentUrl.searchParams.get("month")) ||
      new Date().getMonth() + 1;
    const currentYear =
      parseInt(currentUrl.searchParams.get("year")) || new Date().getFullYear();

    let newMonth = currentMonth - 1;
    let newYear = currentYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    window.location.href = `?month=${newMonth}&year=${newYear}#calendar`;
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    const currentUrl = new URL(window.location);
    const currentMonth =
      parseInt(currentUrl.searchParams.get("month")) ||
      new Date().getMonth() + 1;
    const currentYear =
      parseInt(currentUrl.searchParams.get("year")) || new Date().getFullYear();

    let newMonth = currentMonth + 1;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    window.location.href = `?month=${newMonth}&year=${newYear}#calendar`;
  });
}

// Scroll navigation functionality
function initializeScrollNavigation() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".events-nav a");

  // Add smooth scrolling to nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (link.getAttribute("href").startsWith("#")) {
        e.preventDefault();
        const targetId = this.getAttribute("href").slice(1);
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  // Update active nav link on scroll
  let isScrolling;
  window.addEventListener("scroll", function () {
    clearTimeout(isScrolling);
    isScrolling = setTimeout(updateActiveNav, 50);
  });

  // Initial update
  updateActiveNav();
}

function updateActiveNav() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".events-nav a");

  let currentSection = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.offsetHeight;
    const scrollPosition = window.scrollY;

    if (
      scrollPosition >= sectionTop &&
      scrollPosition < sectionTop + sectionHeight
    ) {
      currentSection = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${currentSection}`) {
      link.classList.add("active");
    }
  });
}

// Share functionality
function initializeShareFunctionality() {
  document.querySelectorAll(".share-menu-item").forEach((item) => {
    item.addEventListener("click", handleShare);
  });

  document
    .getElementById("shareOverlay")
    .addEventListener("click", closeAllShareMenus);
}

function toggleShareMenu(button) {
  event.stopPropagation();
  const menu = button.nextElementSibling;
  const overlay = document.getElementById("shareOverlay");

  // Close any open share menus
  document.querySelectorAll(".share-menu.active").forEach((m) => {
    if (m !== menu) m.classList.remove("active");
  });

  menu.classList.toggle("active");
  overlay.classList.toggle("active");
}

function handleShare(e) {
  e.preventDefault();
  e.stopPropagation();

  const platform = this.dataset.platform;
  const title = this.dataset.title;
  const description = this.dataset.description;

  if (platform === "whatsapp") {
    const text = `${title}\n${description}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  closeAllShareMenus();
}

function closeAllShareMenus() {
  document
    .querySelectorAll(".share-menu.active")
    .forEach((menu) => menu.classList.remove("active"));
  document.getElementById("shareOverlay").classList.remove("active");
}

// Day events modal functionality
function showDayEvents(dayElement, day, events) {
  const modal = document.getElementById("dayEventsModal");
  const eventsList = document.getElementById("dayEventsList");
  const selectedDate = document.getElementById("selectedDate");
  const currentMonth = document.querySelector(
    ".calendar-header h2"
  ).textContent;

  // Set the date in the modal header
  selectedDate.textContent = `${currentMonth} ${day}`;

  // Clear previous events
  eventsList.innerHTML = "";

  // Sort events by start_time
  events.sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Add each event to the modal
  events.forEach((event) => {
    const eventItem = document.createElement("div");
    eventItem.className = "day-event-item";

    eventItem.innerHTML = `
            <h4>${event.title}</h4>
            <div class="day-event-meta">
                <span class="event-time">
                    <i class="fas fa-clock"></i> 
                    ${event.start_time} - ${event.end_time}
                </span>
                <span>
                    <i class="fas fa-map-marker-alt"></i> 
                    ${event.venue || "Venue TBA"}
                </span>
            </div>
            <a href="/events/${
              event.slug
            }/" class="btn btn-primary btn-sm">Book Tickets</a>
        `;

    eventsList.appendChild(eventItem);
  });

  // Show modal
  modal.classList.add("active");

  // Handle closing
  const closeModal = () => modal.classList.remove("active");

  document.querySelector(".close-modal").onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Close on escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });
}
