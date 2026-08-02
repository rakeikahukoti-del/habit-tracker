# Momentum Architecture Notes

Momentum keeps feature logic intentionally small and local-first. Storage keys,
route names, reward rules, and persisted data shapes are treated as stable
compatibility boundaries.

For the complete V1 system and folder overview, see `docs/Momentum-V1.md`.

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

## Maintenance Boundaries

- Date-range behavior is shared where definitions match; schedule-specific
  analytics retain separate helpers where their denominators differ.
- `hooks/useHomeController.js` intentionally coordinates the coupled Home
  workflows. Split it only with equivalent behavior coverage.
- Rank, analytics, and Home are large presentation files. Extract sections only
  when reuse or a confirmed correctness issue justifies the additional API.
- Keep storage, notification, analytics, and gamification calculations outside
  reusable visual components.
