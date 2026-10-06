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

### Prompt history and tasks

These are the prompts and requirements given during the project, along with the corresponding work that was completed:

- "fill in the ignore file with standard ignore files" — added a standard Node/Vite ignore file covering dependencies, build output, logs, environment files, and editor metadata.
- "populate the README.md file with how the characterization test works" — wrote a README section explaining what characterization tests capture, how the fixed-date week works, and what behaviors the scheduler test suite validates.
- "do whats on `prompt.md`" — implemented the requested Vitest characterization test suite for `getAvailableSlots`, using a fixed future week and covering business hours, lunch blocking, rounding, buffers, closed dates, overrides, and edge cases.
- "run `scheduler.test.js` every time `scheduler.js` is changed" — added a change-watcher script and npm script so the test file re-runs whenever the scheduler logic changes.
- "refactor the code in `scheduler.js`" — cleaned up the scheduler implementation while preserving the real behavior that the characterization tests describe.
- "do so please" — refactored the UI layer in `app.js` to align with the cleaned scheduler logic and removed inconsistencies in the slot rendering flow.
- "Add a discount code option. When the user inputs `SMILE15` apply a 15% discount. Create tests using Vitest to verify it works." — added a checkout discount field, implemented a 15% discount for `SMILE15`, and created pricing tests covering valid, invalid, and case-insensitive discount codes.
- "revamp the discount part so that its only done to the total and the new total amount is rounded up to 2 decimal places." — updated the pricing logic so the discount is applied only to the final total, and the discounted total is rounded to two decimal places before display.

This section documents the flow of requests that shaped the project and keeps the working assumptions explicit for future maintainers.
