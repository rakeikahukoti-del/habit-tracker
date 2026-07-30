# Momentum Activity History

Momentum activity history is local-date based and uses each habit's schedule as
the denominator. It does not treat unscheduled days or future dates as missed
activity.

## Overall Day States

- `beforeTracking`: No habit had started yet for that date.
- `unscheduled`: Habits exist, but none were scheduled for that date.
- `scheduledIncomplete`: Scheduled habits existed and none were completed.
- `scheduledPartial`: Some, but not all, scheduled habits were completed.
- `scheduledComplete`: Every scheduled habit for the date was completed.
- `future`: The date is after today and is excluded from rates.

## Habit-Level Day States

- `beforeHabit`: The date is before the habit existed or before its first valid
  historic completion.
- `unscheduled`: The habit was not scheduled for that date.
- `incomplete`: The habit was scheduled but not completed.
- `complete`: The habit was scheduled and completed.
- `future`: The date is after today.

## Denominator Rules

Activity rates use scheduled opportunities, not raw completion counts. A habit
counts as scheduled only when:

- the date is on or after the habit start date;
- the date matches the habit frequency or custom days;
- the date is not in the future.

Duplicate completion dates are counted once. Invalid completion dates are
ignored.

## Perfect Days

A perfect day means every scheduled habit for that local calendar date was
completed. This follows the existing perfect-day semantics and does not change
XP, badge, or reward rules.

## Future and Before-Tracking Dates

Future dates are visible but never counted as incomplete. Dates before any habit
or imported completion history are marked `beforeTracking`.

## Year and Month Selection

The Progress screen defaults to the current year and current month. Historic
years are shown only when valid created-at or completion data exists. Future
years are not selectable.

## Monthly Summary

The monthly summary uses the visible month up to today when the month is still
in progress. It reports completed scheduled habits, total scheduled
opportunities, perfect days, active days, best perfect-day run, strongest habit,
and most improved habit when both current and previous month data are valid.

## Accessibility

Heatmap cells expose screen-reader labels with date, scheduled count, completed
count, percentage, and perfect-day state. The legend provides text labels so the
heatmap does not rely only on colour.

## Performance

Activity helpers are pure and deterministic. The Progress screen memoises yearly
days, month summaries, and selected-day lookups so the full-year grid is not
recalculated on unrelated renders.
