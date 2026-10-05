// app.js
// Wires up the UI: reads user input, calls into scheduler.js, renders output.
// No business logic lives here on purpose — keep it all in scheduler.js.

import { getAvailableSlots, DEFAULT_BUSINESS_HOURS } from './scheduler.js';

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

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatDateInput(date) {
  return date.toISOString().split('T')[0];
}

function parseDateValue(dateValue) {
  return new Date(`${dateValue}T12:00:00`);
}

// Default to tomorrow, prevent selecting past dates.
const tomorrow = new Date(getToday());
tomorrow.setDate(tomorrow.getDate() + 1);
dateInput.value = formatDateInput(tomorrow);
dateInput.min = formatDateInput(getToday());

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function generateAllSlots(date) {
  const dayOfWeek = date.getDay();
  const hoursToday = DEFAULT_BUSINESS_HOURS[dayOfWeek];
  if (!hoursToday) return [];

  const dayStart = toMinutes(hoursToday.start);
  const dayEnd = toMinutes(hoursToday.end);
  const slots = [];

  for (let minutes = dayStart; minutes + 15 <= dayEnd; minutes += 15) {
    slots.push(toTime(minutes));
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

function renderSlots(date, availableSlots = []) {
  renderAllSlots(generateAllSlots(date), availableSlots);
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
    renderAllSlots([], []);
    return;
  }

  const date = parseDateValue(dateValue);

  // Don't allow booking for past dates.
  if (date < getToday()) {
    renderAllSlots([], []);
    return;
  }

  const duration = Number(durationSelect.value);
  const allSlots = generateAllSlots(date);
  let availableSlots = getAvailableSlots(date, existingBookings, duration, DEFAULT_BUSINESS_HOURS, closedDates);
  availableSlots = randomlyReduceSlots(availableSlots, date);

  renderAllSlots(allSlots, availableSlots);
}

showSlotsBtn.addEventListener('click', handleShowSlots);

bookNowBtn.addEventListener('click', () => {
  if (!selectedSlot) return;
  
  const dateParts = dateInput.value.split('-');
  const displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  
  bookingMessage.textContent = `Appointment booked for ${displayDate} at ${selectedSlot}!`;

  bookNowBtn.classList.add('hidden');
  showSlotsBtn.classList.add('hidden');
  slotsHeading.classList.add('hidden');
  bookingMessage.classList.remove('hidden');
  resultsEl.innerHTML = '';
});
