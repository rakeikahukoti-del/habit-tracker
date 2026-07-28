# Momentum

Momentum is an offline-first mobile habit tracker built with React Native and Expo. It is designed for personal habit tracking, daily completion, progress review, and portfolio/demo use without a backend or account system.

## Features

- Create, edit, delete, complete, and undo habits
- Emoji, category, color, frequency, custom days, and optional reminder time
- Swipe completion, monthly history editing, and manual habit reordering
- Current streak, best streak, weekly progress, monthly calendar, and analytics
- XP, levels, ranks, badges, recent achievements, and rank medals
- Progress dashboard, Analytics, Rank, Settings, Appearance, and Legal screens
- Local notifications for habit reminders with permission-safe fallback
- Light and Dark appearance modes with legacy theme migration
- Demo data and Master demo data for portfolio walkthroughs
- JSON export/import for local backup transfer
- Fully local AsyncStorage persistence

## Tech Stack

- React Native
- Expo SDK 54
- Expo Router
- AsyncStorage
- Expo Notifications
- Expo Haptics
- JavaScript

## Setup

Install dependencies:

```sh
npm install
```

Start the app:

```sh
npm run start:clear
```

If your machine hits file watcher limits, use:

```sh
npm run start:high-files
```

Then open the app with Expo Go, an iOS Simulator, an Android Emulator, or a native development build.

## Verification

Run the lightweight logic smoke tests:

```sh
npm test
```

Run the Expo export check:

```sh
npx expo export --platform ios --output-dir /private/tmp/momentum-export
```

There is no lint script configured yet.

## Project Structure

```text
app/                         Expo Router screens
components/                  Reusable app, habit, brand, progression, settings, and UI components
constants/                   App config, colors, habit options, quotes, typography
context/                     Theme provider and theme persistence
docs/                        QA and release documentation
notifications/               Expo Notifications scheduling helpers
scripts/                     Local verification scripts
src/design/                  Momentum v2 design tokens
storage/                     AsyncStorage helpers and data normalization
utils/                       Habit stats, analytics, and color utilities
```

## Local Data Model

Momentum stores data only on the user's device.

| Storage key | Owner | Data | Fallback |
| --- | --- | --- | --- |
| `habit-tracker:habits` | Habits | Habit array with completion dates, order, and notification metadata | Invalid JSON is backed up and the app uses an empty list |
| `habit-tracker:habits-backup` | Recovery | Raw unreadable habits JSON | Kept for manual recovery |
| `habit-tracker:gamification` | Rewards | XP, earned badge IDs, perfect-day dates, pending messages, recent achievements | Invalid data normalizes to empty progress |
| `momentum:app-preferences` | Preferences | Boolean app preferences | Missing/invalid values use defaults |
| `momentum:move-completed-to-bottom` | Legacy preference | Legacy completed-order fallback | Preserved for older installs |
| `momentum:theme-preference` | Appearance | Theme key | Unknown values fall back through the theme provider |
| `momentum:onboarding-complete` | Onboarding | Completion flag | Missing value shows onboarding |
| `momentum:last-shown-level` | Rewards | Last displayed level-up popup | Invalid value falls back to level 1 |

## Notifications

Momentum uses Expo Notifications for local habit reminders.

- Permission is requested only when a habit reminder needs scheduling.
- If permission is denied or blocked, habits still save and the app remains usable.
- Updating habit reminder fields cancels stale notifications before scheduling new ones.
- Deleting habits or resetting data cancels scheduled reminders.
- Expo Go notification behavior can vary by platform. Use a development build or native build for final notification QA.

## Demo Data

Settings includes demo controls when `SHOW_DEMO_TOOLS` is enabled in:

```text
constants/appConfig.js
```

Demo data replaces current habits after confirmation. Export JSON first if you need a backup.

## Known Limitations

- Data is local to one device.
- There is no cloud sync, account system, or automatic backup.
- Uninstalling the app or clearing app data can remove habits and history.
- Notifications depend on device permissions, OS settings, and platform behavior.
- Store bundle identifiers, support contact details, and final legal review require owner input before public release.

## QA and Release Checklist

Use [docs/production-qa-matrix.md](docs/production-qa-matrix.md) before demos or releases.

Owner-confirmed items before App Store or Play Store release:

- Version and build number
- Bundle identifiers
- App icon and splash assets
- Privacy, Terms, and Disclaimer review
- Notification behavior on physical iOS and Android devices
- Accessibility pass with large text and screen reader
- Store screenshots and copy
- Support/contact information
- Backup branch or tag

## Future Improvements

- Add automated unit coverage for more storage and progression helpers
- Add optional archive flow instead of permanent habit deletion
- Add native build profiles when bundle identifiers are confirmed
- Add screenshot assets after final device QA
