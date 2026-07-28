export const BRAND_ASSETS = {
  appIconDark: require("../assets/branding/app-icon-dark.png"),
  appIconLight: require("../assets/branding/app-icon-light.png"),
  adaptiveForeground: require("../assets/branding/adaptive-foreground.png"),
  splashLogo: require("../assets/branding/splash-logo.png"),
  wolfBlack: require("../assets/branding/wolf-black.png"),
  wolfBlackTransparent: require("../assets/branding/wolf-black-transparent.png"),
  wolfWhite: require("../assets/branding/wolf-white.png"),
  wolfWhiteTransparent: require("../assets/branding/wolf-white-transparent.png"),
};

export const LOGO_LOCKUP_ASSETS = {
  horizontalDark: require("../assets/branding/lockups/horizontal-dark.png"),
  horizontalLight: require("../assets/branding/lockups/horizontal-light.png"),
  stackedDark: require("../assets/branding/lockups/stacked-dark.png"),
  stackedLight: require("../assets/branding/lockups/stacked-light.png"),
};

export const RANK_BADGE_ASSETS = {
  bronze: require("../assets/ranks/bronze.png"),
  diamond: require("../assets/ranks/diamond.png"),
  gold: require("../assets/ranks/gold.png"),
  locked: require("../assets/ranks/locked.png"),
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

export const ACHIEVEMENT_BADGE_ASSETS = {
  "fifty-total-completions": require("../assets/achievements/fifty-total-completions.png"),
  "first-completion": require("../assets/achievements/first-completion.png"),
  "first-habit-created": require("../assets/achievements/first-habit-created.png"),
  "first-perfect-day": require("../assets/achievements/first-perfect-day.png"),
  "five-habits-one-day": require("../assets/achievements/five-habits-one-day.png"),
  "five-hundred-total-completions": require("../assets/achievements/five-hundred-total-completions.png"),
  "fourteen-day-streak": require("../assets/achievements/fourteen-day-streak.png"),
  "one-hundred-day-streak": require("../assets/achievements/one-hundred-day-streak.png"),
  "one-hundred-total-completions": require("../assets/achievements/one-hundred-total-completions.png"),
  "reach-level-five": require("../assets/achievements/reach-level-five.png"),
  "reach-level-forty": require("../assets/achievements/reach-level-forty.png"),
  "reach-level-ten": require("../assets/achievements/reach-level-ten.png"),
  "reach-level-twenty-five": require("../assets/achievements/reach-level-twenty-five.png"),
  "seven-day-streak": require("../assets/achievements/seven-day-streak.png"),
  "sixty-day-streak": require("../assets/achievements/sixty-day-streak.png"),
  "ten-habits-one-day": require("../assets/achievements/ten-habits-one-day.png"),
  "ten-total-completions": require("../assets/achievements/ten-total-completions.png"),
  "thirty-day-streak": require("../assets/achievements/thirty-day-streak.png"),
  "three-day-streak": require("../assets/achievements/three-day-streak.png"),
  "three-habits-one-day": require("../assets/achievements/three-habits-one-day.png"),
  "two-fifty-total-completions": require("../assets/achievements/two-fifty-total-completions.png"),
  "unlock-diamond": require("../assets/achievements/unlock-diamond.png"),
  "unlock-gold": require("../assets/achievements/unlock-gold.png"),
  "unlock-master": require("../assets/achievements/unlock-master.png"),
  "unlock-platinum": require("../assets/achievements/unlock-platinum.png"),
  "unlock-silver": require("../assets/achievements/unlock-silver.png"),
};

export function getRankBadgeAsset(rank) {
  const key = typeof rank === "string" ? rank.toLowerCase() : "bronze";

  return RANK_BADGE_ASSETS[key] || RANK_BADGE_ASSETS.bronze;
}

export function getAchievementBadgeAsset(badgeId) {
  return ACHIEVEMENT_BADGE_ASSETS[badgeId] || null;
}

export const brandAssets = BRAND_ASSETS;
export const logoLockupAssets = LOGO_LOCKUP_ASSETS;
export const rankBadgeAssets = RANK_BADGE_ASSETS;
export const achievementBadgeAssets = ACHIEVEMENT_BADGE_ASSETS;
