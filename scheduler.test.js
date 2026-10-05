import { describe, expect, it } from 'vitest';
import { DEFAULT_BUSINESS_HOURS, getAvailableSlots } from './scheduler.js';

const BASE_DATE = new Date(Date.UTC(2028, 6, 23, 12));
const dateFor = (dayOffset) => new Date(Date.UTC(2028, 6, 23 + dayOffset, 12));

describe('getAvailableSlots characterization tests', () => {
  it('follows the default weekday and weekend hours for the fixed future week', () => {
    const monday = getAvailableSlots(dateFor(1), [], 60, DEFAULT_BUSINESS_HOURS, []);
    expect(monday).toContain('09:00');
    expect(monday).toContain('16:00');
    expect(monday).not.toContain('12:00');

    const friday = getAvailableSlots(dateFor(5), [], 30, DEFAULT_BUSINESS_HOURS, []);
    expect(friday).toContain('09:00');
    expect(friday).toContain('15:30');
    expect(friday).not.toContain('16:15');

    const saturday = getAvailableSlots(dateFor(6), [], 60, DEFAULT_BUSINESS_HOURS, []);
    expect(saturday).toContain('10:00');
    expect(saturday).toContain('12:00');

    const sunday = getAvailableSlots(dateFor(0), [], 60, DEFAULT_BUSINESS_HOURS, []);
    expect(sunday).toEqual([]);
  });

  it('blocks lunch windows on weekdays and does not treat Saturday lunch as closed', () => {
    const mondayLunch = getAvailableSlots(dateFor(1), [], 60, DEFAULT_BUSINESS_HOURS, []);
    expect(mondayLunch).not.toContain('12:00');
    expect(mondayLunch).not.toContain('12:15');
    expect(mondayLunch).toContain('13:00');

    const saturdayLunch = getAvailableSlots(dateFor(6), [], 60, DEFAULT_BUSINESS_HOURS, []);
    expect(saturdayLunch).toContain('12:00');
    expect(saturdayLunch).not.toContain('12:15');
  });

  it('uses the 15-minute grid and rounds duration up to the nearest grid', () => {
    const monday = getAvailableSlots(dateFor(1), [], 50, DEFAULT_BUSINESS_HOURS, []);
    expect(monday).toContain('09:00');
    expect(monday).toContain('09:45');
    expect(monday).not.toContain('09:50');
    expect(monday).not.toContain('16:50');
  });

  it('applies buffer time after existing bookings without creating a gap before them', () => {
    const shortBooking = getAvailableSlots(
      dateFor(1),
      [{ start: '09:00', end: '09:30' }],
      30,
      DEFAULT_BUSINESS_HOURS,
      [],
    );
    expect(shortBooking).not.toContain('09:30');
    expect(shortBooking).toContain('09:45');

    const longBooking = getAvailableSlots(
      dateFor(1),
      [{ start: '09:00', end: '09:45' }],
      60,
      DEFAULT_BUSINESS_HOURS,
      [],
    );
    expect(longBooking).not.toContain('09:45');
    expect(longBooking).toContain('10:00');
  });

  it('honors closed dates and empty or undefined defaults', () => {
    const closedDate = getAvailableSlots(dateFor(1), [], 60, DEFAULT_BUSINESS_HOURS, ['2028-07-24']);
    expect(closedDate).toEqual([]);

    const sundayDefaultClosed = getAvailableSlots(dateFor(0), [], 60, undefined, undefined);
    expect(sundayDefaultClosed).toEqual([]);
  });

  it('uses a business-hours override as a full replacement, with missing days closed', () => {
    const override = {
      0: null,
      1: { start: '08:00', end: '12:00' },
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
    };

    const monday = getAvailableSlots(dateFor(1), [], 30, override, []);
    expect(monday).toContain('08:00');
    expect(monday).toContain('11:30');
    expect(monday).not.toContain('12:00');

    const tuesday = getAvailableSlots(dateFor(2), [], 30, override, []);
    expect(tuesday).toEqual([]);
  });

  it('blocks Friday slots that cross lunch and keeps the rest of Friday after lunch available', () => {
    const friday = dateFor(5);
    const slots = getAvailableSlots(friday, [{ start: '11:30', end: '12:45' }], 30, DEFAULT_BUSINESS_HOURS, []);

    expect(slots).not.toContain('11:30');
    expect(slots).not.toContain('11:45');
    expect(slots).toContain('13:00');
    expect(slots).toContain('15:30');
  });

  it('handles duration exceeding the business-day window and respects the day-end boundary', () => {
    const tooLong = getAvailableSlots(dateFor(1), [], 500, DEFAULT_BUSINESS_HOURS, []);
    expect(tooLong).toEqual([]);

    const dayEnd = getAvailableSlots(dateFor(1), [], 60, DEFAULT_BUSINESS_HOURS, []);
    expect(dayEnd).toContain('16:00');
    expect(dayEnd).not.toContain('16:15');
  });

  it('uses a Sunday week anchor that stays in the future and avoids today-time filtering', () => {
    const weekStart = new Date(Date.UTC(2028, 6, 23, 12));
    expect(weekStart.getDay()).toBe(0);
    const monday = getAvailableSlots(dateFor(1), [], 60, DEFAULT_BUSINESS_HOURS, []);
    expect(monday.length).toBeGreaterThan(0);
  });
});
