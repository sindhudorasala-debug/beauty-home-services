const form = document.getElementById("bookingForm");
const message = document.getElementById("formMessage");
const list = document.getElementById("bookingList");
const dateInput = document.getElementById("bookingDate");
dateInput.min = new Date().toISOString().slice(0, 10);

document.querySelectorAll(".choose").forEach(button => {
  button.addEventListener("click", () => {
    document.getElementById("service").value = button.dataset.service;
    document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
  });
});

async function loadBookings() {
  try {
    const response = await fetch("/api/bookings");
    if (!response.ok) throw new Error("Could not load");
    const bookings = await response.json();
    if (!bookings.length) {
      list.innerHTML = '<p class="empty">No booking requests yet. Your first booking will appear here.</p>';
      return;
    }
    list.innerHTML = bookings.map(item => `
      <article class="booking-item">
        <div><strong>${escapeHtml(item.service)} · ${escapeHtml(item.customerName)}</strong>
        <small>${escapeHtml(item.bookingDate)} · ${escapeHtml(item.phone)}</small></div>
        <span class="status">${escapeHtml(item.status)}</span>
      </article>`).join("");
  } catch {
    list.innerHTML = '<p class="empty">Unable to load requests. Please refresh the page.</p>';
  }
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  message.className = "form-message";
  message.textContent = "Submitting your request…";
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Booking failed.");
    message.textContent = result.message;
    form.reset();
    dateInput.min = new Date().toISOString().slice(0, 10);
    await loadBookings();
  } catch (error) {
    message.className = "form-message error";
    message.textContent = error.message || "Something went wrong.";
  }
});
loadBookings();