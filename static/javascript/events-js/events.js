// Hero Slider functionality
function initializeHeroSlider() {
    const slider = document.querySelector('.hero-slider');
    const dots = document.querySelectorAll('.slider-dot');
    let currentSlide = 0;
    const slideCount = dots.length;

    // Auto advance slides
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slideCount;
        updateSlider();
    }, 5000);

    // Click handlers for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateSlider();
        });
    });

    function updateSlider() {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }
}

function initializeScrollNavigation() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".events-nav a");

  // Add smooth scrolling to nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (link.getAttribute("href").startsWith("#")) {
        e.preventDefault();
        const targetId = this.getAttribute("href").slice(1);

        // Special handling for calendar on mobile
        if (window.innerWidth <= 768 && targetId === "calendar") {
          // Remove active class from all links
          navLinks.forEach((navLink) => navLink.classList.remove("active"));
          // Add active class only when calendar is shown
          this.classList.add("active");
          showMobileCalendar();
          return;
        }

        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  // Update active nav link on scroll
  function updateActiveNav() {
    // Don't update calendar nav on mobile
    if (window.innerWidth <= 768) {
      const scrollPosition = window.scrollY;
      const upcomingSection = document.getElementById("upcoming");
      const calendarLink = document.querySelector(
        '.events-nav a[href="#calendar"]'
      );
      const upcomingLink = document.querySelector(
        '.events-nav a[href="#upcoming"]'
      );

      // Only update the upcoming section highlight
      if (upcomingSection) {
        const sectionTop = upcomingSection.offsetTop - 100;
        const sectionHeight = upcomingSection.offsetHeight;

        if (
          scrollPosition >= sectionTop &&
          scrollPosition < sectionTop + sectionHeight
        ) {
          upcomingLink.classList.add("active");
          calendarLink.classList.remove("active");
        } else {
          upcomingLink.classList.remove("active");
        }
      }
    } else {
      // Original desktop behavior
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

  // Update navigation on window resize
  window.addEventListener("resize", updateActiveNav);

  // Initial call to updateActiveNav
  updateActiveNav();
}



function initializeNavScroll() {
  const nav = document.querySelector(".events-nav");
  const initialNavOffset = nav.offsetTop; // Get the initial position of the nav

  // Add a scroll event listener
  window.addEventListener("scroll", function () {
    // Check if the page has been scrolled beyond the initial nav position
    if (window.scrollY > initialNavOffset) {
      // If so, add a class to the nav to make it move down
      nav.classList.add("scrolled");
    } else {
      // Otherwise, remove the class to make it stay at the top
      nav.classList.remove("scrolled");
    }
  });
}

// JavaScript to handle scroll event
window.addEventListener('scroll', function() {
    const nav = document.querySelector('.events-nav');
    if (window.scrollY > 50) {  // Adjust this value as needed for the trigger point
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});





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
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
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
            calendarHeader.textContent = `${data.month_name} ${data.year}`;
            updateCalendarGrid(data.calendar_data);
            const newUrl = `${baseUrl}?month=${monthIndex + 1}&year=${year}`;
            window.history.pushState({ month: monthIndex + 1, year: year }, "", newUrl);
        } else {
            throw new Error(data.message || "Error updating calendar");
        }
    } catch (error) {
        console.error("Error fetching calendar data:", error);
        const errorMessage = document.createElement("div");
        errorMessage.className = "alert alert-error";
        errorMessage.textContent = "Failed to update calendar. Please try again.";
        const calendarContainer = document.querySelector(".calendar-container");
        calendarContainer.insertBefore(errorMessage, calendarContainer.firstChild);
    
        setTimeout(() => {
            errorMessage.remove();
        }, 3000);
    }
}

// Share functionality
function initializeShareFunctionality() {
    const shareButtons = document.querySelectorAll(".share-button");

    shareButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleShareMenu(button);
        });
    });

    document.addEventListener("click", (e) => {
        const shareMenuItem = e.target.closest(".share-menu-item");
        if (shareMenuItem) {
            e.preventDefault();
            handleShare(shareMenuItem);
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.share-button') && !e.target.closest('.share-menu')) {
            closeAllShareMenus();
        }
    });
}

