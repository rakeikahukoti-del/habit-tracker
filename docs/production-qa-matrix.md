# Momentum Production QA Matrix

Use this checklist before portfolio demos, TestFlight/internal testing, or store submission.

## Installation and Launch

- Fresh install opens onboarding once.
- Existing install opens Home without onboarding loop.
- Cold launch keeps the dark launch shell until theme preference loads.
- Warm launch restores the last saved theme.
- Offline launch works without network errors.
- App restart preserves habits, preferences, rank, badges, and theme.

## Habit Workflow

- Create a habit with name, emoji, category, color, frequency, and optional reminder time.
- Reject empty or whitespace-only habit names.
- Reject invalid reminder times such as `8am` or `25:00`.
- Edit habit fields and verify reminders reschedule only when reminder-related fields change.
- Delete a habit and confirm scheduled reminders are cancelled.
- Swipe right completes an incomplete habit.
- Swipe left undoes today's completion for a completed habit.
- Tapping a habit opens detail without accidental navigation during swipe.
- Monthly calendar toggles completion dates and recalculates streaks, analytics, XP, and badges.
- Reorder Habits screen saves order after app restart.
- Move completed habits to bottom preserves custom order within completed/incomplete groups.

## Progression

- XP awards once per completion.
- Undo and history edits rebuild XP, levels, ranks, badges, and analytics.
- Perfect day bonus awards once per day.
- Badge unlocks do not duplicate after restart.
- Level-up popup does not repeat after dismissal.
- Reward popups appear only on Home and one at a time.
- Demo data and Master demo data recalculate XP, level, rank, badges, themes, and analytics.
- Maximum rank state displays correctly at Master.

## Analytics and Progress

- Progress handles no habits, one habit, and many habits.
- Analytics handles no data without crashing.
- Week, month, year, and all-time periods render sensible numbers.
- Individual analytics opens for valid habit IDs and handles deleted or missing habits safely.
- Calendar and trend dates handle month/year boundaries and leap-year dates.

## Settings

- Habit Preferences toggles save and persist.
- Gamification Preferences toggles affect future Home and popup behavior.
- Notification Preferences shows permission state without repeated prompts.
- Appearance preserves Light, Dark, System, and rank theme IDs.
- Locked themes cannot be selected.
- Import JSON rejects invalid data without overwriting current habits.
- Export JSON includes habits and app metadata.
- Reset all data confirms before deleting local data.
- Privacy, Terms, and Disclaimer have one working back action.

## Notifications

- Permission is requested only when scheduling a reminder.
- Permission denied keeps the app usable.
- Permission blocked is shown clearly in Notification Preferences.
- Daily, Weekdays, and Custom Days reminders schedule expected triggers.
- Updating reminder time cancels stale notification IDs.
- Deleting habits and resetting data cancels scheduled reminders.
- Expo Go notification behavior is verified separately from native builds.

## Accessibility

- Bottom navigation icons have labels and obvious selected state.
- Settings rows and toggles announce title and state.
- Calendar cells announce add/remove completion intent.
- Badge and achievement cards announce earned/locked state.
- Destructive actions explain consequences before confirming.
- Large text does not hide modal buttons or form save actions.
- Swipe/drag workflows have tap or settings alternatives.
- Light, Dark, and rank themes maintain readable contrast.

## Platforms and Devices

- iOS small phone.
- iOS large phone.
- iPad/tablet.
- Android phone.
- Android hardware back behavior.
- Landscape mode for scrollable screens.
- Reduced motion enabled.
- Notification permission granted, denied, and blocked.

## Release Owner Checks

- App name confirmed.
- Bundle identifiers configured for production.
- Support/contact information confirmed before store submission.
- Privacy text reviewed by the owner.
- Terms and Disclaimer reviewed by the owner.
- Store screenshots prepared.
- Store copy prepared.
- Version and build number confirmed.
- Backup branch or tag created before release.
