import { getBestStreak, getCurrentStreak } from "./habitStats";

export const ACHIEVEMENT_PROGRESS_TARGETS = {
  "first-habit-created": ["hasHabit", 1],
  "first-completion": ["hasCompletion", 1],
  "first-perfect-day": ["perfectDays", 1],
  "three-day-streak": ["longestStreak", 3],
  "seven-day-streak": ["longestStreak", 7],
  "fourteen-day-streak": ["longestStreak", 14],
  "thirty-day-streak": ["longestStreak", 30],
  "sixty-day-streak": ["longestStreak", 60],
  "one-hundred-day-streak": ["longestStreak", 100],
  "three-habits-one-day": ["highestDailyCompletionCount", 3],
  "five-habits-one-day": ["highestDailyCompletionCount", 5],
  "ten-habits-one-day": ["highestDailyCompletionCount", 10],
  "ten-total-completions": ["completionCount", 10],
  "fifty-total-completions": ["completionCount", 50],
  "one-hundred-total-completions": ["completionCount", 100],
  "two-fifty-total-completions": ["completionCount", 250],
  "five-hundred-total-completions": ["completionCount", 500],
  "reach-level-five": ["level", 5],
  "reach-level-ten": ["level", 10],
  "reach-level-twenty-five": ["level", 25],
  "reach-level-forty": ["level", 40],
  "unlock-silver": ["level", 5],
  "unlock-gold": ["level", 10],
  "unlock-platinum": ["level", 15],
  "unlock-diamond": ["level", 25],
  "unlock-master": ["level", 40],
};

export function getAchievementSnapshot({ gamification, habits, level }) {
  const safeHabits = Array.isArray(habits) ? habits : [];
  const completionCount = safeHabits.reduce(
    (count, habit) => count + getCompletedDates(habit).length,
    0
  );
  const longestStreak = safeHabits.reduce(
    (longest, habit) =>
      Math.max(
        longest,
        getCurrentStreak(getCompletedDates(habit), habit),
        getBestStreak(getCompletedDates(habit), habit)
      ),
    0
  );

  return {
    completionCount,
    hasCompletion: completionCount > 0 ? 1 : 0,
    hasHabit: safeHabits.length > 0 ? 1 : 0,
    highestDailyCompletionCount: getHighestDailyCompletionCount(safeHabits),
    level: Number.isFinite(level) ? level : 1,
    longestStreak,
    perfectDays: Array.isArray(gamification?.perfectDayBonusDates)
      ? gamification.perfectDayBonusDates.length
      : 0,
  };
}

export function getAchievementProgress(badge, snapshot, earned = false) {
  const target = ACHIEVEMENT_PROGRESS_TARGETS[badge?.id];

  if (!target) {
    return createProgress(0, 0, { complete: Boolean(earned), measurable: false });
  }

  const [metricKey, max] = target;
  const rawValue = earned ? max : snapshot?.[metricKey];

  return createProgress(rawValue, max, { complete: Boolean(earned) });
}

export function createProgress(value, max, options = {}) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  const measurable = options.measurable ?? safeMax > 0;
  const clampedValue = safeMax > 0 ? Math.min(safeValue, safeMax) : 0;
  const complete = Boolean(options.complete || (safeMax > 0 && clampedValue >= safeMax));
  const percent = safeMax > 0 ? Math.round((clampedValue / safeMax) * 100) : 0;

  return {
    complete,
    max: safeMax,
    measurable,
    percent,
    remaining: safeMax > 0 ? Math.max(0, safeMax - clampedValue) : null,
    value: clampedValue,
  };
}

export function getAchievementProgressLabel(progress, earned = false) {
  if (earned || progress?.complete) {
    return "Unlocked";
  }

  if (!progress?.measurable || !progress.max) {
    return "Locked";
  }

  return `${progress.value} / ${progress.max}`;
}

export function getClosestAchievements({
  badges,
  earnedBadgeIds,
  limit = 3,
  snapshot,
}) {
  const earnedSet = earnedBadgeIds instanceof Set
    ? earnedBadgeIds
    : new Set(Array.isArray(earnedBadgeIds) ? earnedBadgeIds : []);

  return (Array.isArray(badges) ? badges : [])
    .map((badge, index) => ({
      badge,
      index,
      progress: getAchievementProgress(badge, snapshot, earnedSet.has(badge?.id)),
    }))
    .filter((item) => item.badge && !earnedSet.has(item.badge.id))
    .sort((first, second) => {
      if (first.progress.measurable !== second.progress.measurable) {
        return first.progress.measurable ? -1 : 1;
      }

      if (first.progress.percent !== second.progress.percent) {
        return second.progress.percent - first.progress.percent;
      }

      if (first.progress.remaining !== second.progress.remaining) {
        return (first.progress.remaining ?? Number.MAX_SAFE_INTEGER) -
          (second.progress.remaining ?? Number.MAX_SAFE_INTEGER);
      }

      return first.index - second.index;
    })
    .slice(0, Math.max(0, limit));
}

export function getAchievementSummary({
  badges,
  earnedBadgeIds,
  recentAchievements,
  snapshot,
}) {
  const safeBadges = Array.isArray(badges) ? badges : [];
  const earnedSet = earnedBadgeIds instanceof Set
    ? earnedBadgeIds
    : new Set(Array.isArray(earnedBadgeIds) ? earnedBadgeIds : []);
  const earnedCount = safeBadges.filter((badge) => earnedSet.has(badge.id)).length;
  const totalCount = safeBadges.length;
  const closest = getClosestAchievements({
    badges: safeBadges,
    earnedBadgeIds: earnedSet,
    limit: 1,
    snapshot,
  })[0] || null;

  return {
    closest,
    earnedCount,
    percent: totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0,
    recentUnlock: getMostRecentAchievement(recentAchievements),
    totalCount,
  };
}

export function getAchievementUnlockDate(badgeId, recentAchievements) {
  const achievement = (Array.isArray(recentAchievements) ? recentAchievements : [])
    .find((item) => item?.badgeId === badgeId);

  return achievement?.unlockedAt || null;
}

export function getHighestDailyCompletionCount(habits) {
  const counts = {};

  (Array.isArray(habits) ? habits : []).forEach((habit) => {
    getCompletedDates(habit).forEach((dateKey) => {
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
  });

  return Math.max(0, ...Object.values(counts));
}

function getCompletedDates(habit) {
  return Array.isArray(habit?.completedDates)
    ? Array.from(new Set(habit.completedDates.filter((dateKey) =>
        typeof dateKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
      )))
    : [];
}

function getMostRecentAchievement(recentAchievements) {
  return (Array.isArray(recentAchievements) ? recentAchievements : [])
    .filter((achievement) => achievement?.unlockedAt)
    .sort((first, second) => {
      const firstTime = new Date(first.unlockedAt).getTime();
      const secondTime = new Date(second.unlockedAt).getTime();

      return (Number.isFinite(secondTime) ? secondTime : 0) -
        (Number.isFinite(firstTime) ? firstTime : 0);
    })[0] || null;
}
