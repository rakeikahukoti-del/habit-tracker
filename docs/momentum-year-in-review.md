# Momentum Year in Review

Momentum Year in Review is an offline, deterministic annual summary built from
data that already exists on the device.

It does not infer, estimate, or fabricate missing history.

## Data Sources

The review uses:

- `habits.completedDates` for completion history
- habit schedule fields for scheduled opportunities
- existing activity history helpers for monthly summaries
- existing streak helpers for current and best streaks
- gamification state for current XP, level, rank, and recent achievements

Year in Review requires no separate storage key.

## Architecture

Core calculation lives in:

- `utils/yearInReview.js`

Presentation lives in:

- `app/year-review.js`

The Progress screen links to the review:

- `app/stats.js`

The route is registered in:

- `app/_layout.js`

The utility is pure and accepts habits, gamification state, a selected year, and
an optional `now` value for deterministic testing.

## Statistics

The annual summary can report:

- total completions
- active days
- longest streak
- current streak
- best month
- most consistent month
- strongest habit
- most completed habit
- XP earned from visible yearly completions and perfect days
- current level and rank
- achievement count for the selected year

Metrics are only shown when supported by stored data.

## Monthly Breakdown

The monthly breakdown reuses `getMonthActivitySummary`.

Each month includes:

- completion rate
- total completions
- best streak
- active days
- perfect days
- derived habit XP

For the current year, future months are hidden.

## Milestones

Milestones are generated only when supported by data:

- first completion in the selected year
- 100 completions in the selected year
- longest streak reached
- highest XP month
- best completion month
- most completed habit
- first achievement unlocked in the selected year

Milestones with dates are sorted chronologically. Undated summary milestones are
shown after dated events.

## Reflection Cards

Reflection cards are deterministic statements based on calculated metrics.

Examples:

- `You recorded 120 habit completions in 2026.`
- `You completed habits on 78 different days.`
- `Your longest streak reached 14 days.`

If there is no supporting data, the reflection is omitted.

## Empty State

If no completions exist for the selected year, the screen shows a simple empty
state explaining that the review will appear after completed habits are saved.

## Future Expansion

Possible future additions:

- image export for the summary card
- comparison against previous years
- richer rank-promotion timeline if historical rank events are persisted
- routine-specific annual metrics when routine completion history is available
- deeper personal-record attribution with exact achieved dates
