import { XP_PER_LEVEL } from "./gamification";
import { getVisibleRankMilestones } from "./rankDisplay";

export function getNextRankMilestone(levelInfo, rankMilestones) {
  const safeLevel = Number.isFinite(levelInfo?.level) ? levelInfo.level : 1;
  const currentLevelXp = Number.isFinite(levelInfo?.currentLevelXp)
    ? levelInfo.currentLevelXp
    : 0;
  const visibleRankMilestones = getVisibleRankMilestones(rankMilestones);
  const nextRank = visibleRankMilestones.find(
    (rank) => rank.unlockLevel > safeLevel
  );

  if (!nextRank) {
    const finalRank = visibleRankMilestones[visibleRankMilestones.length - 1];

    return {
      label: finalRank?.label || "Master",
      level: finalRank?.unlockLevel || safeLevel,
      text: "Maximum rank reached",
      type: "complete",
      xpRemaining: 0,
    };
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
