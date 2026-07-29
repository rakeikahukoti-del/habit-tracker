import {
  getTodayKey,
  isHabitScheduledOnDate,
  wasCompletedToday,
} from "./habitStats";

export function getFirstSwipeHintState({
  dismissed = false,
  habits,
  swipeEnabled = true,
  todayKey = getTodayKey(),
}) {
  const safeHabits = Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
  const actionableHabits = safeHabits.filter((habit) =>
    isHabitScheduledOnDate(habit, todayKey)
  );
  const completedAnyHabit = safeHabits.some(
    (habit) => Array.isArray(habit.completedDates) && habit.completedDates.length > 0
  );
  const hasIncompleteAction = actionableHabits.some(
    (habit) => !wasCompletedToday(habit)
  );

  return {
    actionableCount: actionableHabits.length,
    completedAnyHabit,
    hasIncompleteAction,
    shouldShow:
      Boolean(swipeEnabled) &&
      !dismissed &&
      safeHabits.length > 0 &&
      actionableHabits.length > 0 &&
      hasIncompleteAction &&
      !completedAnyHabit,
  };
}

export function getFirstWeekProgressMessage({ habitCount = 0, readiness }) {
  if (habitCount === 0) {
    return "Create one habit to start building your first week.";
  }

  if (!readiness || readiness.state === "empty") {
    return "Complete a habit to start your first week of progress.";
  }

  if (readiness.isBuilding) {
    return "Momentum is building your first trend from the habits you complete.";
  }

  return "Your first-week trend is ready.";
}
