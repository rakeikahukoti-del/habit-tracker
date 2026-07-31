# Momentum Widgets

Momentum widget support is built as an offline integration foundation.

The current Expo project does not include native iOS WidgetKit or Android
Glance/App Widget extension scaffolding. This implementation provides the shared
data, action, and refresh layer that a native widget host can use without
duplicating business logic.

## Architecture

Widget logic is separated into dedicated modules:

- `widgets/widgetDataProvider.js`
- `widgets/widgetActions.js`
- `widgets/widgetRefresh.js`

Shared completion logic lives in:

- `utils/habitCompletionActions.js`

The app Home screen and widget quick actions use the same completion service for
habit storage, XP, achievements, and recalculation.

## Supported Widget Models

The data provider supports three widget sizes:

- Small: date, completion percentage, and remaining habit count
- Medium: Today's Focus, top habits, progress, and current streaks
- Large: today's habits, focus priorities, weekly progress, and summary

Each model is plain JSON-friendly data so it can be rendered by a native widget
extension later.

## Data Sources

Widgets read existing local data:

- habits from `habit-tracker:habits`
- app preferences from `momentum:app-preferences`
- daily plan from `momentum:daily-plan`
- gamification from existing gamification storage

No cloud storage, account, backend, or sync service is used.

## Quick Actions

Widget quick actions call:

- `completeHabitFromWidget(habitId)`
- `undoHabitFromWidget(habitId)`

These functions call shared completion helpers:

- `completeHabitTodayWithRewards(habitId)`
- `undoHabitTodayWithRewards(habitId)`

That means widget completion follows the same storage, XP, achievement, and
rebuild rules as the app.

## Refresh Strategy

Widget refresh requests are recorded through:

- `requestWidgetRefresh(reason, metadata)`

Refresh reasons include:

- habit completed
- habit undone
- habit edited
- habit deleted
- daily plan changed
- import or backup restore completed
- manual refresh

The current implementation stores a lightweight refresh request for future
native hosts. Native widget extensions can watch or read this request as part of
their refresh pipeline.

## Empty State

When no habits are scheduled today, the widget model returns:

- `empty: true`
- no habit rows
- progress values set to zero
- an accessibility label explaining that no habits are scheduled

## Error Handling

If widget data cannot be loaded, the provider returns a safe error model instead
of throwing into the widget renderer.

## Accessibility

Widget models include labels for:

- overall progress
- each habit completion state
- empty state

Native widget renderers should expose these labels to screen readers.

## Limitations

Native widgets require platform-specific host work:

- iOS: WidgetKit extension
- Android: App Widget or Glance implementation

Those native targets are not currently present in this Expo project and were not
added here to avoid dependency upgrades or native project restructuring.

## Future Enhancements

Good next steps:

- add native WidgetKit and Android widget targets
- connect native renderers to `getMomentumWidgetData`
- invoke `completeHabitFromWidget` from supported interactive widgets
- add widget preview screens inside the app
- add explicit refresh triggers after habit edits, imports, backup restores, and
  daily plan changes
