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

The active visual rank order is Bronze, Silver, Gold, Platinum, Master. The
underlying legacy rank logic still recognises Diamond for compatibility, but
Diamond is displayed with the Platinum visual and is not shown as an active
rank-path step.

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
- Use `BrandLogo` for in-app logo rendering.

## Achievement Protection

Achievements are a separate visual system. Do not replace achievement badges
with rank badges or change achievement identifiers from this asset map.

## Functional Icons

Use the existing outline icon system for navigation, settings, actions,
analytics, calendars, and form controls. Do not replace functional UI icons with
raster logo or rank images.

## Removed Legacy Assets

Legacy root app icons, generated logo variants, generated transparent wolf
exports, generated adaptive/splash helper files, and generated Diamond/locked
rank placeholders were removed after the supplied assets were integrated.

Momentum remains a Light/Dark-only app. Rank badge colours are rewards, not app
themes.
