# Momentum Insights Dashboard

The Insights Dashboard turns existing offline habit history into deterministic, explainable analytics. It does not use AI, online services, accounts, or new storage.

## Dashboard Structure

The Analytics screen now includes an Insights Dashboard before the existing charts.

Sections can include:

- Overview
- Insight cards
- Weekly and monthly comparisons
- Habit rankings
- Personal bests
- Empty or building guidance

Existing Analytics charts, monthly review, habit performance, personal records, activity history, XP, ranks, achievements, notifications, import/export, routines, templates, and daily planning remain unchanged.

## Consistency Calculations

Consistency is schedule-aware:

- Only scheduled habit opportunities are counted.
- Future dates are ignored.
- Dates before a habit was created are ignored.
- Invalid, duplicate, or imported malformed completion dates are ignored.
- Local date keys are used to avoid UTC day drift.

The base formula is:

```text
consistency = completed scheduled opportunities / scheduled opportunities
```

The dashboard calculates:

- Overall consistency
- Current week
- Previous week
- Current month
- Previous month
- Last 30 days
- Last 90 days

## Trend Methodology

Trend comparisons use percentage-point differences.

Examples:

- Last 7 days vs previous 7 days
- Last 30 days vs previous 30 days
- This week to date vs the same length of last week
- This month to date vs the same length of last month

Rules:

- At least 3 scheduled opportunities are required in both periods.
- Changes smaller than 8 percentage points are treated as stable.
- Trends can be improving, stable, declining, or insufficient.
- The dashboard never invents improvement when there is not enough history.

## Habit Ranking Methodology

Habit strength is deterministic and explainable.

Inputs:

- Last 30-day completion rate
- Last 7-day completion rate
- Current streak
- Best streak
- Total valid completions

Habits need at least 5 scheduled opportunities in the last 30 days before they are considered rankable. This avoids misleading comparisons for very new habits.

Ranking ties are resolved by completion rate and then habit name, so ordering remains stable.

## Insight Cards

Insight cards are generated only from measurable history.

Examples:

- Weekly trend changes
- Most consistent weekday
- Strongest habit
- Improving habit
- Declining habit
- Monthly trend context
- Personal best highlights

Every statement is backed by a calculated metric. Cards avoid causation, shame, exaggeration, and fabricated motivation.

## Adaptive Ordering

The dashboard section order is deterministic:

- No habits: overview, empty state
- Habits but no completions: overview, consistency, weekly comparison, empty state
- Active history: overview, insight cards, weekly comparison, trends, habit rankings, personal bests

Sections only appear when enough data exists to make them useful.

## Accessibility

Dashboard cards expose readable labels for screen readers.

Accessibility rules:

- Trend state is described in text, not only color.
- Comparison cards include period, percentage, and summary.
- Ranking rows include habit name, completion rate, and rank.
- Cards use wrapping text and full-width responsive layouts.
- Empty and building states explain why data is limited.

## Performance Strategy

The dashboard uses a shared pure helper in `utils/insightsDashboard.js`.

It reuses `getAnalyticsAggregates()` from `utils/personalRecords.js` so day, week, month, lifetime, and record summaries are built from one shared context instead of duplicated across screens.

The Analytics screen memoizes dashboard output with `useMemo`, so calculations update when habit or gamification data changes after completion, undo, import, demo data, or reset.
