# Momentum Architecture Notes

Momentum keeps feature logic intentionally small and local-first. Storage keys,
route names, reward rules, and persisted data shapes are treated as stable
compatibility boundaries.

## Shared Preference Screens

`hooks/useAppPreferenceSettings.js` centralizes the common loading, saving, and
error handling used by preference-only settings screens.

Current users:

- `app/habit-preferences.js`
- `app/gamification-preferences.js`

`app/notification-preferences.js` remains separate because it also handles
notification permission state and reminder scheduling side effects.

`components/settings/SettingsSection.js` provides the shared layout and
interaction model for Settings rows. `utils/settingsPresentation.js` contains
pure copy and summary helpers that can be tested without rendering React Native
screens.

## Storage Safety

Storage helpers should continue to return safe defaults when stored data is
missing or malformed. New persistence helpers should avoid overwriting valid
data after a failed parse or failed write.

## Remaining Cleanup Candidates

- Date-range helpers are still repeated across analytics and record utilities.
- `hooks/useHomeController.js` owns several Home workflows and could eventually
  be split by concern after behavior is covered by tests.
- Rank and reward presentation remain large UI files, but they are stable and
  should only be split when the extracted pieces are reused.
