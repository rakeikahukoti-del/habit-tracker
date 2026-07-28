# Momentum Assets

## App Icons

- Dark icon: `assets/branding/app-icon-dark.png`
- Light icon: `assets/branding/app-icon-light.png`

The dark icon is the primary Expo app icon. The light icon is reserved for
light-surface in-app branding.

## Rank Badges

- Bronze: `assets/ranks/bronze.png`
- Silver: `assets/ranks/silver.png`
- Gold: `assets/ranks/gold.png`
- Platinum: `assets/ranks/platinum.png`
- Master: `assets/ranks/master.png`

The app also keeps the existing Diamond fallback asset because the current rank
logic still includes Diamond. Do not change rank thresholds or persisted rank
names when updating assets.

Recommended `RankBadge` sizes:

- `24` or `32`: compact summaries
- `48` or `64`: rank rows and cards
- `96` or `128`: hero rank displays and reward moments

Locked ranks are rendered with restrained opacity at runtime. Do not create
separate recoloured locked assets.

## Logo Usage

- Use the dark logo on dark surfaces.
- Use the light logo on light surfaces.
- Do not tint the logo.
- Do not use rank colours as app-wide themes.

## Achievement Protection

Achievements are a separate visual system. Do not replace achievement badges
with rank badges or change achievement identifiers from this asset map.
