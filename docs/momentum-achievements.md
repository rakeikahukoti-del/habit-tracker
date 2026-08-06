# Momentum Achievements

Momentum treats achievements as collectible progress markers layered on top of habit history. The achievement system must stay separate from rank medal artwork, logo assets, routes, storage keys, XP rules, and reward queue ordering.

## Data Sources

Achievement progress is derived from existing local data only:

- `habits[].completedDates`
- current XP level
- `gamification.earnedBadges`
- `gamification.perfectDayBonusDates`
- `gamification.recentAchievements`

No additional storage keys are required for achievement progress.

## XP Flow

Habit completion uses the existing shared completion action and gamification
storage orchestrator:

1. The habit completion is saved.
2. `awardHabitCompletion` calculates the existing completion and perfect-day XP.
3. `calculateAwardState` derives level, rank, achievement, and message changes.
4. The normalized gamification state is saved once.
5. Home updates its visible XP feedback immediately, then clears consumed
   presentation messages.

XP values, level thresholds, rank thresholds, and perfect-day rules live in
`utils/gamification.js`. Presentation code must not duplicate those formulas.

## Reward Queue

`utils/homeHabitActions.js` normalizes pending reward messages and defines the
presentation order:

1. Habit completion
2. Perfect day
3. Level up
4. Achievement unlocks
5. Informational celebration copy

Only one reward surface is active at a time. Achievement unlocks are retained
as an ordered local queue, duplicate badge IDs are removed, and the dismissal
timer starts only when the achievement is visible. Legacy level-up and
perfect-day text messages are normalized into the same presentation types.

Reward presentation is informational. It does not recalculate XP, badges,
streaks, ranks, or analytics.

## Rank Progression

`utils/gamification.js` owns level and rank calculations.
`utils/progressionMilestones.js` and `utils/rankDisplay.js` format the next
visible milestone without changing thresholds. `LevelProgress` displays total
XP, progress within the current level, and XP remaining to the next level.

The Rank screen derives its hero, rank path, closest achievements, catalogue,
and recent history from one loaded gamification state and the current habit
list. None of these views are stored separately.

## Progress Rules

Progress lives in `utils/achievementProgress.js`.

The helper exposes deterministic pure functions for:

- building a progress snapshot from habits and gamification state
- calculating progress for a single badge
- selecting the closest locked achievements
- summarising earned versus total achievements
- resolving unlock dates from recent achievements

Progress values are clamped, zero-target achievements are handled safely, unlocked achievements report a completed state, and closest achievement ordering is stable.

## Icon Mapping

Achievement icon metadata lives in `constants/achievements.js`.

This map intentionally uses lightweight icon metadata only:

- `iconName`

Color is not part of this map. Icon-only surfaces (e.g. closest-unlocks rows
in `AchievementsSection`) pair `iconName` with
`getBadgeTierAccent(badge.tier)` from `components/progression/BadgeMedal.js`
so their color agrees with the tier ring on the full badge art. Badge art
(`assets/achievements/*.png`) bakes in its own accent color per asset and is
not a reliable source of tier color — `BadgeMedal`'s `tierStyles`, keyed off
the badge's actual `tier` field in `utils/gamification.js`, is the single
source of truth.

It must not import:

- rank medal assets
- wolf/logo assets
- `RankBadge`
- branding image files

Collectible badge art lives in `assets/achievements` and is mapped by stable
achievement ID in `constants/assets.js`.

## UI Pattern

The Rank screen presents achievements with:

- a compact earned/total summary
- closest locked achievements
- a sortable achievement catalogue
- badge detail modals with requirement, progress, rarity, tier, and unlock state
- recent achievement detail modals

Badge previews should remain compact by default with a clear show-all control.

## Accessibility

Achievement cards and rows should expose:

- the achievement name
- whether it is unlocked or locked
- current measurable progress when locked
- a clear button role

Locked achievements should be muted but readable in every theme.

Home announces each active reward with the earned XP, streak, level, rank, or
achievement description as applicable. These announcements use the same queue
order as the visual reward surfaces. Progress bars include a complete text
equivalent with current XP and XP remaining.

The device reduced-motion setting disables confetti, modal fades, and achievement
expand/collapse animation while preserving all text and reward state.

## Shared Helpers

- `utils/gamification.js`: deterministic XP, level, badge, and achievement logic
- `storage/gamificationStorage.js`: persistence orchestration and message
  consumption
- `utils/homeHabitActions.js`: Home summaries and reward presentation ordering
- `utils/achievementProgress.js`: measurable achievement progress
- `utils/progressionMilestones.js`: next rank milestone formatting
- `utils/rankDisplay.js`: visible rank compatibility
- `components/progression/LevelProgress.js`: accessible progress presentation

## Asset Maintenance

New or replacement achievement art must keep the existing achievement IDs,
remain under `assets/achievements`, and stay separate from rank assets. Update
`ACHIEVEMENT_BADGE_ASSETS`, then run `npm test`, `git diff --check`, and
`npx expo export`.
