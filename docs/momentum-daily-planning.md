# Momentum Daily Planning

Momentum supports a lightweight daily plan for today only. The plan lets a user choose up to three scheduled habits as priorities and work through them in Focus Mode.

## Storage

Daily planning is stored locally in AsyncStorage under `momentum:daily-plan`.

```json
{
  "version": 1,
  "date": "2026-07-30",
  "habitIds": []
}
```

The plan is intentionally date-scoped. When the stored date does not match the current local day, Momentum resets the plan to an empty list for the new day.

## Rules

- A daily plan can contain up to three habits.
- Only habits scheduled for the current local day can be added.
- Duplicate habit ids are removed during normalization.
- Missing or deleted habits are removed during normalization.
- Reordering uses simple up and down controls on Home.
- Priority habits render once in the Today's Focus section and are removed from the remaining Home list for that day.

## Focus Mode

Focus Mode is a short session over the selected priority habits.

- Complete uses the existing habit completion flow.
- Skip is session-only and is not stored.
- Exit leaves the daily plan unchanged.
- When all priority habits are complete, Focus Mode shows a simple all-complete state.

Focus Mode does not add timers, background tasks, analytics rules, XP rules, notification changes, or new habit behavior.

## Data Safety

Daily plan loading is defensive:

- Malformed JSON returns an empty plan.
- Invalid values are normalized before use.
- Failed reads never crash the app.
- Failed writes surface a Home error and leave the existing in-memory plan intact.

The daily plan does not alter the habit data shape, gamification calculations,
analytics definitions, or notification scheduling. Full-app backup includes the
current plan and normalizes it against restored habits during import.
