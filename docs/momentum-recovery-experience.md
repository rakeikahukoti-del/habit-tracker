# Momentum Recovery Experience

Momentum supports returning users with factual, low-pressure guidance. Recovery states must not change streak calculations, XP, ranks, achievements, notifications, or habit schedules.

## Return-State Rules

Return guidance is derived from existing habit data:

- valid completion dates
- habit schedules
- habit creation dates
- today's local date
- the one-day dismissal preference

The helper lives in:

- `/Users/rakeipaul/Documents/Codex/2026-05-31/build-a-fully-functional-mobile-habit/utils/returnExperience.js`

It returns:

- return state
- inactive calendar days
- missed scheduled opportunities
- actionable habits today
- next scheduled opportunity
- concise message key and message

No derived recovery history is stored.

## Scheduled vs Unscheduled Inactivity

Only scheduled opportunities after the most recent valid completion and before today count as missed scheduled opportunities.

Unscheduled calendar days are not treated as missed habits. Future scheduled opportunities are not counted as missed.

## Home Guidance

Home may show a small dismissible return card when a return message is useful. It should:

- acknowledge that the user is back
- stay below the primary Home progress area
- focus on today's available habits or the next scheduled day
- avoid blocking interaction
- disappear after dismissal or habit completion

Dismissal key:

- `momentum:return-guidance-dismissed-date`

The value is today's date key. This prevents repeated messages for the same day while allowing future return guidance if useful.

## Streak Wording

Current streaks remain factual. A reset current streak should not be framed as failure.

Preferred wording:

- Current streak: 0
- Best streak: 12 days
- Complete the next scheduled day to begin a new current streak
- Your best streak remains recorded

Do not use:

- failed
- lost progress
- ruined
- start over
- fell behind

## Habit Detail Context

Habit Detail shows compact recovery context:

- last completed date
- next scheduled day
- best streak context when current streak is 0

This complements the calendar and analytics without adding a new route.

## Weekly Review Tone

The current week is always treated as in progress. Open scheduled opportunities should be presented as current-week context, not as a final judgement.

Neutral labels:

- Open so far
- No completions yet this week
- Needs more data

## Notifications

Reminder notifications should stay schedule-aware and neutral. They should not imply failure, pressure, or streak risk unless that state is already calculated reliably.

Current reminder copy remains:

- Time for your Momentum habit.

## Accessibility

Recovery cards and habit context should:

- use button roles for dismissible cards
- provide concise labels
- not rely on colour alone
- wrap naturally with large text
- avoid repeated screen-reader announcements after dismissal

## Protected Progression Data

Recovery states must not remove or alter:

- earned achievements
- unlocked ranks
- XP
- best streak records
- historical completions
- reward history
- badge ordering
