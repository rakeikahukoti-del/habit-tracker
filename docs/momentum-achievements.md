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

## Progress Rules

Progress lives in `/Users/rakeipaul/Documents/Codex/2026-05-31/build-a-fully-functional-mobile-habit/utils/achievementProgress.js`.

The helper exposes deterministic pure functions for:

- building a progress snapshot from habits and gamification state
- calculating progress for a single badge
- selecting the closest locked achievements
- summarising earned versus total achievements
- resolving unlock dates from recent achievements

Progress values are clamped, zero-target achievements are handled safely, unlocked achievements report a completed state, and closest achievement ordering is stable.

## Icon Mapping

Achievement icon metadata lives in `/Users/rakeipaul/Documents/Codex/2026-05-31/build-a-fully-functional-mobile-habit/constants/achievements.js`.

This map intentionally uses lightweight icon metadata only:

- `iconName`
- `accent`

It must not import:

- rank medal assets
- wolf/logo assets
- `RankBadge`
- branding image files

The current collectible badge art remains in `/Users/rakeipaul/Documents/Codex/2026-05-31/build-a-fully-functional-mobile-habit/assets/achievements` until final standalone achievement PNG assets are supplied.

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

## Future Asset Integration

When final achievement PNG assets are provided:

1. Add them under `assets/achievements`.
2. Update `ACHIEVEMENT_BADGE_ASSETS` in `constants/assets.js`.
3. Keep achievement assets separate from rank assets.
4. Run `npm test`, `git diff --check`, and `npx expo export`.
