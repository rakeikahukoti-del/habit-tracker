import {
  getCurrentStreak,
  getBestStreak,
  isHabitScheduledOnDate,
  toDateKey,
} from "./habitStats";
import { getMonthActivitySummary } from "./activityHistory";
import { getGamificationLevelInfo, getRankForLevel, XP_PER_LEVEL } from "./gamification";

const MONTH_COUNT = 12;
const COMPLETION_XP = 10;
const PERFECT_DAY_XP = 25;

export function getYearInReview(
  habits,
  gamification = null,
  year = new Date().getFullYear(),
  now = new Date()
) {
  const selectedYear = normalizeYear(year, now);
  const safeHabits = getSafeHabits(habits);
  const yearStartKey = `${selectedYear}-01-01`;
  const yearEndKey = `${selectedYear}-12-31`;
  const todayKey = toDateKey(now);
  const maxDateKey =
    selectedYear === now.getFullYear() ? todayKey : yearEndKey;
  const completionEvents = getCompletionEvents(safeHabits, selectedYear, maxDateKey);
  const activeDayKeys = Array.from(
    new Set(completionEvents.map((event) => event.dateKey))
  ).sort();
  const monthlyBreakdown = getMonthlyBreakdown(
    safeHabits,
    selectedYear,
    now,
    maxDateKey
  );
  const habitSummaries = getHabitSummaries(
    safeHabits,
    selectedYear,
    yearStartKey,
    maxDateKey
  );
  const bestMonth = getBestMonth(monthlyBreakdown);
  const mostConsistentMonth = getMostConsistentMonth(monthlyBreakdown);
  const strongestHabit = getStrongestHabit(habitSummaries);
  const mostCompletedHabit = getMostCompletedHabit(habitSummaries);
  const longestStreak = habitSummaries.reduce(
    (best, habit) => Math.max(best, habit.bestStreak),
    0
  );
  const currentStreak = safeHabits.reduce(
    (best, habit) =>
      Math.max(best, getCurrentStreak(getSafeDateKeys(habit.completedDates), habit)),
    0
  );
  const perfectDays = monthlyBreakdown.reduce(
    (sum, month) => sum + month.perfectDays,
    0
  );
  const totalCompletions = completionEvents.length;
  const xpEarned = totalCompletions * COMPLETION_XP + perfectDays * PERFECT_DAY_XP;
  const levelInfo = getGamificationLevelInfo(gamification);
  const currentRank = getRankForLevel(levelInfo.level);
  const achievements = getAchievementsInYear(gamification, selectedYear, maxDateKey);
  const milestones = getMilestones({
    achievements,
    activeDayKeys,
    bestMonth,
    completionEvents,
    habitSummaries,
    longestStreak,
    monthlyBreakdown,
    mostCompletedHabit,
    selectedYear,
    strongestHabit,
  });
  const reflections = getReflectionCards({
    activeDays: activeDayKeys.length,
    bestMonth,
    longestStreak,
    mostCompletedHabit,
    mostConsistentMonth,
    selectedYear,
    totalCompletions,
  });
  const summaryCard = {
    activeDays: activeDayKeys.length,
    bestMonth: bestMonth?.label || "",
    currentRank,
    longestStreak,
    totalCompletions,
    year: selectedYear,
  };

  return {
    achievementCount: achievements.length,
    activeDays: activeDayKeys.length,
    availableMetricCount: getAvailableMetricCount({
      activeDays: activeDayKeys.length,
      bestMonth,
      longestStreak,
      mostCompletedHabit,
      totalCompletions,
    }),
    bestMonth,
    currentRank,
    currentStreak,
    hasData: totalCompletions > 0,
    level: levelInfo.level,
    longestStreak,
    milestones,
    monthlyBreakdown,
    mostCompletedHabit,
    mostConsistentMonth,
    reflections,
    strongestHabit,
    summaryCard,
    timeline: milestones.filter((milestone) => milestone.dateKey),
    totalCompletions,
    totalXpEarned: xpEarned,
    xpProgress: {
      currentLevelXp: levelInfo.currentLevelXp,
      nextLevelXp: levelInfo.nextLevelXp,
      percentToNextLevel: Math.round(
        (levelInfo.currentLevelXp / XP_PER_LEVEL) * 100
      ),
      xp: levelInfo.xp,
    },
    year: selectedYear,
  };
}

export function getYearReviewPreview(habits, gamification, year, now = new Date()) {
  const review = getYearInReview(habits, gamification, year, now);

  return {
    activeDays: review.activeDays,
    milestoneCount: review.milestones.length,
    reflectionCount: review.reflections.length,
    totalCompletions: review.totalCompletions,
    year: review.year,
  };
}

function getSafeHabits(habits) {
  return Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
}

function normalizeYear(year, now) {
  const numericYear = Number(year);

  if (!Number.isInteger(numericYear) || numericYear < 1970 || numericYear > 9999) {
    return now.getFullYear();
  }

  return numericYear;
}

