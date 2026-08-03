import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  badges,
  getGamification,
  getGamificationLevelInfo,
  getRankForLevel,
  rankMilestones,
} from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import {
  getAchievementSnapshot,
  getAchievementSummary,
  getClosestAchievements,
} from "../utils/achievementProgress";
import { sortBadgesByTier } from "../utils/gamification";
import { getNextRankMilestone } from "../utils/progressionMilestones";
import {
  getNextVisibleRankMilestone,
  getVisibleRank,
  getVisibleRankMilestones,
} from "../utils/rankDisplay";

export function useRankController() {
  const [gamification, setGamification] = useState(null);
  const [habits, setHabits] = useState([]);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [badgeSortDirection, setBadgeSortDirection] = useState("asc");
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadRequest, setReloadRequest] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadRank() {
        try {
          setLoading(true);
          setError("");
          const [storedGamification, storedHabits] = await Promise.all([
            getGamification(),
            getHabits(),
          ]);

          if (!isActive) {
            return;
          }

          setGamification(storedGamification);
          setHabits(storedHabits);
        } catch {
          if (isActive) {
            setError("Could not load progression. Try again.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadRank();

      return () => {
        isActive = false;
      };
    }, [reloadRequest])
  );

  const levelInfo = useMemo(
    () => getGamificationLevelInfo(gamification),
    [gamification]
  );
  const calculatedRank = useMemo(
    () => getRankForLevel(levelInfo.level),
    [levelInfo.level]
  );
  const rank = useMemo(() => getVisibleRank(calculatedRank), [calculatedRank]);
  const visibleRankMilestones = useMemo(
    () => getVisibleRankMilestones(rankMilestones),
    []
  );
  const nextRank = useMemo(
    () => getNextVisibleRankMilestone(levelInfo, rankMilestones),
    [levelInfo]
  );
  const nextMilestone = useMemo(
    () => getNextRankMilestone(levelInfo, rankMilestones),
    [levelInfo]
  );
  const earnedBadgeIds = useMemo(
    () => new Set(gamification?.earnedBadges || []),
    [gamification]
  );
  const earnedBadges = useMemo(
    () => badges.filter((badge) => earnedBadgeIds.has(badge.id)),
    [earnedBadgeIds]
  );
  const sortedBadges = useMemo(
    () => sortBadgesByTier(badges, badgeSortDirection),
    [badgeSortDirection]
  );
  const badgePreview = useMemo(
    () => (showAllBadges ? sortedBadges : sortedBadges.slice(0, 8)),
    [showAllBadges, sortedBadges]
  );
  const progressionSnapshot = useMemo(
    () => getAchievementSnapshot({ gamification, habits, level: levelInfo.level }),
    [gamification, habits, levelInfo.level]
  );
  const achievementSummary = useMemo(
    () =>
      getAchievementSummary({
        badges,
        earnedBadgeIds,
        recentAchievements: gamification?.recentAchievements,
        snapshot: progressionSnapshot,
      }),
    [earnedBadgeIds, gamification, progressionSnapshot]
  );
  const closestBadges = useMemo(
    () =>
      getClosestAchievements({
        badges,
        earnedBadgeIds,
        limit: 3,
        snapshot: progressionSnapshot,
      }),
    [earnedBadgeIds, progressionSnapshot]
  );

  return {
    achievementSummary,
    badgePreview,
    badgeSortDirection,
    closestBadges,
    earnedBadgeIds,
    earnedBadges,
    error,
    gamification,
    habits,
    levelInfo,
    loading,
    nextMilestone,
    nextRank,
    progressionSnapshot,
    rank,
    selectedAchievement,
    selectedBadge,
    setBadgeSortDirection,
    setReloadRequest,
    setSelectedAchievement,
    setSelectedBadge,
    setShowAllBadges,
    showAllBadges,
    sortedBadges,
    visibleRankMilestones,
  };
}
