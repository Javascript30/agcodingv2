Write a characterization test for getAvailableSlots in scheduler.js using Vitest. 

Use a fixed future week (e.g., week starting 2028-07-25 Sunday) for all test dates so that "time already passed today" logic never fires. 

Cover:
– Day-by-day opening hours (Mon–Thu 9–5, Fri early 4pm, Sat 10–1, Sun closed)
– Lunch block (12–1, Mon–Fri only)
– 15-minute grid and duration rounding
– Buffer: ≤30 min → 5 min after existing bookings; >30 min → 10 min; no gap before bookings
– Closed dates (including undefined defaults)
– Business hours override (replaces defaults entirely; missing days = closed)
– Friday booking across lunch
– Edge cases: duration exceeds window, day-end boundary, Saturday lunch area not blocked.
If any tests fail, fix them to match the real behavior, not the assumptions.
