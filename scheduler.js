// scheduler.js
// Core slot-calculation logic for the booking widget.

const SLOT_GRID_MINUTES = 15;

// Default business hours, keyed by day-of-week (0 = Sunday ... 6 = Saturday).
const DEFAULT_BUSINESS_HOURS = {
  0: null, // closed Sunday
  1: { start: '09:00', end: '17:00' },
  2: { start: '09:00', end: '17:00' },
  3: { start: '09:00', end: '17:00' },
  4: { start: '09:00', end: '17:00' },
  5: { start: '09:00', end: '16:00' }, // early finish Friday
  6: { start: '10:00', end: '13:00' }, // Saturday morning only
};

// Lunch break — only applied Mon-Fri.
const LUNCH_BREAK = { start: '12:00', end: '13:00' };

function getBufferMinutes(durationMinutes) {
  return durationMinutes > 30 ? 10 : 5;
}

function timeStringToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeString(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function roundDurationToGrid(durationMinutes) {
  return Math.ceil(durationMinutes / SLOT_GRID_MINUTES) * SLOT_GRID_MINUTES;
}

function overlapsExistingBooking(candidateStart, candidateEnd, existingBookings, bufferMinutes) {
  for (const booking of existingBookings || []) {
    const bookingStart = timeStringToMinutes(booking.start);
    const bookingEnd = timeStringToMinutes(booking.end) + bufferMinutes;

    if (candidateStart < bookingEnd && candidateEnd > bookingStart) {
      return true;
    }
  }

  return false;
}

function isDuringLunch(candidateStart, candidateEnd, dayOfWeek) {
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  const lunchStart = timeStringToMinutes(LUNCH_BREAK.start);
  const lunchEnd = timeStringToMinutes(LUNCH_BREAK.end);
  return candidateStart < lunchEnd && candidateEnd > lunchStart;
}

function isDateClosed(dateStr, closedDates = []) {
  return closedDates.includes(dateStr);
}

function getBusinessHours(date, businessHours) {
  const hoursConfig = businessHours ?? DEFAULT_BUSINESS_HOURS;
  const dayOfWeek = date.getDay();
  return hoursConfig[dayOfWeek] ?? null;
}

function hasTimeAlreadyPassed(candidateStartMinutes, date) {
  const now = new Date();
  const isToday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (!isToday) {
    return false;
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return candidateStartMinutes <= nowMinutes;
}

function getDateKey(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate available appointment slots for a given date.
 *
 * @param {Date} date - the date to check
 * @param {Array<{start: string, end: string}>} existingBookings - bookings
 *        already on the calendar for that date, times as "HH:MM" 24hr strings
 * @param {number} serviceDurationMinutes - length of the service being booked
 * @param {Object} [businessHours] - optional override of business hours config
 * @param {Array<string>} [closedDates] - optional array of "YYYY-MM-DD" date
 *        strings representing days the business is fully closed (holidays,
 *        one-off closures, etc.)
 * @returns {Array<string>} list of available start times as "HH:MM" strings
 */
function getAvailableSlots(date, existingBookings, serviceDurationMinutes, businessHours, closedDates) {
  const normalizedClosedDates = closedDates || [];
  const dateStr = getDateKey(date);

  if (isDateClosed(dateStr, normalizedClosedDates)) {
    return [];
  }

  const hoursToday = getBusinessHours(date, businessHours);
  if (!hoursToday) {
    return [];
  }

  const dayStart = timeStringToMinutes(hoursToday.start);
  const dayEnd = timeStringToMinutes(hoursToday.end);
  const dayOfWeek = date.getDay();
  const duration = roundDurationToGrid(serviceDurationMinutes);
  const bufferMinutes = getBufferMinutes(serviceDurationMinutes);
  const availableSlots = [];

  for (let candidateStart = dayStart; candidateStart + duration <= dayEnd; candidateStart += SLOT_GRID_MINUTES) {
    const candidateEnd = candidateStart + duration;

    if (hasTimeAlreadyPassed(candidateStart, date)) {
      continue;
    }

    if (isDuringLunch(candidateStart, candidateEnd, dayOfWeek)) {
      continue;
    }

    if (overlapsExistingBooking(candidateStart, candidateEnd, existingBookings, bufferMinutes)) {
      continue;
    }

    availableSlots.push(minutesToTimeString(candidateStart));
  }

  return availableSlots;
}

export { getAvailableSlots, DEFAULT_BUSINESS_HOURS };
