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

  try {
    const response = await fetch(`?month=${monthIndex + 1}&year=${year}`, {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    if (data.status === "success") {
      // Update calendar header
      calendarHeader.textContent = `${data.month_name} ${data.year}`;

      // Update calendar grid
      updateCalendarGrid(data.calendar_data);

      // Update URL without page reload
      const newUrl = `?month=${monthIndex + 1}&year=${year}#calendar`;
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
  }
}

function updateCalendarGrid(calendarData) {
  const calendarGrid = document.querySelector(".calendar-grid");

  // Keep the day headers
  const headers = Array.from(calendarGrid.children).slice(0, 7);
  calendarGrid.innerHTML = "";

  // Re-add the headers
  headers.forEach((header) => calendarGrid.appendChild(header));

  // Add the new calendar days
  calendarData.forEach((week) => {
    week.forEach((day) => {
      const dayDiv = document.createElement("div");
      dayDiv.className = `calendar-day${day.events.length ? " has-event" : ""}${
        day.is_today ? " today" : ""
      }${day.is_past ? " past" : ""}`;

      if (day.day !== 0) {
        let dayHtml = `<span class="day-number">${day.day}</span>`;

        if (day.events.length > 0) {
          dayHtml += `<div class="event-dots">`;
          day.events.slice(0, 3).forEach((event) => {
            dayHtml += `<div class="event-dot" title="${event.title}" data-event-id="${event.id}"></div>`;
          });
          if (day.events.length > 3) {
            dayHtml += `<div class="event-dot more" title="+${
              day.events.length - 3
            } more events"></div>`;
          }
          dayHtml += `</div>`;

          dayDiv.onclick = () => showDayEvents(dayDiv, day.day, day.events);
        }

        dayDiv.innerHTML = dayHtml;
      }

      calendarGrid.appendChild(dayDiv);
    });
  });
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

  // Close share menus when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".share-button") &&
      !e.target.closest(".share-menu")
    ) {
      closeAllShareMenus();
    }
  });
}

function toggleShareMenu(button) {
  const menu = button.nextElementSibling;
  const overlay = document.getElementById("shareOverlay");

  // Close any open share menus first
  closeAllShareMenus();

  // Toggle the clicked menu
  menu.classList.toggle("active");
  if (overlay) {
    overlay.classList.toggle("active");
  }
}

function closeAllShareMenus() {
  document.querySelectorAll(".share-menu.active").forEach((menu) => {
    menu.classList.remove("active");
  });
  const overlay = document.getElementById("shareOverlay");
  if (overlay) {
    overlay.classList.remove("active");
  }
}

function shareToWhatsApp(event, title, url) {
  event.preventDefault();

  // Ensure we have a valid URL by getting the current page URL if not provided
  const shareUrl = url || window.location.href;

  // Create the WhatsApp share text
  const shareText = encodeURIComponent(
    `Check out this event: ${title}\n${shareUrl}`
  );

  // Create the WhatsApp share URL
  const whatsappUrl = `https://wa.me/?text=${shareText}`;

  // Open in a new window
  window.open(whatsappUrl, "_blank");

  // Close the share menu after sharing
  closeAllShareMenus();
}
