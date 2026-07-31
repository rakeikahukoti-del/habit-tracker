# Momentum QA Hardening

This note captures production-quality edge-case rules that should remain stable
across future polish sessions.

## Habit Forms

- Habit names are required in the Add and Edit forms.
- Form errors appear near the top of the form and use an alert role so they are
  easier to find with assistive technology.
- Editing fields after a validation error clears the stale error message.
- Reminder times must use valid 24-hour format, for example `08:30`.
- Custom frequency requires at least one selected day.

## Storage Defaults

- Imported, legacy, or corrupted habits with blank names normalize to
  `Untitled habit`.
- Valid habit names are trimmed during normalization.
- Invalid completion dates are ignored by storage and analytics helpers.
- Duplicate completion dates are stored once where helpers normalize history.

## Data Safety

- Import replaces current habits only after JSON parses and includes a valid
  habits array.
- Full-app backup imports snapshot every destination key before writing. A
  partially failed write restores the previous values and removes keys that did
  not previously exist.
- Completion and undo requests are serialized per habit so rapid taps, widget
  actions, and gesture callbacks cannot award the same completion twice.
- Pending reward messages are consumed serially so overlapping Home hydration
  cannot display the same stored reward queue twice.
- Reminder creation and replacement clean up newly scheduled notifications when
  habit persistence fails. Existing reminders are cancelled only after the
  replacement habit data has been saved.
- Habit deletion, reset, demo replacement, and import cancel old reminders only
  after the replacement habit data has been saved.
- Destructive actions remain behind confirmation dialogs.
- Preference and onboarding resets do not remove habit history.

## Recovery Defaults

- A missing, blank, zero, negative, or non-numeric last-shown level recovers to
  level 1.
- Stored guidance dates must be real local calendar dates, not only
  `YYYY-MM-DD`-shaped strings.
- Notification settings reload persisted preferences, reminder counts, and
  permission state after a failed update.
- Onboarding prevents duplicate completion writes and leaves a visible retry
  message if its persisted state cannot be saved.
- Detail saves return to the previous route when available and fall back to Home
  when the detail route was opened directly.

## Accessibility

- Important form validation messages use `accessibilityRole="alert"`.
- Disabled controls expose disabled state where supported.
- Calendar history days announce whether a completion will be added or removed.
- Reorder rows expose adjustable move-up and move-down actions in addition to
  long-press drag gestures.

## Analytics

- Screens that need lifetime statistics and personal records should build one
  analytics context and derive both result sets from it.
