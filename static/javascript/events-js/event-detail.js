document.addEventListener("DOMContentLoaded", function () {
  const ticketInputs = document.querySelectorAll(".ticket-quantity");
  const orderSummary = document.getElementById("orderSummary");
  const ticketDetails = document.getElementById("ticketDetails");
  const totalAmount = document.getElementById("totalAmount");
  const submitBtn = document.getElementById("submitBtn");

  // Add event listeners to ticket quantity inputs
  ticketInputs.forEach((input) => {
    input.addEventListener("input", updateOrderSummary);
    input.addEventListener("change", updateOrderSummary);

    // Add increment/decrement buttons
    const wrapper = document.createElement("div");
    wrapper.className = "quantity-wrapper";

    const decBtn = document.createElement("button");
    decBtn.type = "button";
    decBtn.className = "quantity-btn";
    decBtn.textContent = "-";
    decBtn.onclick = () => updateQuantity(input, -1);

    const incBtn = document.createElement("button");
    incBtn.type = "button";
    incBtn.className = "quantity-btn";
    incBtn.textContent = "+";
    incBtn.onclick = () => updateQuantity(input, 1);

    input.parentNode.replaceChild(wrapper, input);
    wrapper.appendChild(decBtn);
    wrapper.appendChild(input);
    wrapper.appendChild(incBtn);
  });

  function updateQuantity(input, change) {
    const currentValue = parseInt(input.value) || 0;
    const maxValue = parseInt(input.getAttribute("max"));
    const newValue = Math.max(0, Math.min(currentValue + change, maxValue));
    input.value = newValue;
    updateOrderSummary();
  }

  function updateOrderSummary() {
    let total = 0;
    let hasTickets = false;
    let summaryHtml = "";

    ticketInputs.forEach((input) => {
      const quantity = parseInt(input.value) || 0;
      if (quantity > 0) {
        hasTickets = true;
        const ticketCard = input.closest(".ticket-type-card");
        const ticketName = ticketCard.querySelector("h3").textContent;
        const priceText = ticketCard.querySelector(".ticket-price").textContent;
        const price = parseFloat(priceText.replace("KES ", ""));
        const subtotal = quantity * price;

        summaryHtml += `
                    <div class="ticket-summary-line">
                        <span>${quantity}x ${ticketName}</span>
                        <span>KES ${subtotal.toFixed(2)}</span>
                    </div>
                `;
        total += subtotal;
      }
    });

    if (hasTickets) {
      orderSummary.style.display = "block";
      ticketDetails.innerHTML = summaryHtml;
      totalAmount.textContent = total.toFixed(2);
      submitBtn.disabled = false;
    } else {
      orderSummary.style.display = "none";
      submitBtn.disabled = true;
    }
  }

  // Form submission handling with AJAX
  document.querySelector("form").addEventListener("submit", async function (e) {
    e.preventDefault();
    submitBtn.disabled = true;

    try {
      const response = await fetch(EVENT_DATA.processBookingUrl, {
        method: "POST",
        body: new FormData(this),
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRFToken": EVENT_DATA.csrfToken,
        },
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error(data.message || "An error occurred");
      }
    } catch (error) {
      alert(error.message);
      submitBtn.disabled = false;
    }
  });
});
