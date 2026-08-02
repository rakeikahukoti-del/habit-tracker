# Momentum Assets

## App Icons

- Dark icon: `assets/branding/app-icon-dark.png`

The icon is referenced by the Expo launcher, splash, and Android adaptive-icon
configuration. Native branding remains separate from runtime theme-aware logos.

## Runtime Logo

- Light Mode: `assets/branding/momentum-logo-light.png` contains the black wolf.
- Dark Mode: `assets/branding/momentum-logo-dark.png` contains the white wolf.

Both runtime files are unchanged 1024 x 1024 RGBA copies of the supplied
artwork. They contain real transparent pixels and are rendered with `contain`
resizing.

`components/BrandLogo.js` reads the already-resolved theme from
`ThemeContext` and selects the matching static asset through
`getBrandLogoAsset`. It performs no storage reads and updates automatically
when the resolved theme changes. The component reserves its requested square
size while the persisted theme is loading so the wrong logo cannot flash.

Current runtime placements are the loading shell, onboarding, the Home header,
and the Home empty state. Repeated marks next to visible Momentum branding are
decorative for screen readers.

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

- Use the white `logoDark` artwork on dark surfaces.
- Use the black `logoLight` artwork on light surfaces.
- Do not tint the logo.
- Do not use rank colours as app-wide themes.
- Use `BrandLogo` for in-app logo rendering.
- Do not use the transparent runtime logos as launcher or notification icons.

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
rank placeholders were removed after the supplied assets were integrated. The
unused light launcher-icon variant was removed during the V1 closeout; Light
Mode continues to use the transparent black runtime logo.

Momentum remains a Light/Dark-only app. Rank badge colours are rewards, not app
themes.
