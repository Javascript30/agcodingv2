// app.js
// Wires up the UI: reads user input, calls into scheduler.js, renders output.
// No business logic lives here on purpose — keep it all in scheduler.js.

import { getAvailableSlots, DEFAULT_BUSINESS_HOURS } from './scheduler.js';
import { calculateCheckoutTotal } from './pricing.js';

// Hardcoded "existing bookings" standing in for a real calendar/backend.
const existingBookings = [
  { start: '09:00', end: '09:30' },
  { start: '11:00', end: '11:45' },
  { start: '14:00', end: '15:00' },
];

// Hardcoded closure dates — in a real app these would come from a backend.
const closedDates = [
  '2026-12-25', // Christmas
  '2026-08-15', // One-off day off
  '2027-01-01', // New Year's Day
];
 
const dateInput = document.getElementById('date-input');
const durationSelect = document.getElementById('duration-select');
const showSlotsBtn = document.getElementById('show-slots-btn');
const resultsEl = document.getElementById('results');
const slotsHeading = document.querySelector('h2');
const bookNowBtn = document.getElementById('book-now-btn');
const bookingMessage = document.getElementById('booking-message');

let selectedSlot = null;

// Default to tomorrow, prevent selecting past dates.
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
dateInput.value = tomorrow.toISOString().split('T')[0];
dateInput.min = today.toISOString().split('T')[0];

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function generateAllSlots(date) {
  const dayOfWeek = date.getDay();
  const hoursToday = DEFAULT_BUSINESS_HOURS[dayOfWeek];
  if (!hoursToday) return [];
  const dayStart = toMinutes(hoursToday.start);
  const dayEnd = toMinutes(hoursToday.end);
  const slots = [];
  for (let m = dayStart; m + 15 <= dayEnd; m += 15) {
    slots.push(toTime(m));
  }
  return slots;
}

function renderAllSlots(allSlots, availableSlots) {
  resultsEl.innerHTML = '';
  selectedSlot = null;
  bookNowBtn.classList.add('hidden');
  bookingMessage.classList.add('hidden');

  if (allSlots.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No slots for this day.';
    li.className = 'empty';
    resultsEl.appendChild(li);
    return;
  }

  allSlots.forEach((slot) => {
    const li = document.createElement('li');
    li.textContent = slot;
    const isAvailable = availableSlots.includes(slot);

    if (isAvailable) {
      li.addEventListener('click', () => {
        document.querySelectorAll('#results li').forEach((el) => el.classList.remove('selected'));
        li.classList.add('selected');
        selectedSlot = slot;
        bookNowBtn.classList.remove('hidden');
        bookingMessage.classList.add('hidden');
      });
    } else {
      li.classList.add('unavailable');
    }
    resultsEl.appendChild(li);
  });
}

// Randomly remove some available slots on Mon–Thu to introduce variety.
// The scheduler itself is deterministic; this is a UI-level randomization.
// Removes roughly 20–40% of available slots (at least 1 if any exist).
function randomlyReduceSlots(slots, date) {
  const day = date.getDay();
  // Only apply on Mon–Thu (days 1–4).
  if (day < 1 || day > 4 || slots.length === 0) {
    return slots;
  }

  const removeCount = Math.max(1, Math.floor(slots.length * (0.2 + Math.random() * 0.2)));
  const indicesToRemove = new Set();
  while (indicesToRemove.size < removeCount && indicesToRemove.size < slots.length) {
    indicesToRemove.add(Math.floor(Math.random() * slots.length));
  }

  return slots.filter((_, i) => !indicesToRemove.has(i));
}

