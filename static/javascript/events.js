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

// Calendar grid update functionality
function updateCalendarGrid(calendarData) {
  const grid = document.querySelector(".calendar-grid");

  // Keep the header days
  const headerDays = Array.from(grid.querySelectorAll(".calendar-day.header"));

  // Clear the grid except for headers
  grid.innerHTML = "";

  // Add back the header days
  headerDays.forEach((day) => grid.appendChild(day));

  // Add the new calendar days
  calendarData.forEach((week) => {
    week.forEach((day) => {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";

      // Add appropriate classes
      if (day.events && day.events.length > 0)
        dayElement.classList.add("has-event");
      if (day.is_today) dayElement.classList.add("today");
      if (day.is_past) dayElement.classList.add("past");

      // Add click handler for days with events
      if (day.day !== 0 && day.events && day.events.length > 0) {
        dayElement.onclick = () =>
          showDayEvents(dayElement, day.day, day.events);
      }

      // Create day content
      if (day.day !== 0) {
        // Add day number
        const dayNumber = document.createElement("span");
        dayNumber.className = "day-number";
        dayNumber.textContent = day.day;
        dayElement.appendChild(dayNumber);

        // Add event dots if there are events
        if (day.events && day.events.length > 0) {
          const eventDots = document.createElement("div");
          eventDots.className = "event-dots";

          // Add up to 3 event dots
          const numDots = Math.min(day.events.length, 3);
          for (let i = 0; i < numDots; i++) {
            const dot = document.createElement("div");
            dot.className = "event-dot";
            dot.title = day.events[i].title;
            eventDots.appendChild(dot);
          }

          // Add "more" dot if there are more than 3 events
          if (day.events.length > 3) {
            const moreDot = document.createElement("div");
            moreDot.className = "event-dot more";
            moreDot.title = `+${day.events.length - 3} more events`;
            eventDots.appendChild(moreDot);
          }

          dayElement.appendChild(eventDots);
        }
      }

      grid.appendChild(dayElement);
    });
  });
}

// Calendar navigation functionality
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




// Social sharing functionality
function initializeShareFunctionality() {
    const shareButtons = document.querySelectorAll(".share-button");

    shareButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleShareMenu(button);
        });
    });

    // Add click handlers for share menu items
    document.addEventListener("click", (e) => {
        const shareMenuItem = e.target.closest(".share-menu-item");
        if (shareMenuItem) {
            e.preventDefault();
            handleShare(shareMenuItem);
        }
    });

    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.share-button') && !e.target.closest('.share-menu')) {
            closeAllShareMenus();
        }
    });
}

function toggleShareMenu(button) {
    // Get the event card data
    const eventCard = button.closest(".event-card");
    const title = eventCard.querySelector("h3").textContent;
    const description = eventCard.querySelector(".event-description p").textContent;
    const venue = eventCard.querySelector(".event-meta span:first-child").textContent;
    const time = eventCard.querySelector(".event-meta span:last-child").textContent;
    const imageUrl = eventCard.querySelector(".event-image img").src;
    const eventUrl = eventCard.querySelector(".btn-primary").href;

    // Get the next sibling which is the share menu
    const shareMenu = button.nextElementSibling;

    // Close all other open menus first
    document.querySelectorAll(".share-menu.active").forEach((menu) => {
        if (menu !== shareMenu) {
            menu.classList.remove("active");
        }
    });

    // Generate menu items
    shareMenu.innerHTML = generateShareMenuItems(title, description, venue, time, imageUrl, eventUrl);

    // Toggle menu visibility
    shareMenu.classList.toggle("active");
}

function generateShareMenuItems(title, description, venue, time, imageUrl, eventUrl) {
    const encodedText = encodeURIComponent(`${title}\n${venue}\n${time}\n\nDetails: ${eventUrl}`);
    const encodedUrl = encodeURIComponent(eventUrl);
    const encodedTitle = encodeURIComponent(title);

    return `
        <a href="#" class="share-menu-item" data-platform="copy" data-url="${eventUrl}">
            <i class="far fa-copy"></i> Copy Link
            <span class="copy-feedback">Copied!</span>
        </a>
        <a href="https://wa.me/?text=${encodedText}" class="share-menu-item" data-platform="whatsapp" target="_blank">
            <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" class="share-menu-item" data-platform="facebook" target="_blank">
            <i class="fab fa-facebook"></i> Facebook
        </a>
        <a href="https://www.instagram.com/share?url=${encodedUrl}" class="share-menu-item" data-platform="instagram" target="_blank">
            <i class="fab fa-instagram"></i> Instagram
        </a>
        <a href="https://www.tiktok.com/share?url=${encodedUrl}" class="share-menu-item" data-platform="tiktok" target="_blank">
            <i class="fab fa-tiktok"></i> TikTok
        </a>
        <a href="mailto:?subject=${encodedTitle}&body=${encodedText}" class="share-menu-item" data-platform="email">
            <i class="fas fa-envelope"></i> Email
        </a>
    `;
}

