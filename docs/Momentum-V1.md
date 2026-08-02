# Momentum V1

## Project Overview

Momentum is a mobile-first, offline habit tracker. Its primary workflow is:

1. Create a scheduled habit.
2. Complete or undo it from Home.
3. Build streaks and earn deterministic XP and achievements.
4. Review progress through weekly, monthly, annual, and habit-level views.
5. Protect local data with export and validated restore.

There is no account, backend, cloud sync, advertising, payment, or social
system. All user data is owned by the local installation.

## Architecture Summary

Momentum uses Expo Router for route discovery and a root stack in
`app/_layout.js`. `ThemeProvider` and app-level error boundaries wrap every
screen. The app follows four practical layers:

- **Presentation:** route files in `app/` and reusable components in
  `components/`.
- **Interaction:** controller hooks and shared action helpers in `hooks/` and
  `utils/`.
- **Domain calculations:** pure schedule, streak, analytics, planning, and
  progression helpers in `utils/`.
- **Persistence and platform services:** AsyncStorage modules in `storage/`,
  local reminders in `notifications/`, and widget boundaries in `widgets/`.

Screens load persisted source data and memoize derived presentation where it is
worthwhile. Analytics are derived rather than stored. Gamification persistence
is orchestrated separately from pure reward calculations.

## Routes

| Route | Responsibility |
| --- | --- |
| `/` | Home, today's habits, Daily Planning, Focus Mode, and reward queue |
| `/onboarding` | First-use introduction |
| `/add` | Habit, template, and routine creation |
| `/habit/[id]` | Habit editing, statistics, calendar history, and recovery context |
| `/stats` | Progress dashboard, weekly review, Activity History, and records |
| `/analytics` | Overall analytics and insight dashboard |
| `/analytics/[id]` | Individual habit analytics |
| `/year-review` | Deterministic annual summary and milestones |
| `/rank` | XP, visible ranks, achievements, and recent rewards |
| `/settings` | Settings navigation and data management |
| `/appearance` | Light and Dark appearance selection |
| `/habit-preferences` | Habit interaction preferences |
| `/gamification-preferences` | Reward presentation preferences |
| `/notification-preferences` | Reminder permission and global reminder state |
| `/reorder-habits` | Persisted drag-and-drop ordering |
| `/privacy`, `/terms`, `/disclaimer` | Local legal information |

## Folder Overview

- `app/`: route-level loading, navigation, and screen composition.
- `components/`: shared UI grouped into analytics, brand, progression,
  settings, and low-level primitives.
- `hooks/`: reusable stateful behavior. `useHomeController` owns Home hydration,
  completion actions, planning, reward sequencing, and refresh behavior.
- `storage/`: AsyncStorage ownership, normalization, fallback behavior, and
  transactional backup restore.
- `notifications/`: local reminder permission, schedule construction,
  reconciliation, and cancellation.
- `utils/`: deterministic business and presentation calculations.
- `constants/`: asset manifests, colours, stable options, and configuration.
- `src/design/`: the shared spacing, radius, typography, shadow, layout, colour,
  and motion tokens.
- `widgets/`: JSON-friendly widget models and shared completion/refresh
  boundaries. Native widget hosts are not part of V1.
- `docs/`: focused implementation and QA documentation.
- `scripts/`: the dependency-free logic smoke-test runner.

## Habit System

A habit stores an ID, name, category, emoji, colour, creation timestamp,
frequency, custom weekdays, optional reminder time, notification metadata,
completion date keys, and manual order. Older habits are normalized with safe
defaults when fields are absent.

Daily, Weekdays, and Custom schedules use local calendar date keys. Completion
history is de-duplicated and invalid or future dates are ignored by analytics.
The current streak remains active before today's scheduled completion and only
breaks after an actual missed scheduled day.

