# Momentum First Use

Momentum's first-use experience should explain the product loop quickly:

1. Create one habit.
2. Complete scheduled habits.
3. Build streaks.
4. Review progress.
5. Earn XP, achievements, and ranks through consistency.

The flow should stay calm, short, and practical.

## Onboarding

The onboarding screen uses `/Users/rakeipaul/Documents/Codex/2026-05-31/build-a-fully-functional-mobile-habit/components/BrandLogo.js` with the supplied wolf asset. The logo is decorative because nearby text already names Momentum.

Onboarding copy should stay focused on:

- Home for today's habits
- Progress for trends and weekly context
- XP/ranks as a lightweight reward layer
- local-first use

Onboarding persistence uses:

- `momentum:onboarding-complete`

## First Habit Transition

After saving the first habit, the user returns to Home. The new habit appears immediately through the existing Home refresh flow. The Add Habit screen keeps required fields obvious and leaves optional reminder settings empty until the user chooses them.

## First Swipe Hint

The first-swipe hint is a small, dismissible Home card. It is not a modal and does not block interaction.

It appears only when:

- onboarding is complete
- at least one habit exists
- swipe completion is enabled
- at least one scheduled habit is actionable today
- no habit has been completed yet
- the hint has not been dismissed

It disappears permanently when:

- the user taps the hint
- the user completes the first habit

Preference key:

- `momentum:first-swipe-hint-dismissed`

The hint explains swipe right to complete. Undo guidance is left out until undo is relevant.

## First Completion

The first completion uses the existing completion reward flow:

- the habit updates immediately
- XP is recalculated through existing reward logic
- reward popups remain queued and deduplicated
- the first-swipe hint is dismissed

The wolf logo is not used as a reward icon. Rank badges appear only when rank progression actually applies.

## First Day

Perfect-day behavior is unchanged. When all scheduled habits are complete, Home uses restrained completion copy such as "Today is complete" and the existing perfect-day reward queue.

## First Week

Analytics and Progress should avoid empty charts before enough data exists. Sparse states should explain what is available now and what will become useful later.

The first-week message helper lives in:

- `/Users/rakeipaul/Documents/Codex/2026-05-31/build-a-fully-functional-mobile-habit/utils/firstUseExperience.js`

It reuses existing analytics readiness concepts and does not invent trends.

## Accessibility

First-use guidance should:

- use clear button labels
- avoid relying on animation alone
- keep guidance dismissible
- keep content scrollable on short screens
- hide decorative logo artwork from screen readers when adjacent text names Momentum
- keep touch targets at practical mobile sizes

## Brand Roles

Use assets by role:

- `BrandLogo`: Momentum branding
- `RankBadge` / rank medal components: rank progression
- achievement-specific assets/icons: achievements
- outline icons: controls and navigation

Do not use the wolf logo as a reward icon.