function handleShare(shareMenuItem) {
    const platform = shareMenuItem.dataset.platform;
    const href = shareMenuItem.href;

    if (platform === "copy") {
        try {
            const url = shareMenuItem.dataset.url;
            navigator.clipboard.writeText(url);

            // Show feedback
            const feedback = shareMenuItem.querySelector(".copy-feedback");
            feedback.classList.add("active");

            // Hide feedback after 2 seconds
            setTimeout(() => {
                feedback.classList.remove("active");
            }, 2000);

            // Close menu after successful copy
            setTimeout(() => {
                closeAllShareMenus();
            }, 1000);
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            const textarea = document.createElement("textarea");
            textarea.value = shareMenuItem.dataset.url;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand("copy");
                const feedback = shareMenuItem.querySelector(".copy-feedback");
                feedback.classList.add("active");
                setTimeout(() => {
                    feedback.classList.remove("active");
                }, 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
            document.body.removeChild(textarea);
        }
        return;
    }

    // For platforms that support web share API
    if (navigator.share && (platform === "whatsapp" || platform === "facebook" || 
        platform === "instagram" || platform === "tiktok")) {
        try {
            navigator.share({
                title: shareMenuItem.closest(".event-card").querySelector("h3").textContent,
                text: shareMenuItem.closest(".event-card").querySelector(".event-description p").textContent,
                url: window.location.href,
            });
        } catch (err) {
            // Fallback to traditional sharing
            window.open(href, "_blank");
        }
    } else if (platform === "email") {
        window.location.href = href;
    } else {
        window.open(href, "_blank");
    }

    // Close share menu
    closeAllShareMenus();
}

function closeAllShareMenus() {
    document.querySelectorAll('.share-menu.active').forEach(menu => menu.classList.remove('active'));
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

// Mobile calendar slide functionality
function initializeCalendarSlide() {
  const calendarSection = document.getElementById("calendar");

  // Create and add mobile header if it doesn't exist
  if (
    window.innerWidth <= 768 &&
    !document.querySelector(".calendar-mobile-header")
  ) {
    const mobileHeader = document.createElement("div");
    mobileHeader.className = "calendar-mobile-header";
    mobileHeader.innerHTML = `
            <h2>Calendar</h2>
            <button class="calendar-close-btn">&times;</button>
        `;
    calendarSection.insertBefore(mobileHeader, calendarSection.firstChild);
  }

  // Create overlay if it doesn't exist
  if (!document.querySelector(".calendar-overlay")) {
    const overlay = document.createElement("div");
    overlay.className = "calendar-overlay";
    document.body.appendChild(overlay);
  }

  // Add click handlers
  document.addEventListener("click", function (e) {
    const calendarLink = e.target.closest('a[href="#calendar"]');
    if (calendarLink && window.innerWidth <= 768) {
      e.preventDefault();
      showMobileCalendar();
    }

    if (e.target.matches(".calendar-close-btn")) {
      hideMobileCalendar();
    }

    if (e.target.matches(".calendar-overlay")) {
      hideMobileCalendar();
    }
  });
}

function showMobileCalendar() {
  const calendarSection = document.getElementById("calendar");
  const overlay = document.querySelector(".calendar-overlay");

  calendarSection.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent background scrolling
}

function hideMobileCalendar() {
  const calendarSection = document.getElementById("calendar");
  const overlay = document.querySelector(".calendar-overlay");

  calendarSection.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = ""; // Restore scrolling
}

// Initialize all functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize scroll tracking
  initializeScrollNavigation();

  // Initialize calendar navigation
  initializeCalendarNavigation();

  // Initialize share functionality
  initializeShareFunctionality();

  // Initialize calendar slide for mobile
  initializeCalendarSlide();

  // Add event listeners for modal closes
  const modal = document.getElementById("dayEventsModal");
  const closeButton = document.querySelector(".close-modal");

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }

  // Close modal on escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal) {
      modal.classList.remove("active");
    }
  });

  // Log to verify initialization
  console.log("Events page initialized");
});