Home completion and undo call shared actions that serialize operations per
habit, persist history, update gamification, request widget refresh, and avoid
duplicate rewards. Manual ordering persists independently of the optional
completed-to-bottom display grouping.

## Daily Planning, Templates, and Routines

Daily Planning stores up to three scheduled priority habit IDs for the current
local date. Stale plans normalize to an empty plan on a new day. Focus Mode is a
session view over those existing habits; it does not introduce separate
completion or reward rules.

Templates and routines are code-defined starting points. Applying a template
fills the Add form. Creating a routine produces independent normal habits.
Templates and routines have no separate persisted user-data model in V1.

## Gamification Summary

The pure rules live in `utils/gamification.js`; persistence orchestration lives
in `storage/gamificationStorage.js`.

- Habit completion awards 10 XP.
- A scheduled perfect day awards a 25 XP bonus once for that date.
- Level is `Math.floor(totalXP / 100) + 1`.
- Existing rank thresholds and achievement requirements are fixed compatibility
  rules.
- Rank display preserves legacy Diamond data compatibility while the active
  visual path uses Bronze, Silver, Gold, Platinum, and Master assets.
- Reward messages are queued and presented one at a time on Home.
- Recalculation from habit history is deterministic and used after imports,
  history edits, demo loading, and destructive changes.

Achievements are stored as earned IDs and recent achievement records. Progress
for locked achievements is derived from current habit and gamification data.

## Analytics Summary

Analytics are computed from the current habit list and completion history. No
aggregate analytics database is stored.

The system provides:

- current and best streaks
- weekly and monthly completion rates
- scheduled-opportunity-aware trends
- strongest and weakest habit rankings
- category and consistency insights
- weekly review and comparison states
- personal records and lifetime statistics
- Activity History day/month/year models
- habit-level analytics and milestones
- deterministic Year in Review summaries

Invalid, duplicate, and future dates are excluded. Ties use stable ordering.
Sparse histories show readiness states rather than fabricated trends.

## Storage Summary

| Key | Owner | Purpose |
| --- | --- | --- |
| `habit-tracker:habits` | `habitsStorage` | Habits, order, completion history, and reminder metadata |
| `habit-tracker:habits-backup` | `habitsStorage` | Raw malformed habit JSON retained for recovery |
| `habit-tracker:gamification` | `gamificationStorage` | XP, achievements, perfect days, rewards, and recent history |
| `momentum:app-preferences` | `appPreferences` | Boolean behavior and presentation preferences |
| `momentum:move-completed-to-bottom` | `appPreferences` | Legacy compatibility mirror |
| `momentum:onboarding-complete` | `appPreferences` | First-use completion flag |
| `momentum:last-shown-level` | `appPreferences` | Level-popup repeat prevention |
| `momentum:first-trend-unlock-shown` | `appPreferences` | First analytics milestone flag |
| `momentum:first-swipe-hint-dismissed` | `appPreferences` | Swipe guidance dismissal |
| `momentum:return-guidance-dismissed-date` | `appPreferences` | Daily recovery-message dismissal |
| `momentum:theme-preference` | `ThemeContext` | Light or Dark preference |
| `momentum:daily-plan` | `dailyPlanStorage` | Current date and priority habit IDs |
| `momentum:widget-refresh` | `widgetRefresh` | Ephemeral native-widget refresh request |

Storage reads return safe defaults after missing or malformed values. Habit
parse failures preserve the unreadable raw value. Writes that affect reminders
use commit-and-cleanup ordering so failed habit persistence does not discard the
previous reminder schedule.

## Backup System

`storage/appBackup.js` owns schema version 1 export, migration, validation,
preview, normalization, and restore.

Exports contain metadata and all durable user data covered by
`STORAGE_KEY_MANIFEST`. The ephemeral widget refresh request is intentionally
excluded. Import validates and repairs recoverable values before writing.
Storage replacement is transactional at the AsyncStorage layer: a partial
failure restores previous values and removes newly created keys. Reminder and
widget reconciliation runs after a successful commit.