function getCompletionEvents(habits, year, maxDateKey) {
  return habits
    .flatMap((habit) =>
      getSafeDateKeys(habit.completedDates)
        .filter((dateKey) => dateKey.startsWith(`${year}-`) && dateKey <= maxDateKey)
        .map((dateKey) => ({
          dateKey,
          habitId: habit.id || "",
          habitName: habit.name || "Habit",
        }))
    )
    .sort(compareCompletionEvents);
}

function compareCompletionEvents(first, second) {
  if (first.dateKey !== second.dateKey) {
    return first.dateKey.localeCompare(second.dateKey);
  }

  return `${first.habitId}`.localeCompare(`${second.habitId}`);
}

function getSafeDateKeys(completedDates) {
  if (!Array.isArray(completedDates)) {
    return [];
  }

  return Array.from(
    new Set(
      completedDates.filter(
        (dateKey) => typeof dateKey === "string" && isValidDateKey(dateKey)
      )
    )
  ).sort();
}

function isValidDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getMonthlyBreakdown(habits, year, now, maxDateKey) {
  return Array.from({ length: MONTH_COUNT }, (_, monthIndex) => {
    const monthDate = new Date(year, monthIndex, 1);
    const summary = getMonthActivitySummary(habits, monthDate, now);
    const isFutureMonth =
      year > now.getFullYear() ||
      (year === now.getFullYear() && monthIndex > now.getMonth());
    const completedCount = isFutureMonth ? 0 : summary.completedCount;
    const perfectDays = isFutureMonth ? 0 : summary.perfectDays;

    return {
      activeDays: isFutureMonth ? 0 : summary.activeDays,
      bestStreak: isFutureMonth ? 0 : summary.bestStreak,
      completionRate: isFutureMonth ? 0 : summary.completionRate,
      completedCount,
      isFutureMonth,
      key: summary.monthKey,
      label: summary.label,
      perfectDays,
      possibleCount: isFutureMonth ? 0 : summary.possibleCount,
      xpEarned: completedCount * COMPLETION_XP + perfectDays * PERFECT_DAY_XP,
      visible: summary.monthKey <= maxDateKey.slice(0, 7),
    };
  }).filter((month) => month.visible);
}

function getHabitSummaries(habits, year, yearStartKey, maxDateKey) {
  return habits.map((habit) => {
    const completedDates = getSafeDateKeys(habit.completedDates).filter(
      (dateKey) => dateKey.startsWith(`${year}-`) && dateKey <= maxDateKey
    );
    const possibleCount = getScheduledOpportunityCount(
      habit,
      yearStartKey,
      maxDateKey
    );
    const completionRate =
      possibleCount === 0
        ? 0
        : Math.round((completedDates.length / possibleCount) * 100);

    return {
      bestStreak: getBestStreak(completedDates, habit),
      category: habit.category || "General",
      completionRate,
      completedCount: completedDates.length,
      emoji: habit.emoji || "•",
      id: habit.id || habit.name || "habit",
      name: habit.name || "Habit",
      possibleCount,
    };
  });
}

function getScheduledOpportunityCount(habit, startKey, endKey) {
  const startDate = dateKeyToLocalDate(startKey);
  const endDate = dateKeyToLocalDate(endKey);
  let count = 0;

  for (
    const cursor = new Date(startDate);
    cursor <= endDate;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const dateKey = toDateKey(cursor);

    if (isHabitScheduledOnDate(habit, dateKey)) {
      count += 1;
    }
  }

  return count;
}

function dateKeyToLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getBestMonth(months) {
  return getTopMonth(months, (month) => month.completedCount);
}

function getMostConsistentMonth(months) {
  return getTopMonth(months, (month) => month.completionRate);
}

function getTopMonth(months, getValue) {
  return months
    .filter((month) => month.completedCount > 0 || month.possibleCount > 0)
    .reduce((best, month) => {
      if (!best) {
        return month;
      }

      const monthValue = getValue(month);
      const bestValue = getValue(best);

      if (monthValue > bestValue) {
        return month;
      }

      if (monthValue === bestValue && month.completedCount > best.completedCount) {
        return month;
      }

      return best;
    }, null);
}

function getStrongestHabit(habitSummaries) {
  return habitSummaries
    .filter((habit) => habit.completedCount > 0 || habit.possibleCount > 0)
    .reduce((best, habit) => {
      if (!best) {
        return habit;
      }

      if (habit.completionRate > best.completionRate) {
        return habit;
      }

      if (
        habit.completionRate === best.completionRate &&
        habit.completedCount > best.completedCount
      ) {
        return habit;
      }

      return best;
    }, null);
}

function getMostCompletedHabit(habitSummaries) {
  return habitSummaries
    .filter((habit) => habit.completedCount > 0)
    .reduce((best, habit) => {
      if (!best || habit.completedCount > best.completedCount) {
        return habit;
      }

      return best;
    }, null);
}

