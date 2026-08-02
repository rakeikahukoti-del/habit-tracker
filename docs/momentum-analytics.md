# Momentum Analytics

Momentum analytics are deterministic and derived from local habit data. No
personal records, lifetime stats, or milestones are stored separately.

## Calculation Flow

The Analytics route loads habits and gamification once when the screen gains
focus. Derived views are then calculated with the existing analytics helpers:

- `utils/habitStats.js` provides period metrics, trend points, and habit
  performance.
- `utils/insightsDashboard.js` provides consistency summaries, comparisons,
  habit rankings, and deterministic insight cards.
- `utils/personalRecords.js` provides monthly reviews and personal records.
- `utils/analyticsReadiness.js` decides whether to show an empty, building, or
  ready state.

Analytics are not written back to storage. Editing habit history changes the
source data, so every dependent view recalculates from the same completion
records.

## Presentation Responsibilities

`app/analytics.js` owns hierarchy, filters, loading states, and navigation.
`components/analytics/AnalyticsScreen.js` owns the shared safe-area and
responsive screen scaffold. `utils/analyticsPresentation.js` formats
screen-reader summaries without changing numeric results.

The trend chart receives already-calculated points. It only renders those
values and exposes a text summary with the range, latest value, and recent
points for screen readers.

## Habit Rankings

Rankings use the existing deterministic score from
`utils/insightsDashboard.js`. The score combines recent completion rates,
completion count, and streak history. Habits without enough scheduled
opportunities remain visible but are not treated as meaningful leaders.

Ties resolve by completion rate and then habit name, so the order is stable
across renders. "Strongest" and "Needs attention" are different views of the
same ranked data, not separate calculations.

## Insight Generation

Insight cards are selected from real weekly and monthly comparisons, weekday
consistency, habit rankings, and personal records. They do not use generated
or estimated values. Sparse histories use readiness copy instead of fabricated
trends.

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

These helpers are intentionally UI-agnostic and are reused by the Year in Review
without changing storage.

## Habit Milestones

Habit milestones are informational only:

- 10 completions
- 25 completions
- 50 completions
- 100 completions
- 250 completions
- 365 completions

They do not award XP, unlock badges, or change rank. Achievement progression
remains independently defined in `utils/gamification.js`.

## Empty States

Brand-new users should see plain copy explaining that records and trends appear
after real completions. Momentum should not show fake charts or placeholder
records.

## Accessibility

Record cards include complete accessibility labels with the record name, value,
description, and achieved date when available. Values are text-based and do not
depend on colour alone. Metric cards announce their labels and values, habit
performance rows include completion and streak context, and chart summaries
provide a text equivalent for visual bars.
