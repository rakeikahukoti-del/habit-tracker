# Momentum v2 Phase 1 Audit

This document captures the current app structure and the protected behavior that future redesign phases should preserve.

## Architecture

Momentum is an Expo SDK 54 app using React Native, Expo Router, AsyncStorage, Expo Notifications, and Expo Haptics. The app is JavaScript-only and uses `expo-router/entry` as its main entry point.

Routes live in `app/`:

- `index.js`: Home dashboard, today progress, habit list, swipe completion, popup queue.
- `add.js`: Create habit form.
- `habit/[id].js`: Habit detail, edit form, monthly completion calendar, delete.
- `stats.js`: Progress dashboard, stats, badges, achievements.
- `analytics.js`: Habit and overall analytics.
- `rank.js`: XP, rank, unlocks, badges, recent achievements.
- `settings.js`: Main grouped settings, demo/reset/import/export, legal links.
- `habit-preferences.js`: Habit behavior toggles and reorder link.
- `gamification-preferences.js`: Reward and haptic preferences.
- `notification-preferences.js`: Reminder preferences.
- `reorder-habits.js`: Manual habit ordering.
- `onboarding.js`: First-use onboarding.
- `privacy.js`, `terms.js`, `disclaimer.js`: Legal content.

Shared production components currently live in `components/`:

- `BottomNav`: bottom navigation shell.
- `HabitCard`: Home card, swipe gestures, completion/undo, detail navigation.
- `ProgressDots`: 7-day progress display.
- `HabitHistoryGrid`: monthly completion calendar for habit history edits.
- `HabitFormFields`: shared create/edit form fields.
- `GamificationPanel`: XP/rank/badge summary.
- `ConfettiBurst`: lightweight celebration animation.
- `EmptyState`, `LegalScreen`: common screen content.

Business logic is mostly separated into:

- `storage/habitsStorage.js`: habit CRUD, completion, import/export, demo data, ordering, reminder scheduling integration, habit normalisation.
- `storage/gamificationStorage.js`: XP, level, rank, badge, achievement, pending reward messages.
- `storage/appPreferences.js`: onboarding, last shown level, app preference toggles.
- `utils/habitStats.js`: date keys, streaks, weekly/monthly progress, analytics summaries.
- `notifications/habitNotifications.js`: reminder permission, schedules, cancellation, trigger creation.

Areas where UI and business logic are still mixed:

- `app/index.js`: popup queue timing, reward consumption, today progress calculations, habit sorting, and completion UI state are mixed with Home layout.
- `app/rank.js` and `app/stats.js`: badge preview/detail UI is mixed with gamification presentation calculations.
- `app/settings.js`: settings layout, destructive actions, import/export, and demo data workflows live together.
- `app/reorder-habits.js`: drag gesture state and persistence are coupled in one screen file.
- `app/habit/[id].js`: edit form state, delete flow, stats, and calendar completion editing are in one screen.

These areas should be handled carefully in later phases, but Phase 1 does not refactor them.

## Protected Functionality

Future redesign work should preserve:

- Habit create, edit, delete.
- Habit complete and undo.
- Calendar-based history editing.
- Streak, best streak, weekly progress, monthly analytics, and overall analytics.
- XP, levels, ranks, badges, achievements, perfect-day rewards, and reward popups.
- Reward popup queueing on Home only.
- Local notifications and reminder cancellation/update behavior.
- Swipe right to complete and swipe left to undo.
- Drag-and-drop habit reordering.
- Completed-habits-to-bottom sorting while preserving manual order within groups.
- Theme preferences, unlockable rank themes, and system theme handling.
- All app preferences and onboarding state.
- Demo data, master demo data, JSON export, and JSON import.
- Existing Expo Router navigation paths.
- Existing AsyncStorage data and keys.

Protected storage keys:

- `habit-tracker:habits`
- `habit-tracker:habits-backup`
- `habit-tracker:gamification`
- `momentum:app-preferences`
- `momentum:move-completed-to-bottom`
- `momentum:onboarding-complete`
- `momentum:last-shown-level`
- `momentum:theme-preference`

Protected habit shape:

```js
{
  id: string,
  name: string,
  emoji: string,
  category: string,
  color: string,
  frequency: string,
  customDays: number[],
  reminderTime: string,
  createdAt: string,
  completedDates: string[],
  order: number,
  notificationIds: string[],
  reminderStatus: string
}
```