function handleShowSlots() {
  showSlotsBtn.classList.remove('hidden');
  slotsHeading.classList.remove('hidden');

  const dateValue = dateInput.value;
  if (!dateValue) {
    renderSlots([]);
    return;
  }

  // new Date('YYYY-MM-DD') parses as UTC midnight — fine for this demo,
  // just worth knowing if slots look "off by a day" in some timezones.
  const date = new Date(dateValue);

  // Don't allow booking for past dates.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    renderSlots([]);
    return;
  }

  const duration = Number(durationSelect.value);

  const allSlots = generateAllSlots(date);
  let availableSlots = getAvailableSlots(date, existingBookings, duration, DEFAULT_BUSINESS_HOURS, closedDates);
  availableSlots = randomlyReduceSlots(availableSlots, date);
  renderAllSlots(allSlots, availableSlots);
}

showSlotsBtn.addEventListener('click', handleShowSlots);

// ---------- Pricing ----------

// ---------- Checkout ----------

const checkoutEl = document.getElementById('checkout');
const checkoutDateEl = document.getElementById('checkout-date');
const checkoutTimeEl = document.getElementById('checkout-time');
const checkoutDurationLabel = document.getElementById('checkout-duration-label');
const basePriceEl = document.getElementById('base-price');
const totalPriceEl = document.getElementById('total-price');
const discountCodeEl = document.getElementById('discount-code');
const discountValueEl = document.getElementById('discount-value');
const confirmBtn = document.getElementById('confirm-btn');
const backBtn = document.getElementById('back-btn');
const addonCheckboxes = document.querySelectorAll('.addon-checkbox');

function formatPrice(amount) {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

function updateTotal() {
  const duration = Number(durationSelect.value);
  const addonPrices = Array.from(addonCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => Number(cb.dataset.price));
  const enteredCode = discountCodeEl ? discountCodeEl.value : '';

  const { base, subtotal, discount, total } = calculateCheckoutTotal(duration, addonPrices, enteredCode);

  basePriceEl.textContent = formatPrice(base);
  totalPriceEl.textContent = formatPrice(total);

  if (discount > 0) {
    discountValueEl.textContent = `-${formatPrice(discount)}`;
  } else {
    discountValueEl.textContent = '-$0.00';
  }

  if (subtotal <= base) {
    discountValueEl.textContent = '-$0.00';
  }
}

function showCheckout() {
  const dateParts = dateInput.value.split('-');
  const displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  const duration = Number(durationSelect.value);
  const durationLabel = durationSelect.options[durationSelect.selectedIndex].text;

  checkoutDateEl.textContent = displayDate;
  checkoutTimeEl.textContent = selectedSlot;
  checkoutDurationLabel.textContent = durationLabel;

  // Reset add-ons and discount
  addonCheckboxes.forEach((cb) => (cb.checked = false));
  if (discountCodeEl) discountCodeEl.value = '';
  if (discountValueEl) discountValueEl.textContent = '-$0.00';

  updateTotal();

  // Hide booking UI, show checkout
  showSlotsBtn.classList.add('hidden');
  slotsHeading.classList.add('hidden');
  resultsEl.innerHTML = '';
  bookNowBtn.classList.add('hidden');
  bookingMessage.classList.add('hidden');
  checkoutEl.classList.remove('hidden');
}

function hideCheckout() {
  checkoutEl.classList.add('hidden');
  showSlotsBtn.classList.remove('hidden');
  slotsHeading.classList.remove('hidden');
  // Re-render the slots so the user can pick again
  handleShowSlots();
}

bookNowBtn.addEventListener('click', () => {
  if (!selectedSlot) return;
  showCheckout();
});

addonCheckboxes.forEach((cb) => {
  cb.addEventListener('change', updateTotal);
});

if (discountCodeEl) {
  discountCodeEl.addEventListener('input', updateTotal);
}

confirmBtn.addEventListener('click', () => {
  const dateParts = dateInput.value.split('-');
  const displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  const total = totalPriceEl.textContent;

  bookingMessage.textContent = `Appointment booked for ${displayDate} at ${selectedSlot}! Total: ${total}`;
  checkoutEl.classList.add('hidden');
  bookingMessage.classList.remove('hidden');
});

backBtn.addEventListener('click', hideCheckout);
