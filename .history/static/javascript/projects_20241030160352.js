document.addEventListener("DOMContentLoaded", () => {
  // Add at the beginning of your file
  const csrftoken = document.querySelector("[name=csrfmiddlewaretoken]").value;

  // View toggle functionality
  const gallery = document.querySelector(".gallery");
  const viewToggles = document.querySelectorAll(".toggle-btn");

  viewToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      viewToggles.forEach((t) => t.classList.remove("active"));
      toggle.classList.add("active");
      gallery.className = `gallery ${toggle.dataset.view}-view`;
    });
  });

  // Filter functionality
  const filterBtns = document.querySelectorAll(".filter-btn");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      // Update URL with filter parameter
      const url = new URL(window.location);
      url.searchParams.set("category", filter);
      window.history.pushState({}, "", url);

      // Fetch filtered results
      fetch(url, {
        headers: {
          "X-CSRFToken": csrftoken,
          "X-Requested-With": "XMLHttpRequest",
        },
      })
        .then((response) => response.text())
        .then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          gallery.innerHTML = doc.querySelector(".gallery").innerHTML;
        });

      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
});
