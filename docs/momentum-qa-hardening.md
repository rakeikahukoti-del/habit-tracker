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
- Destructive actions remain behind confirmation dialogs.
- Preference and onboarding resets do not remove habit history.

## Accessibility

- Important form validation messages use `accessibilityRole="alert"`.
- Disabled controls expose disabled state where supported.
- Calendar history days announce whether a completion will be added or removed.
