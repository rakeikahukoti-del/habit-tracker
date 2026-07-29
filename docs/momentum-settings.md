# Momentum Settings

Momentum settings are local-only and stored with AsyncStorage. Settings must not
change habit history, XP, rank thresholds, achievements, import/export formats,
or notification semantics unless a user explicitly performs that action.

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
compatibility.

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

## Notification Settings

Daily reminders are optional. Momentum asks notification permission only when
habit reminders need to be scheduled. If permission is denied or unavailable, the
app continues to work without reminders.

## Accessibility

Settings rows use clear labels and large touch targets. Toggle rows expose
checked and disabled state. Destructive actions use explicit wording in both the
row title and confirmation dialog.
