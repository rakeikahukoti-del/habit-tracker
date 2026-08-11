export const BRAND_ASSETS = {
  logoDark: require("../assets/branding/momentum-logo-dark.png"),
  logoLight: require("../assets/branding/momentum-logo-light.png"),
};

export function getBrandLogoAsset(resolvedTheme) {
  return resolvedTheme === "light"
    ? BRAND_ASSETS.logoLight
    : BRAND_ASSETS.logoDark;
}

export const RANK_BADGE_ASSETS = {
  bronze: require("../assets/ranks/bronze.png"),
  gold: require("../assets/ranks/gold.png"),
  master: require("../assets/ranks/master.png"),
  platinum: require("../assets/ranks/platinum.png"),
  silver: require("../assets/ranks/silver.png"),
};

export const SUPPLIED_RANK_ASSET_ORDER = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Master",
];

export function getRankBadgeAsset(rank) {
  const key = typeof rank === "string" ? rank.toLowerCase() : "bronze";
  const compatibleKey = key === "diamond" ? "platinum" : key;

  return RANK_BADGE_ASSETS[compatibleKey] || RANK_BADGE_ASSETS.bronze;
}

// Achievement badges are code-drawn (components/progression/BadgeFrame.js)
// as of Phase 8 - no raster asset lookup needed. See git history for the
// removed ACHIEVEMENT_BADGE_ASSETS map and assets/achievements/*.png.