Older habits may be missing newer fields. `normalizeHabit` must continue to fill safe defaults.

Protected gamification shape:

```js
{
  earnedBadges: string[],
  pendingMessages: object[],
  perfectDayBonusDates: string[],
  recentAchievements: object[],
  xp: number
}
```

Protected preference shape:

```js
{
  enableDailyReminders: boolean,
  enableLongPressReorder: boolean,
  enableRewardHaptics: boolean,
  enableSwipeToComplete: boolean,
  moveCompletedToBottom: boolean,
  showBadgePopups: boolean,
  showLevelUpPopup: boolean,
  showProgressCard: boolean,
  showXpRankOnHome: boolean
}
```

## Redesign Scope

Full visual replacement in later phases:

- Home screen application shell and today habit dashboard.
- Habit cards.
- Progress dashboard.
- Analytics page.
- Rank page.
- Badge displays and reward modals.
- Onboarding visual branding.
- Bottom navigation.

Partial visual replacement:

- Add/Edit habit forms.
- Habit Detail calendar and stats hierarchy.
- Settings and preference sub-pages.
- Reorder Habits screen.
- Notification preferences.
- Empty states.
- Legal pages.

Minor cleanup only:

- Storage helpers.
- Habit statistics utilities.
- Notification scheduling utilities.
- Existing data normalisation.
- Existing route names.

No change in Phase 1:

- Persisted data structures.
- AsyncStorage keys.
- Navigation architecture.
- Reward, analytics, streak, notification, import/export, and demo-data logic.

## Phase 1 Foundation

New design foundation files:

- `src/design/colors.js`
- `src/design/spacing.js`
- `src/design/typography.js`
- `src/design/radius.js`
- `src/design/shadows.js`
- `src/design/motion.js`
- `src/design/layout.js`
- `src/design/legacyThemeAdapter.js`
- `src/design/index.js`

New UI primitives:

- `components/ui/ScreenContainer.js`
- `components/ui/AppText.js`
- `components/ui/AppHeader.js`
- `components/ui/SectionHeader.js`
- `components/ui/Surface.js`
- `components/ui/Divider.js`
- `components/ui/PrimaryButton.js`
- `components/ui/SecondaryButton.js`
- `components/ui/IconButton.js`
- `components/ui/PressableScale.js`
- `components/ui/index.js`

New brand components:

- `components/brand/MomentumWolfMark.js`
- `components/brand/MomentumWordmark.js`
- `components/brand/MomentumLogo.js`
- `components/brand/index.js`

The wolf mark is a scalable, front-facing, symmetrical, monochrome React Native placeholder built with views and geometric facets. It deliberately avoids emoji, cartoons, raster assets, and new dependencies.

## Compatibility

Current production screens still use the existing `constants/colors.js` and `constants/typography.js` theme system. The new v2 system is additive and isolated under `src/design/` for gradual migration.

`src/design/legacyThemeAdapter.js` maps the v2 dark foundation to the legacy theme token names used by the current app. This is a temporary adapter for later screen-by-screen migration.

Theme fallback behavior:

- Saved theme preferences continue to load from `momentum:theme-preference`.
- Existing valid values remain supported: `light`, `dark`, `system`, `bronze`, `silver`, `gold`, `platinum`, `diamond`, `master`.
- Unsupported values are ignored and the app safely falls back to `dark`.
- New installs now start from `dark` before any saved preference exists.
- Existing user preferences are not overwritten.

## Risks for Later Phases

- `app/index.js` is large and mixes Home layout, habit sorting, completion, reward popup timing, haptics, and gamification state.
- `HabitCard` has gesture-sensitive swipe/tap/long-press behavior. Visual replacement must preserve responder reliability.
- `app/reorder-habits.js` contains custom drag logic that should be tested on a physical phone after any card changes.
- `app/settings.js` combines destructive data operations with layout. Redesign should avoid changing storage flows.
- Gamification recalculation is sensitive to habit history edits, demo import, and perfect-day bonus dates.
- Date handling uses local date keys. Avoid UTC conversions in calendar and streak redesign work.
- Notification IDs are stored on habits. Habit deletion/edit flows must keep cancellation behavior.

## Next Phase

The project is ready for Phase 2: Brand and Application Shell after Phase 1 verification passes.
