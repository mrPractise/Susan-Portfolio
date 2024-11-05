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
  function updateActiveNav() {
    const scrollPosition = window.scrollY;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
          }
        });
      }
    });
  }

  // Add scroll event listener with debounce
  let scrollTimeout;
  window.addEventListener("scroll", function () {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(function () {
      updateActiveNav();
    });
  });

  // Initial call to updateActiveNav
  updateActiveNav();
}

// Calendar navigation
function initializeCalendarNavigation() {
  const prevButton = document.getElementById("prevMonth");
  const nextButton = document.getElementById("nextMonth");

  if (prevButton && nextButton) {
    prevButton.addEventListener("click", () => navigateMonth("prev"));
    nextButton.addEventListener("click", () => navigateMonth("next"));
  }
}

async function navigateMonth(direction) {
  try {
    const calendarHeader = document.querySelector(".calendar-header h2");
    const [currentMonth, currentYear] = calendarHeader.textContent.split(" ");

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    let monthIndex = monthNames.indexOf(currentMonth);
    let year = parseInt(currentYear);

    if (direction === "prev") {
      monthIndex--;
      if (monthIndex < 0) {
        monthIndex = 11;
        year--;
      }
    } else {
      monthIndex++;
      if (monthIndex > 11) {
        monthIndex = 0;
        year++;
      }
    }

    // Get the current URL without query parameters
    const baseUrl = window.location.pathname;

    const response = await fetch(
      `${baseUrl}?month=${monthIndex + 1}&year=${year}`,
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    if (data.status === "success") {
      // Update calendar header
      calendarHeader.textContent = `${data.month_name} ${data.year}`;

      // Update calendar grid with new data
      updateCalendarGrid(data.calendar_data);

      // Update URL without page reload
      const newUrl = `${baseUrl}?month=${monthIndex + 1}&year=${year}`;
      window.history.pushState(
        { month: monthIndex + 1, year: year },
        "",
        newUrl
      );
    } else {
      throw new Error(data.message || "Error updating calendar");
    }
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    // Show user-friendly error message
    const errorMessage = document.createElement("div");
    errorMessage.className = "alert alert-error";
    errorMessage.textContent = "Failed to update calendar. Please try again.";
    const calendarContainer = document.querySelector(".calendar-container");
    calendarContainer.insertBefore(errorMessage, calendarContainer.firstChild);

    // Remove error message after 3 seconds
    setTimeout(() => {
      errorMessage.remove();
    }, 3000);
  }
}
// Share functionality
function initializeShareFunctionality() {
  const shareButtons = document.querySelectorAll(".share-button");
  const shareOverlay = document.getElementById("shareOverlay");

  shareButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleShareMenu(button);
    });
  });

  if (shareOverlay) {
    shareOverlay.addEventListener("click", closeAllShareMenus);
  }
}

function toggleShareMenu(button) {
  const menu = button.nextElementSibling;
  const overlay = document.getElementById("shareOverlay");

  // Close any open share menus
  document.querySelectorAll(".share-menu.active").forEach((m) => {
    if (m !== menu) m.classList.remove("active");
  });

  menu.classList.toggle("active");
  if (overlay) {
    overlay.classList.toggle("active");
  }
}

function closeAllShareMenus() {
  document
    .querySelectorAll(".share-menu.active")
    .forEach((menu) => menu.classList.remove("active"));
  const overlay = document.getElementById("shareOverlay");
  if (overlay) {
    overlay.classList.remove("active");
  }
}

// Day events modal functionality
function showDayEvents(dayElement, day, events) {
  const modal = document.getElementById("dayEventsModal");
  const eventsList = document.getElementById("dayEventsList");
  const selectedDate = document.getElementById("selectedDate");
  const currentMonth = document.querySelector(
    ".calendar-header h2"
  ).textContent;

  if (!modal || !eventsList || !selectedDate) {
    console.error("Required modal elements not found");
    return;
  }

  // Set the date in the modal header
  selectedDate.textContent = `${currentMonth} ${day}`;

  // Clear previous events
  eventsList.innerHTML = "";

  // Parse events if it's a string
  const eventsData = typeof events === "string" ? JSON.parse(events) : events;

  // Sort events by start_time
  eventsData.sort((a, b) => {
    if (a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }
    return 0;
  });

  // Add each event to the modal
  eventsData.forEach((event) => {
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
}




// Add new calendar sliding functionality
function initializeCalendarSlide() {
    const calendarSection = document.getElementById('calendar');
    
    // Create and add mobile header if it doesn't exist
    if (window.innerWidth <= 768 && !document.querySelector('.calendar-mobile-header')) {
        const mobileHeader = document.createElement('div');
        mobileHeader.className = 'calendar-mobile-header';
        mobileHeader.innerHTML = `
            <h2>Calendar</h2>
            <button class="calendar-close-btn">&times;</button>
        `;
        calendarSection.insertBefore(mobileHeader, calendarSection.firstChild);
    }

    // Create overlay if it doesn't exist
    if (!document.querySelector('.calendar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'calendar-overlay';
        document.body.appendChild(overlay);
    }

    // Add click handlers
    document.addEventListener('click', function(e) {
        const calendarLink = e.target.closest('a[href="#calendar"]');
        if (calendarLink && window.innerWidth <= 768) {
            e.preventDefault();
            showMobileCalendar();
        }

        if (e.target.matches('.calendar-close-btn')) {
            hideMobileCalendar();
        }

        if (e.target.matches('.calendar-overlay')) {
            hideMobileCalendar();
        }
    });
}

function showMobileCalendar() {
    const calendarSection = document.getElementById('calendar');
    const overlay = document.querySelector('.calendar-overlay');
    
    calendarSection.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function hideMobileCalendar() {
    const calendarSection = document.getElementById('calendar');
    const overlay = document.querySelector('.calendar-overlay');
    
    calendarSection.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Update the initialization
document.addEventListener('DOMContentLoaded', function() {
    // Existing initialization code...
    
    // Add calendar slide initialization
    initializeCalendarSlide();
    
    // Handle resize events
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            // Reset calendar visibility on desktop
            const calendarSection = document.getElementById('calendar');
            const overlay = document.querySelector('.calendar-overlay');
            calendarSection.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});