function getAchievementsInYear(gamification, year, maxDateKey) {
  const recentAchievements = Array.isArray(gamification?.recentAchievements)
    ? gamification.recentAchievements
    : [];

  return recentAchievements
    .filter((achievement) => {
      const dateKey = toSafeDateKey(achievement.unlockedAt || achievement.date);

      return dateKey && dateKey.startsWith(`${year}-`) && dateKey <= maxDateKey;
    })
    .map((achievement) => ({
      dateKey: toSafeDateKey(achievement.unlockedAt || achievement.date),
      description: achievement.description || "Achievement unlocked.",
      title: achievement.title || achievement.name || "Achievement",
      type: achievement.type || "achievement",
    }))
    .sort((first, second) => first.dateKey.localeCompare(second.dateKey));
}

function toSafeDateKey(value) {
  if (typeof value !== "string") {
    return "";
  }

  const dateKey = value.slice(0, 10);

  return isValidDateKey(dateKey) ? dateKey : "";
}

function getMilestones(context) {
  const milestones = [];
  const firstCompletion = context.completionEvents[0];
  const hundredthCompletion = context.completionEvents[99];
  const highestXpMonth = getTopMonth(context.monthlyBreakdown, (month) => month.xpEarned);

  if (firstCompletion) {
    milestones.push({
      dateKey: firstCompletion.dateKey,
      description: `${firstCompletion.habitName} was your first recorded completion of ${context.selectedYear}.`,
      id: "first-completion",
      title: "First completion",
      type: "completion",
    });
  }

  if (hundredthCompletion) {
    milestones.push({
      dateKey: hundredthCompletion.dateKey,
      description: "You reached 100 habit completions in this review year.",
      id: "hundred-completions",
      title: "100 completions",
      type: "completion",
    });
  }

  if (context.longestStreak > 0) {
    const streakHabit = context.habitSummaries.find(
      (habit) => habit.bestStreak === context.longestStreak
    );

    milestones.push({
      dateKey: "",
      description: `${streakHabit?.name || "A habit"} reached ${context.longestStreak} days.`,
      id: "longest-streak",
      title: "Longest streak",
      type: "streak",
    });
  }

  if (highestXpMonth?.xpEarned > 0) {
    milestones.push({
      dateKey: `${highestXpMonth.key}-01`,
      description: `${highestXpMonth.xpEarned} XP earned from habit progress.`,
      id: "highest-xp-month",
      title: `Highest XP month: ${highestXpMonth.label}`,
      type: "xp",
    });
  }

  if (context.bestMonth?.completedCount > 0) {
    milestones.push({
      dateKey: `${context.bestMonth.key}-01`,
      description: `${context.bestMonth.completedCount} completions recorded.`,
      id: "best-month",
      title: `Best month: ${context.bestMonth.label}`,
      type: "month",
    });
  }

  if (context.mostCompletedHabit?.completedCount > 0) {
    milestones.push({
      dateKey: "",
      description: `${context.mostCompletedHabit.name} had ${context.mostCompletedHabit.completedCount} completions.`,
      id: "most-completed-habit",
      title: "Most completed habit",
      type: "habit",
    });
  }

  const firstAchievement = context.achievements[0];

  if (firstAchievement) {
    milestones.push({
      dateKey: firstAchievement.dateKey,
      description: firstAchievement.description,
      id: "first-achievement",
      title: `First achievement: ${firstAchievement.title}`,
      type: "achievement",
    });
  }

  return milestones.sort(compareMilestones);
}

function compareMilestones(first, second) {
  if (!first.dateKey && !second.dateKey) {
    return first.id.localeCompare(second.id);
  }

  if (!first.dateKey) {
    return 1;
  }

  if (!second.dateKey) {
    return -1;
  }

  return first.dateKey.localeCompare(second.dateKey);
}

function getReflectionCards(context) {
  const reflections = [];

  if (context.totalCompletions > 0) {
    reflections.push({
      id: "completion-total",
      text: `You recorded ${context.totalCompletions} habit completions in ${context.selectedYear}.`,
    });
  }

  if (context.activeDays > 0) {
    reflections.push({
      id: "active-days",
      text: `You completed habits on ${context.activeDays} different days.`,
    });
  }

  if (context.longestStreak > 0) {
    reflections.push({
      id: "longest-streak",
      text: `Your longest streak reached ${context.longestStreak} days.`,
    });
  }

  if (context.bestMonth?.completedCount > 0) {
    reflections.push({
      id: "best-month",
      text: `${context.bestMonth.label} had your highest completion total.`,
    });
  }

  if (context.mostConsistentMonth?.possibleCount > 0) {
    reflections.push({
      id: "consistent-month",
      text: `${context.mostConsistentMonth.label} was your most consistent month at ${context.mostConsistentMonth.completionRate}%.`,
    });
  }

  if (context.mostCompletedHabit?.completedCount > 0) {
    reflections.push({
      id: "most-completed-habit",
      text: `${context.mostCompletedHabit.name} was your most completed habit with ${context.mostCompletedHabit.completedCount} completions.`,
    });
  }

  return reflections;
}

function getAvailableMetricCount(summary) {
  return [
    summary.totalCompletions > 0,
    summary.activeDays > 0,
    summary.longestStreak > 0,
    Boolean(summary.bestMonth),
    Boolean(summary.mostCompletedHabit),
  ].filter(Boolean).length;
}
