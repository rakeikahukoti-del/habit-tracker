# Momentum

Momentum is a polished mobile habit tracker built with React Native and Expo. It is designed as a simple portfolio-ready MVP: fast to run, easy to understand, and fully local with no backend.

## Features

- Create, edit, and delete habits
- Mark habits complete for today
- Prevent duplicate completions on the same day
- Track current streak and best streak
- Show weekly progress on each habit card
- View a 30-day history grid for each habit
- View app-wide stats, including weekly completion percentage
- Add habit emoji, category, color, frequency, and optional reminder time
- Schedule local daily/weekly habit reminders with Expo Notifications
- Load demo data for presentations
- Reset all local data with confirmation
- Light, dark, and system theme preferences
- Works entirely with local storage

## Tech Stack

- React Native
- Expo SDK 54
- Expo Router
- AsyncStorage
- Expo Notifications
- JavaScript

## Project Structure

```text
app/
  index.js           Home screen
  add.js             Add habit screen
  stats.js           Stats screen
  settings.js        Settings screen
  privacy.js         Privacy Policy screen
  terms.js           Terms of Use screen
  disclaimer.js      Disclaimer screen
  habit/[id].js      Habit details and edit screen

components/
  EmptyState.js
  HabitCard.js
  HabitFormFields.js
  HabitHistoryGrid.js
  LegalScreen.js
  ProgressDots.js

constants/
  appConfig.js
  colors.js
  habitOptions.js

notifications/
  habitNotifications.js

storage/
  habitsStorage.js

utils/
  habitStats.js
```

## Setup

Install dependencies:

```sh
npm install
```

Start the app:

```sh
watchman watch-del-all
npm run start:clear
```

Then open it with Expo Go, an iOS Simulator, or an Android Emulator.

## Configuration

Demo controls are enabled from:

```text
constants/appConfig.js
```

Set `SHOW_DEMO_TOOLS` to `false` before using the app as a non-demo build.

## Demo Tips

Use the **Demo data** button on the Settings screen to quickly populate the app with sample habits and progress. Use **Reset all data** to clear all local habits and scheduled reminders.

Reminder times use 24-hour format, for example:

```text
08:30
19:15
```

If notification permission is denied, the app still saves habits and works normally.

For the most accurate notification testing, use a development build or native build. Expo Go is useful for UI demos, but notification behavior can vary by platform and Expo Go version.

The Settings screen includes Light, Dark, and System theme options. Theme preference is saved locally with AsyncStorage.

## Future Improvements

- Add searchable habit lists
- Add habit archive instead of permanent delete
- Add richer frequency logic for completion eligibility
- Add charts for monthly progress
- Add import/export for local data backup
- Add automated tests for streak and stats utilities