function toggleShareMenu(button) {
    const eventCard = button.closest(".event-card");
    const title = eventCard.querySelector("h3").textContent;
    const venue = eventCard.querySelector(".event-meta span:first-child").textContent;
    const time = eventCard.querySelector(".event-meta span:last-child").textContent;
    const eventUrl = eventCard.querySelector(".btn-primary").href;

    const shareMenu = button.nextElementSibling;

    document.querySelectorAll(".share-menu.active").forEach((menu) => {
        if (menu !== shareMenu) {
            menu.classList.remove("active");
        }
    });

    shareMenu.innerHTML = generateShareMenuItems(title, venue, time, eventUrl);
    shareMenu.classList.toggle("active");
}

function generateShareMenuItems(title, venue, time, eventUrl) {
    const encodedText = encodeURIComponent(`${title}\n${venue}\n${time}\n\nDetails: ${eventUrl}`);
    
    return `
        <a href="#" class="share-menu-item" data-platform="copy" data-url="${eventUrl}">
            <i class="far fa-copy"></i> Copy Link
            <span class="copy-feedback">Copied!</span>
        </a>
        <a href="https://wa.me/?text=${encodedText}" class="share-menu-item" data-platform="whatsapp" target="_blank">
            <i class="fab fa-whatsapp"></i> WhatsApp
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
            const feedback = shareMenuItem.querySelector(".copy-feedback");
            feedback.classList.add("active");
            setTimeout(() => {
                feedback.classList.remove("active");
            }, 2000);
            setTimeout(() => {
                closeAllShareMenus();
            }, 1000);
        } catch (err) {
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

    if (navigator.share && platform === "whatsapp") {
        try {
            navigator.share({
                title: shareMenuItem.closest(".event-card").querySelector("h3").textContent,
                text: shareMenuItem.closest(".event-card").querySelector(".event-description p").textContent,
                url: window.location.href,
            });
        } catch (err) {
            window.open(href, "_blank");
        }
    } else {
        window.open(href, "_blank");
    }

    closeAllShareMenus();
}

function closeAllShareMenus() {
    document.querySelectorAll('.share-menu.active').forEach(menu => menu.classList.remove('active'));
}

// Mobile calendar functionality
function initializeCalendarSlide() {
    const calendarSection = document.getElementById("calendar");
  
    if (window.innerWidth <= 768 && !document.querySelector(".calendar-mobile-header")) {
        const mobileHeader = document.createElement("div");
        mobileHeader.className = "calendar-mobile-header";
        mobileHeader.innerHTML = `
            <h2>Calendar</h2>
            <button class="calendar-close-btn">&times;</button>
        `;
        calendarSection.insertBefore(mobileHeader, calendarSection.firstChild);
    }
  
    if (!document.querySelector(".calendar-overlay")) {
        const overlay = document.createElement("div");
        overlay.className = "calendar-overlay";
        document.body.appendChild(overlay);
    }
  
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
  document.body.style.overflow = "hidden";

  // Add active class to calendar link when opened on mobile
  const calendarLink = document.querySelector(
    '.events-nav a[href="#calendar"]'
  );
  if (calendarLink) {
    calendarLink.classList.add("active");
  }
}

function hideMobileCalendar() {
  const calendarSection = document.getElementById("calendar");
  const overlay = document.querySelector(".calendar-overlay");
  const calendarLink = document.querySelector(
    '.events-nav a[href="#calendar"]'
  );

  calendarSection.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = "";

  // Remove active class from calendar link when closing
  if (calendarLink) {
    calendarLink.classList.remove("active");
  }
}


// Day events modal functionality (continued)
function showDayEvents(dayElement, day, events) {
    const modal = document.getElementById("dayEventsModal");
    const eventsList = document.getElementById("dayEventsList");
    const selectedDate = document.getElementById("selectedDate");
    const currentMonth = document.querySelector(".calendar-header h2").textContent;

    if (!modal || !eventsList || !selectedDate) {
        console.error("Required modal elements not found");
        return;
    }

    selectedDate.textContent = `${currentMonth} ${day}`;
    eventsList.innerHTML = "";

    const eventsData = typeof events === "string" ? JSON.parse(events) : events;

    eventsData.sort((a, b) => {
        if (a.start_time && b.start_time) {
            return a.start_time.localeCompare(b.start_time);
        }
        return 0;
    });

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
            <a href="/events/${event.slug}/" class="btn btn-primary btn-sm">Book Tickets</a>
        `;

        eventsList.appendChild(eventItem);
    });

    modal.classList.add("active");
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    // Initialize hero slider
    initializeHeroSlider();
    
    // Initialize scroll tracking
    initializeScrollNavigation();
    //Initialize Navbar scrolling down
    initializeNavScroll();
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
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && modal) {
            modal.classList.remove("active");
        }
    });
    
    // Log initialization
    console.log("Events page initialized");
});