# Momentum

Momentum is an offline-first habit tracker built with React Native and Expo. It
combines daily habit completion, planning, analytics, reminders, and a
deterministic reward system without accounts or a backend.

## Current Feature Set

- Create, edit, delete, reorder, complete, and undo habits
- Daily, weekday, and custom-day schedules
- Emoji, category, colour, and optional local reminders
- Swipe actions, monthly history editing, and local-date-safe streaks
- Daily Planning with up to three priorities and a focused completion flow
- Built-in habit templates and routines that create ordinary editable habits
- Progress dashboard, Activity History heatmap, Analytics, personal records,
  weekly review, and Year in Review
- XP, levels, visible ranks, achievement badges, recent achievements, and
  queued reward presentation
- Light and Dark appearance modes with transparent theme-aware wolf branding
- Local backup export, validation, preview, and transactional restore
- Demo and Master demo data behind the configured demo-tools flag
- Offline widget data/action/refresh foundations for future native hosts

## Technology

- React Native 0.81
- Expo SDK 54 and Expo Router
- AsyncStorage
- Expo Notifications and Expo Haptics
- JavaScript

## Run Locally

```sh
npm install
npm start
```

Useful alternatives:

```sh
npm run start:clear
npm run start:high-files
npm run ios
npm run android
```

`start:high-files` raises the file-descriptor limit before starting Metro on
machines that encounter `EMFILE` watcher errors.

## Verification

```sh
npm test
git diff --check
npx expo export
```

The project uses a deterministic Node smoke-test suite. No lint or static-type
script is currently configured.

## Repository Layout

```text
app/             Expo Router screens and route shell
assets/          Native branding, runtime logos, ranks, and achievements
components/      Shared habit, brand, analytics, progression, settings, and UI
constants/       Stable app configuration, assets, colours, and habit options
context/         Theme resolution and persistence
docs/            Architecture and feature-specific implementation notes
hooks/           Home controller, preferences, and reduced-motion hooks
notifications/   Local permission, scheduling, cancellation, and reconciliation
scripts/         Deterministic logic test runner
src/design/      Shared design tokens and the legacy dark-theme adapter
storage/         AsyncStorage ownership, normalization, backup, and recovery
utils/           Pure habit, analytics, planning, progression, and copy helpers
widgets/         Offline widget models, actions, and refresh request boundary
```

## Data and Privacy

Habit and preference data stays on the device. Momentum does not use accounts,
cloud synchronization, advertising, analytics SDKs, or external data services.
Local JSON backup is the supported transfer and recovery mechanism.

Storage ownership and compatibility rules are documented in
[Momentum V1](docs/Momentum-V1.md) and
[Backup and Restore](docs/momentum-backup.md).

## Architecture

Screens own presentation and navigation. Shared components own reusable UI.
Storage modules own persisted state and normalization. Notification services own
OS reminder behavior. Pure utilities own habit schedules, streaks, analytics,
planning, and gamification calculations.

Business rules are kept outside presentation components where practical. XP,
rank thresholds, achievement requirements, analytics definitions, storage keys,
and backup schema version are compatibility boundaries.

## Important Limitations

- Data is local to one device unless the user exports a backup.
- Uninstalling the app or clearing app storage can remove local history.
- Local reminders depend on OS permission and should be verified in a native or
  development build; Expo Go behavior can vary.
- Appearance currently exposes Light and Dark modes. Legacy appearance values
  are normalized for compatibility.
- Widget modules are an integration foundation; this managed Expo project does
  not contain native iOS or Android widget extensions.
- Deleting a habit removes its history from future aggregate analytics.

## Documentation

Start with [docs/Momentum-V1.md](docs/Momentum-V1.md) for the complete project
overview. Feature-specific documents in `docs/` explain calculations,
persistence, accessibility, and compatibility constraints in more detail.
