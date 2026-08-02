# Momentum Notifications

Momentum reminders are local-only Expo Notifications. They do not use a backend, account, network request, background service, or generated messaging.

## Architecture

Notification logic is centralized in `notifications/habitNotifications.js`.

- Permission handling: `getNotificationPermissionState`, `getNotificationPermissionMessage`
- Schedule generation: `createReminderSchedule`, `getReminderDays`, `getReminderPreview`
- Registration: `scheduleHabitReminder`
- Cancellation: `cancelHabitReminders`, `removeInvalidNotifications`
- Reconciliation: `syncHabitReminder`, `validateReminderState`, `reconcileNotifications`

`storage/habitsStorage.js` is responsible for persisting the resulting `notificationIds` and `reminderStatus` on habit records. Storage keys and habit data shape remain unchanged.

## Scheduling Rules

Reminder time must use a valid 24-hour `HH:mm` value. Invalid or missing times produce no scheduled notification.

Supported schedules:

- Daily: one repeating daily notification
- Weekdays: Monday through Friday weekly notifications
- Weekends: Saturday and Sunday weekly notifications, supported defensively
- Custom: one weekly notification for each selected valid day
- Single-day custom schedules: one weekly notification
- Seven-day custom schedules: seven weekly notifications

Expo handles local timezone and daylight saving transitions through repeating calendar triggers.

## Reminder Reconciliation

Momentum runs a reminder health check on app startup after the theme has loaded. The check is idempotent and repairs only inconsistencies.

The reconciliation flow:

1. Reads saved habits and notification preference.
2. Removes orphaned or duplicate scheduled notifications.
3. Clears notification IDs for disabled or inactive reminders.
4. Reschedules only habits whose stored reminder state is incomplete or stale.
5. Saves habits only when repaired state changed.

This prevents deleted habits, disabled reminders, malformed imported data, or duplicate IDs from leaving stale local notifications behind.

## Permission Flow

Momentum asks for notification permission only when a reminder needs to be scheduled.

Permission states:

- Not asked: reminders can request permission when saved.
- Granted: reminders can be scheduled.
- Blocked: the app shows guidance to open device settings.
- Unavailable: the app keeps working without reminders.

Declining permission never blocks habit tracking.

## Reminder Lifecycle

- Create habit with reminder: schedule the appropriate local notifications.
- Edit time, frequency, days, name, or emoji: schedule the replacement, save the
  updated habit, then cancel the old IDs. If persistence fails, the replacement
  is removed and the previous schedule remains active.
- Disable daily reminders globally: cancel existing habit reminders and mark reminder state as disabled.
- Re-enable daily reminders: schedule valid habit reminders again.
- Delete habit: save the deletion, then cancel its notification IDs.
- Import backup: validate and commit imported data before old reminders are
  removed; reconciliation then schedules valid imported reminders.
- Reset or demo data: save replacement habits before cancelling old reminders.

## Accessibility

Forms include a live reminder preview such as `Every weekday at 7:00 AM`.

Notification Preferences exposes:

- permission status
- readable permission explanation
- active reminder count
- first active reminder summary

Labels avoid color-only state and remain concise for screen readers.
