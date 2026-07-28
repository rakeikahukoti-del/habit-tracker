# Momentum Asset System

Momentum uses a restrained black-and-white wolf mark for brand identity and
separate visual systems for ranks and achievements.

## Logo

- Use the white wolf on dark surfaces and the black wolf on light surfaces.
- The wolf artwork may only use black, white, and transparency.
- Do not place rank colours, achievement colours, or text inside the wolf mark.
- Use the standalone wolf for compact branding, onboarding, about, launch, and
  intentional empty states.
- Avoid repeating the wolf on every screen.

## Logo Files

- `assets/branding/app-icon-dark.png`
- `assets/branding/app-icon-light.png`
- `assets/branding/wolf-white.png`
- `assets/branding/wolf-black.png`
- `assets/branding/wolf-white-transparent.png`
- `assets/branding/wolf-black-transparent.png`
- `assets/branding/adaptive-foreground.png`
- `assets/branding/splash-logo.png`

## Lockups

Use lockups only where there is enough room for the wordmark to breathe.

- `assets/branding/lockups/horizontal-dark.png`
- `assets/branding/lockups/horizontal-light.png`
- `assets/branding/lockups/stacked-dark.png`
- `assets/branding/lockups/stacked-light.png`

## Rank Badges

Rank badges are separate from the wolf logo. They use a geometric badge shape
with a central star so rank progression stays visually distinct from brand
identity.

- Bronze: warm bronze foundation.
- Silver: cool silver consistency.
- Gold: antique gold achievement.
- Platinum: controlled purple advanced mastery.
- Diamond: muted cyan high mastery.
- Master: deep red peak achievement.

Files live in `assets/ranks/` and are referenced through
`constants/assets.js`. Do not change rank names or thresholds when updating
these files.

## Achievement Badges

Achievement badges live in `assets/achievements/` and use stable filenames that
match internal badge identifiers. They may use colour, but should remain flat,
dark, geometric, and readable at small sizes.

Rank badges and achievement badges should not be interchangeable.

## Colour Rules

- Brand surfaces use near-black, charcoal, off-white, and neutral slate tones.
- Accent colours are used sparingly for state, progress, warnings, and rewards.
- Green is allowed for success states only, not as a brand colour.
- Avoid neon, glossy, overly saturated, or decorative colour treatments.

## Accessibility

- Every meaningful logo, rank badge, and achievement badge needs a descriptive
  accessibility label.
- Decorative logo uses should be hidden from screen readers when adjacent text
  already says Momentum.
- Do not rely on colour alone for rank, locked, selected, or earned states.