The legacy habit-only JSON import remains supported separately for compatibility.

## Notification System

`notifications/habitNotifications.js` builds local repeating schedules for
Daily, Weekdays, and Custom habits. Permission is requested only when a reminder
needs scheduling; denial never blocks habit saving.

Habit storage persists notification IDs and status. New or replacement
notifications are scheduled before commit, cleaned up if persistence fails, and
old schedules are cancelled only after the replacement habit data is saved.
Startup reconciliation removes orphaned notifications and repairs stale state
without blocking app launch.

## Theme and Design System

Momentum exposes Light and Dark appearance modes. Historical theme identifiers
normalize to the supported values. `ThemeContext` owns resolution and
persistence, and `constants/colors.js` supplies the two application palettes.

Shared tokens in `src/design/` define typography, spacing, radius, shadows,
layout, colour, and motion. `components/ui/` contains only primitives currently
used by the app. Runtime wolf logos select black artwork for Light and white
artwork for Dark after theme hydration. Native icon and splash configuration
remain static.

Reduced-motion state is read through `useReducedMotion`; visual rewards retain
text and accessibility announcements when motion is disabled.

## Key Design Decisions

- Local date keys are used where user calendar behavior matters.
- Derived analytics are recalculated rather than persisted.
- Storage keys and backup schema are compatibility boundaries.
- Completion, undo, and widget actions share one reward-aware action layer.
- Reward popups appear on Home and consume a serialized queue.
- Forms use explicit validation and duplicate-submit guards.
- Destructive actions require confirmation; calendar history toggles do not.
- Rank, achievement, and branding assets remain separate visual systems.
- Native integrations degrade safely when permission or host support is absent.

## Accessibility

The shared interface uses labelled controls, explicit roles and states,
minimum touch targets, text alternatives for charts and progress, modal
semantics, reduced-motion branches, and non-gesture reorder actions. Swipe and
drag remain optional because completion and reorder controls have accessible
alternatives.

Physical-device VoiceOver, TalkBack, large-text, keyboard, safe-area, and local
notification behavior remain part of ongoing maintenance QA.

## Testing

`npm test` runs deterministic logic coverage for dates, schedules, analytics,
gamification, preferences, notification reconciliation, backup safety, widget
models/actions, planning, templates, routines, and storage recovery.

`npx expo export` verifies that iOS and Android bundles and static assets compile.
There is currently no configured lint, formatter, TypeScript, or UI automation
toolchain.

## Known Limitations

- Local data has no automatic cloud copy.
- Native notification behavior requires device-level permission and testing.
- Native iOS and Android widgets are not included; only the shared foundation
  exists.
- Appearance does not currently expose a selectable System mode.
- Deleted habit history cannot contribute to later analytics.
- Recent achievement timestamps provide only the historical detail that is
  actually persisted; older rank-promotion timelines cannot be reconstructed.
- The largest route files remain intentionally unsplit because broad refactors
  would add risk without changing behavior.

## Future Ideas

These are intentionally outside Momentum V1:

- optional account-free archive instead of permanent deletion
- native widget hosts using the existing model/action boundary
- selectable System appearance behavior
- broader automated component and navigation testing
- optional native sharing for Year in Review
- deeper historical event attribution if the persisted model is expanded in a
  future compatible schema

## Lessons Learned

- Local-first does not remove consistency problems; storage and OS side effects
  still require explicit ordering and rollback behavior.
- Date calculations need schedule awareness and local-calendar semantics from
  the beginning.
- Reward calculations are easier to trust when pure logic is separated from
  persistence and presentation.
- A shared design system only stays useful when unused primitives and parallel
  token systems are removed.
- Accessibility alternatives should be part of interaction design rather than
  added after gesture-heavy workflows are complete.
- Deterministic fixtures and stress cases provide high value even without a
  full UI testing framework.
