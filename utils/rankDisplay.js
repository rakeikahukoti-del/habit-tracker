export const ACTIVE_RANK_LABELS = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Master",
];

export function getVisibleRank(rank) {
  return rank === "Diamond" ? "Platinum" : rank || "Bronze";
}

export function getVisibleRankMilestones(rankMilestones = []) {
  return rankMilestones.filter((rank) =>
    ACTIVE_RANK_LABELS.includes(rank?.label)
  );
}

export function getNextVisibleRankMilestone(levelInfo, rankMilestones = []) {
  const safeLevel = Number.isFinite(levelInfo?.level) ? levelInfo.level : 1;

  return getVisibleRankMilestones(rankMilestones).find(
    (rank) => rank.unlockLevel > safeLevel
  );
}
