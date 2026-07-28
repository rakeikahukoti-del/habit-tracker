import { XP_PER_LEVEL } from "./gamification";

export function getNextRankMilestone(levelInfo, rankMilestones) {
  const safeLevel = Number.isFinite(levelInfo?.level) ? levelInfo.level : 1;
  const currentLevelXp = Number.isFinite(levelInfo?.currentLevelXp)
    ? levelInfo.currentLevelXp
    : 0;
  const nextRank = Array.isArray(rankMilestones)
    ? rankMilestones.find((rank) => rank.unlockLevel > safeLevel)
    : null;

  if (!nextRank) {
    return null;
  }

  const levelsRemaining = nextRank.unlockLevel - safeLevel;
  const xpRemaining =
    Math.max(0, levelsRemaining - 1) * XP_PER_LEVEL +
    Math.max(0, XP_PER_LEVEL - currentLevelXp);

  return {
    label: nextRank.label,
    level: nextRank.unlockLevel,
    text: `${xpRemaining} XP to ${nextRank.label}`,
    type: "rank",
    xpRemaining,
  };
}
