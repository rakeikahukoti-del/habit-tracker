# Momentum Settings

Momentum settings are local-only and stored with AsyncStorage. Settings must not
change habit history, XP, rank thresholds, achievements, import/export formats,
or notification semantics unless a user explicitly performs that action.

## Information Architecture

The main Settings screen is organised around actions that change the app:

- Appearance
- Daily experience
- Gamification
- Widgets
- Data
- Privacy and legal
- About
- Reset

Rank and Analytics remain available from primary navigation rather than being
duplicated inside Settings. Habit, gamification, notification, and appearance
options use dedicated screens with consistent back navigation.

## Shared Settings Components

`components/settings/SettingsSection.js` owns the shared screen shell, header,
group, row, toggle row, status message, and theme preview row.

- Rows expose one full-width touch target.
- Toggle rows expose a single switch control to accessibility services. The
  visual switch does not create a second nested action.
- Row descriptions are accessibility hints, and row values are included in
  accessible labels.
- Titles and section labels use header semantics.
- Status and error messages use live regions.

`utils/settingsPresentation.js` contains deterministic display helpers for
settings accessibility labels, reminder summaries, permission labels, and
destructive confirmation copy.

## Active Preference Keys

App preferences are stored under `momentum:app-preferences`.

| Preference | Default | Purpose |
| --- | --- | --- |
| `enableDailyReminders` | `true` | Allows reminders for habits that have reminder times. |
| `enableLongPressReorder` | `true` | Enables habit reordering interactions where supported. |
| `enableRewardHaptics` | `true` | Enables subtle haptics for reward moments. |
| `enableSwipeToComplete` | `true` | Enables swipe right to complete and swipe left to undo. |
| `moveCompletedToBottom` | `false` | Moves completed habits below incomplete habits on Home. |
| `showBadgePopups` | `true` | Allows badge and reward popups. |
| `showLevelUpPopup` | `true` | Allows level-up popups. |
| `showProgressCard` | `true` | Shows the progress card on Home. |
| `showXpRankOnHome` | `true` | Shows XP and rank details on Home. |

The legacy key `momentum:move-completed-to-bottom` is still written for backward
compatibility. Preference and legacy compatibility values are written together
with one `AsyncStorage.multiSet` operation.

`hooks/useAppPreferenceSettings.js` serialises preference changes made from
Habit Preferences and Gamification Preferences. Controls are temporarily
disabled during a write so rapid taps cannot create competing updates.

## Onboarding and Progress Keys

- `momentum:onboarding-complete`
- `momentum:last-shown-level`
- `momentum:first-trend-unlock-shown`
- `momentum:first-swipe-hint-dismissed`
- `momentum:return-guidance-dismissed-date`

These keys control first-use and popup presentation only. They do not store habit
history.

## Reset Behaviour

- Reset all data removes habits, progress, badges, and scheduled reminders.
- Reset onboarding clears onboarding completion so onboarding can appear again.
- Reset preferences restores `momentum:app-preferences` to defaults and updates
  the legacy completed-to-bottom key.

Each destructive action requires confirmation and can be cancelled safely.

## Theme Behaviour

Momentum supports Light and Dark appearance modes. Legacy rank theme names are
migrated to Light or Dark by `utils/themePreferences.js`. Rank medals and
achievement colours remain visual assets and do not change the app theme.

Theme changes apply immediately. If persistence fails, the previous appearance
is restored and the Appearance screen shows an accessible error.

## Notification Settings

Daily reminders are optional. Momentum asks notification permission only when
habit reminders need to be scheduled. If permission is denied or unavailable, the
app continues to work without reminders.

Notification Preferences shows a guarded loading state before displaying
permission and reminder values. Reminder changes remain serialised while local
notification state and the saved preference are updated.

## Data Management

Export, import, demo, and reset behaviour remains in `app/settings.js`, while
backup validation and persistence remain in `storage/appBackup.js`. The data
sheet scrolls independently above its actions so validation details and JSON
remain reachable with large text or an open keyboard. All replacement and reset
actions use shared, explicit confirmation copy.

## Accessibility

Settings rows use clear labels and large touch targets. Toggle rows expose
checked and disabled state. Destructive actions use explicit wording in both the
row title and confirmation dialog. Theme choices use radio semantics, and data
dialogs respect the device reduced-motion preference.
