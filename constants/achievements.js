// Icon metadata only — glyph choice, not color. Color is tier-driven: callers
// pair `iconName` with getBadgeTierAccent(badge.tier) from progression/BadgeMedal
// so icon-only surfaces (e.g. closest-unlocks rows) agree with the full badge
// art's tier ring instead of keeping a second, independent accent palette.
export const ACHIEVEMENT_ICON_FALLBACK = {
  iconName: "trophy",
};

const GROUP_ICON_META = {
  "Daily volume": {
    iconName: "check",
  },
  "Getting started": {
    iconName: "star",
  },
  Progress: {
    iconName: "progress",
  },
  Ranks: {
    iconName: "trophy",
  },
  "Total completions": {
    iconName: "analytics",
  },
  Consistency: {
    iconName: "flame",
  },
};

export const ACHIEVEMENT_ICON_MAP = {
  "first-habit-created": GROUP_ICON_META["Getting started"],
  "first-completion": {
    iconName: "check",
  },
  "first-perfect-day": {
    iconName: "star",
  },
  "three-day-streak": GROUP_ICON_META.Consistency,
  "seven-day-streak": GROUP_ICON_META.Consistency,
  "fourteen-day-streak": GROUP_ICON_META.Consistency,
  "thirty-day-streak": GROUP_ICON_META.Consistency,
  "sixty-day-streak": GROUP_ICON_META.Consistency,
  "one-hundred-day-streak": GROUP_ICON_META.Consistency,
  "three-habits-one-day": GROUP_ICON_META["Daily volume"],
  "five-habits-one-day": GROUP_ICON_META["Daily volume"],
  "ten-habits-one-day": GROUP_ICON_META["Daily volume"],
  "ten-total-completions": GROUP_ICON_META["Total completions"],
  "fifty-total-completions": GROUP_ICON_META["Total completions"],
  "one-hundred-total-completions": GROUP_ICON_META["Total completions"],
  "two-fifty-total-completions": GROUP_ICON_META["Total completions"],
  "five-hundred-total-completions": GROUP_ICON_META["Total completions"],
  "reach-level-five": GROUP_ICON_META.Progress,
  "reach-level-ten": GROUP_ICON_META.Progress,
  "reach-level-twenty-five": GROUP_ICON_META.Progress,
  "reach-level-forty": GROUP_ICON_META.Progress,
  "unlock-silver": GROUP_ICON_META.Ranks,
  "unlock-gold": GROUP_ICON_META.Ranks,
  "unlock-platinum": GROUP_ICON_META.Ranks,
  "unlock-diamond": GROUP_ICON_META.Ranks,
  "unlock-master": GROUP_ICON_META.Ranks,
};

export function getAchievementIconMeta(achievementId) {
  return ACHIEVEMENT_ICON_MAP[achievementId] || ACHIEVEMENT_ICON_FALLBACK;
}

export function getRecentAchievementIconName(type) {
  if (type === "badge") {
    return "trophy";
  }

  if (type === "perfect-day") {
    return "star";
  }

  if (type === "theme") {
    return "rank";
  }

  if (type === "level") {
    return "progress";
  }

  return "analytics";
}
