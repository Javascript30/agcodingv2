# Characterization Test for the Booking Scheduler

This project is a small booking-scheduler exercise built around `scheduler.js`. The main goal is to document the real behavior of `getAvailableSlots` with a set of characterization tests instead of guessing at the intended behavior.

## What a characterization test does

A characterization test captures the behavior that exists today, even when the rules are subtle or surprising. It is especially useful in legacy or unclear code where the project needs a "behavior baseline" before making changes.

In this repository, the scheduler logic decides which appointment start times are available for a given date, accounting for:

- business hours by weekday
- lunch breaks on weekdays
- 15-minute time slots
- duration rounding up to the nearest grid
- buffer time after existing bookings
- date closures
- business-hours overrides
- edge cases around lunch, closed days, and day-end limits

## How the tests are structured

The test suite uses a fixed future week so that "time already passed today" logic never fires. A common pattern is to fix the week to start on Sunday, 2028-07-25, and then assert slot availability for specific dates within that range.

This keeps the results deterministic and avoids false negatives from the runtime clock.

The tests exercise these behaviors:

1. Business hours by day of the week
   - Monday through Thursday: 09:00–17:00
   - Friday: 09:00–16:00
   - Saturday: 10:00–13:00
   - Sunday: closed

2. Lunch break behavior
   - Monday through Friday only
   - Lunch runs from 12:00 to 13:00
   - Slots that overlap lunch are excluded

3. 15-minute grid and duration rounding
   - Start times only appear on 15-minute boundaries
   - Service durations are rounded upward to the nearest 15-minute increment

4. Booking buffers
   - Short bookings use a 5-minute buffer after an existing booking
   - Longer bookings use a 10-minute buffer
   - The logic checks for overlap with the buffer and will not create gaps before existing bookings

5. Closed dates and defaults
   - Specific dates can be marked closed
   - Undefined business-hours defaults behave as fully closed days

6. Business-hours override behavior
   - A custom business-hours object replaces the default schedule entirely
   - Missing days in the override are treated as closed

7. Friday lunch edge case
   - A booking can cross the lunch period on Friday when the logic allows it

8. Weekend and boundary edge cases
   - Saturday lunch is not treated as a blocked lunch period
   - Duration exceeding the available window is handled correctly
   - Day-end boundaries are respected

## Why this matters

The point of the test is not to enforce assumptions about what the scheduler should do in an ideal world. Instead, it records what the implementation really does today. If a new test fails, the fix should match the real behavior of the code unless the business requirement explicitly changes.

This makes the suite a reliable safety net while preserving the actual operational rules already in place.

## Running the project

Install dependencies and run the project as usual with your JavaScript tooling:

```bash
npm install
npm run start
```

If this project is extended with Vitest, the characterization tests should be written around a fixed future date range and should assert the current service behavior rather than an assumed ideal version.
