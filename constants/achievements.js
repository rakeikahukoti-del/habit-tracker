export const ACHIEVEMENT_ICON_FALLBACK = {
  accent: "#64748B",
  iconName: "trophy",
};

const GROUP_ICON_META = {
  "Daily volume": {
    accent: "#7EA1B8",
    iconName: "check",
  },
  "Getting started": {
    accent: "#A58E73",
    iconName: "star",
  },
  Progress: {
    accent: "#8A7AC8",
    iconName: "progress",
  },
  Ranks: {
    accent: "#C0A46D",
    iconName: "trophy",
  },
  "Total completions": {
    accent: "#789F8A",
    iconName: "analytics",
  },
  Consistency: {
    accent: "#B06B5E",
    iconName: "flame",
  },
};

export const ACHIEVEMENT_ICON_MAP = {
  "first-habit-created": GROUP_ICON_META["Getting started"],
  "first-completion": {
    accent: "#789F8A",
    iconName: "check",
  },
  "first-perfect-day": {
    accent: "#C0A46D",
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
