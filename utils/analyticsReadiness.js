import {
  getCurrentStreak,
  isHabitScheduledOnDate,
  toDateKey,
} from "./habitStats";

const COMPLETION_GOAL = 6;
const ACTIVE_DAY_GOAL = 3;
const HABIT_COMPLETION_GOAL = 4;
const HABIT_ACTIVE_DAY_GOAL = 3;
const HABIT_LOOKBACK_DAYS = 30;

export function getAnalyticsReadiness(habits) {
  const safeHabits = Array.isArray(habits) ? habits : [];
  const completedDateKeys = safeHabits.flatMap((habit) =>
    Array.isArray(habit?.completedDates) ? habit.completedDates : []
  );
  const validCompletions = completedDateKeys.filter(isDateKey);
  const activeDays = new Set(validCompletions).size;
  const totalCompletions = validCompletions.length;
  const habitCount = safeHabits.length;
  const completionProgress = Math.min(1, totalCompletions / COMPLETION_GOAL);
  const activeDayProgress = Math.min(1, activeDays / ACTIVE_DAY_GOAL);
  const progress = Math.round(
    ((completionProgress + activeDayProgress) / 2) * 100
  );
  const ready =
    habitCount > 0 &&
    totalCompletions >= COMPLETION_GOAL &&
    activeDays >= ACTIVE_DAY_GOAL;

  return {
    activeDays,
    activeDayGoal: ACTIVE_DAY_GOAL,
    completionGoal: COMPLETION_GOAL,
    habitCount,
    isBuilding: habitCount > 0 && !ready,
    progress,
    ready,
    remainingActiveDays: Math.max(0, ACTIVE_DAY_GOAL - activeDays),
    remainingCompletions: Math.max(0, COMPLETION_GOAL - totalCompletions),
    totalCompletions,
  };
}

export function shouldShowFirstTrendUnlock(readiness, alreadyShown) {
  return Boolean(readiness?.ready && !alreadyShown);
}

export function getHabitAnalyticsReadiness(habit, now = new Date()) {
  const safeHabit = habit && typeof habit === "object" ? habit : {};
  const today = startOfDay(now);
  const validDateKeys = getUniquePastDateKeys(safeHabit.completedDates, today);
  const scheduledDateKeys = validDateKeys.filter((dateKey) =>
    isHabitScheduledOnDate(safeHabit, dateKey)
  );
  const activeDays = new Set(scheduledDateKeys).size;
  const totalCompletions = scheduledDateKeys.length;
  const scheduledOpportunities = getRecentScheduledOpportunityCount(
    safeHabit,
    today
  );
  const completionRate =
    scheduledOpportunities === 0
      ? 0
      : Math.round((totalCompletions / scheduledOpportunities) * 100);
  const completionProgress = Math.min(
    1,
    totalCompletions / HABIT_COMPLETION_GOAL
  );
  const activeDayProgress = Math.min(1, activeDays / HABIT_ACTIVE_DAY_GOAL);
  const progress = Math.round(
    ((completionProgress + activeDayProgress) / 2) * 100
  );
  const currentStreak = getCurrentStreak(scheduledDateKeys, safeHabit);
  const ready =
    totalCompletions >= HABIT_COMPLETION_GOAL &&
    activeDays >= HABIT_ACTIVE_DAY_GOAL;
  const state = totalCompletions === 0 ? "empty" : ready ? "ready" : "building";

  return {
    activeDayGoal: HABIT_ACTIVE_DAY_GOAL,
    activeDays,
    completionGoal: HABIT_COMPLETION_GOAL,
    completionRate,
    currentStreak,
    progress,
    ready,
    remainingActiveDays: Math.max(0, HABIT_ACTIVE_DAY_GOAL - activeDays),
    remainingCompletions: Math.max(0, HABIT_COMPLETION_GOAL - totalCompletions),
    scheduledOpportunities,
    state,
    totalCompletions,
  };
}

export function getHabitAnalyticsGuidance(readiness) {
  if (!readiness || readiness.state === "empty") {
    return "Complete this habit once to start building insight.";
  }

  if (readiness.state === "building") {
    if (readiness.remainingCompletions > 0 && readiness.remainingActiveDays > 0) {
      return `${readiness.remainingCompletions} more completions across ${readiness.remainingActiveDays} more active days will unlock stronger insight.`;
    }

    if (readiness.remainingCompletions > 0) {
      return `${readiness.remainingCompletions} more completions will unlock stronger insight.`;
    }

    if (readiness.remainingActiveDays > 0) {
      return `${readiness.remainingActiveDays} more active days will unlock stronger insight.`;
    }
  }

  if (readiness.currentStreak > 0) {
    return "Complete the next scheduled day to keep this streak active.";
  }

  return "Use the recent pattern below to choose the next scheduled day.";
}

function getUniquePastDateKeys(dateKeys, today) {
  if (!Array.isArray(dateKeys)) {
    return [];
  }

  return Array.from(
    new Set(
      dateKeys.filter((dateKey) => {
        if (!isDateKey(dateKey)) {
          return false;
        }

        return dateKeyToLocalDate(dateKey) <= today;
      })
    )
  ).sort();
}

function getRecentScheduledOpportunityCount(habit, today) {
  return Array.from({ length: HABIT_LOOKBACK_DAYS }, (_, index) => {
    const date = new Date(today);

    date.setDate(today.getDate() - (HABIT_LOOKBACK_DAYS - 1 - index));

    return toDateKey(date);
  }).filter((dateKey) => isHabitScheduledOnDate(habit, dateKey)).length;
}

function isDateKey(dateKey) {
  return (
    typeof dateKey === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
  );
}

function dateKeyToLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
