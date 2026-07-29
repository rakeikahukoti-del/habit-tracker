# Momentum Analytics

Momentum analytics are deterministic and derived from local habit data. No
personal records, lifetime stats, or milestones are stored separately.

## Personal Records

`utils/personalRecords.js` calculates records from existing habits:

- Longest overall streak
- Best completion day
- Best perfect-day run
- Best weekly completion rate
- Best monthly completion rate
- Most completed habit
- Longest-running habit
- Best XP day
- Best XP week
- Lifetime completions

Rules:

- Invalid date keys are ignored.
- Duplicate completion dates count once per habit.
- Future completion dates are ignored.
- Ties resolve deterministically by earliest period/date, then habit name where
  needed.
- Deleted habits are not included because only the current local habit list is
  available.
- XP records are derived with the existing reward values: 10 XP per completion
  and 25 XP for a scheduled perfect day.

## Lifetime Statistics

Lifetime stats include:

- Total completions
- Total perfect days
- Total scheduled opportunities
- Overall completion rate
- Total XP earned
- Days using Momentum
- Average completions per active day
- Average weekly completion
- Streak days logged

Completion rate uses scheduled opportunities only. Lifetime completion count uses
valid unique completion dates because those are the user's actual logged habit
history.

## Monthly and Yearly Helpers

The same helper can aggregate:

- Monthly totals
- Quarterly totals
- Year totals

These helpers are intentionally UI-agnostic so future yearly summaries can reuse
the same data without changing storage.

## Habit Milestones

Habit milestones are informational only:

- 10 completions
- 25 completions
- 50 completions
- 100 completions
- 250 completions
- 365 completions

They do not award XP, unlock badges, or change rank. Future achievement work can
reuse the same milestone progress if needed.

## Empty States

Brand-new users should see plain copy explaining that records and trends appear
after real completions. Momentum should not show fake charts or placeholder
records.

## Accessibility

Record cards include complete accessibility labels with the record name, value,
description, and achieved date when available. Values are text-based and do not
depend on colour alone.
