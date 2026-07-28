const COMPLETION_GOAL = 6;
const ACTIVE_DAY_GOAL = 3;

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

function isDateKey(dateKey) {
  return (
    typeof dateKey === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
  );
}
