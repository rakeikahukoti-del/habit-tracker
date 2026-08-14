export const BRAND_ASSETS = {
  logoDark: require("../assets/branding/momentum-logo-dark.png"),
  logoLight: require("../assets/branding/momentum-logo-light.png"),
};

export function getBrandLogoAsset(resolvedTheme) {
  return resolvedTheme === "light"
    ? BRAND_ASSETS.logoLight
    : BRAND_ASSETS.logoDark;
}

// Achievement badges are code-drawn (components/progression/BadgeFrame.js)
// as of Phase 8, and rank medals are code-drawn
// (components/rank/RankMedalFrame.js) as of Phase 9 - no raster asset
// lookup needed for either. See git history for the removed
// ACHIEVEMENT_BADGE_ASSETS/RANK_BADGE_ASSETS maps and
// assets/achievements/*.png / assets/ranks/*.png.
