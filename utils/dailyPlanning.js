import {
  getTodayKey,
  isHabitScheduledOnDate,
  wasCompletedToday,
} from "./habitStats";

export const DAILY_PLAN_LIMIT = 3;

export function normalizeDailyPlan(plan, habits, todayKey = getTodayKey()) {
  const safePlan = plan && typeof plan === "object" ? plan : {};
  const safeHabits = getSafeHabits(habits);
  const validScheduledIds = new Set(
    safeHabits
      .filter((habit) => isHabitScheduledOnDate(habit, todayKey))
      .map((habit) => habit.id)
  );
  const rawIds =
    safePlan.date === todayKey && Array.isArray(safePlan.habitIds)
      ? safePlan.habitIds
      : [];
  const habitIds = [];
  const seenIds = new Set();

  rawIds.forEach((habitId) => {
    if (
      typeof habitId !== "string" ||
      seenIds.has(habitId) ||
      !validScheduledIds.has(habitId) ||
      habitIds.length >= DAILY_PLAN_LIMIT
    ) {
      return;
    }

    seenIds.add(habitId);
    habitIds.push(habitId);
  });

  return {
    date: todayKey,
    habitIds,
    version: 1,
  };
}

export function getTodayPriorityHabits(plan, habits, todayKey = getTodayKey()) {
  const normalizedPlan = normalizeDailyPlan(plan, habits, todayKey);
  const habitById = new Map(getSafeHabits(habits).map((habit) => [habit.id, habit]));

  return normalizedPlan.habitIds
    .map((habitId) => habitById.get(habitId))
    .filter(Boolean);
}

export function getRemainingTodayHabits({
  habits,
  moveCompletedToBottom = false,
  plan,
  todayKey = getTodayKey(),
}) {
  const priorityIds = new Set(normalizeDailyPlan(plan, habits, todayKey).habitIds);
  const remainingHabits = getSafeHabits(habits).filter(
    (habit) =>
      isHabitScheduledOnDate(habit, todayKey) && !priorityIds.has(habit.id)
  );

  return sortHabitsForHome(remainingHabits, moveCompletedToBottom);
}

export function getDailyPlanProgress(plan, habits, todayKey = getTodayKey()) {
  const priorityHabits = getTodayPriorityHabits(plan, habits, todayKey);
  const completedCount = priorityHabits.filter((habit) =>
    isCompletedOnDate(habit, todayKey)
  ).length;
  const totalCount = priorityHabits.length;

  return {
    allComplete: totalCount > 0 && completedCount === totalCount,
    completedCount,
    remainingCount: Math.max(0, totalCount - completedCount),
    totalCount,
  };
}

export function getNextPriorityHabit({
  habits,
  plan,
  skippedIds = [],
  todayKey = getTodayKey(),
}) {
  const skipped = new Set(Array.isArray(skippedIds) ? skippedIds : []);
  const priorities = getTodayPriorityHabits(plan, habits, todayKey);

  return (
    priorities.find(
      (habit) => !isCompletedOnDate(habit, todayKey) && !skipped.has(habit.id)
    ) ||
    priorities.find((habit) => !isCompletedOnDate(habit, todayKey)) ||
    null
  );
}

export function addPriorityId(plan, habits, habitId, todayKey = getTodayKey()) {
  const normalizedPlan = normalizeDailyPlan(plan, habits, todayKey);

  if (
    normalizedPlan.habitIds.includes(habitId) ||
    normalizedPlan.habitIds.length >= DAILY_PLAN_LIMIT
  ) {
    return normalizedPlan;
  }

  return normalizeDailyPlan(
    {
      ...normalizedPlan,
      habitIds: [...normalizedPlan.habitIds, habitId],
    },
    habits,
    todayKey
  );
}

export function removePriorityId(plan, habits, habitId, todayKey = getTodayKey()) {
  const normalizedPlan = normalizeDailyPlan(plan, habits, todayKey);

  return {
    ...normalizedPlan,
    habitIds: normalizedPlan.habitIds.filter((id) => id !== habitId),
  };
}

export function reorderPriorityIds(
  plan,
  habits,
  habitId,
  direction,
  todayKey = getTodayKey()
) {
  const normalizedPlan = normalizeDailyPlan(plan, habits, todayKey);
  const currentIndex = normalizedPlan.habitIds.indexOf(habitId);

  if (currentIndex < 0) {
    return normalizedPlan;
  }

  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0 || nextIndex >= normalizedPlan.habitIds.length) {
    return normalizedPlan;
  }

  const nextIds = [...normalizedPlan.habitIds];
  const [movedId] = nextIds.splice(currentIndex, 1);

  nextIds.splice(nextIndex, 0, movedId);

  return normalizeDailyPlan(
    {
      ...normalizedPlan,
      habitIds: nextIds,
    },
    habits,
    todayKey
  );
}

export function getAvailablePriorityHabits({
  habits,
  plan,
  todayKey = getTodayKey(),
}) {
  const priorityIds = new Set(normalizeDailyPlan(plan, habits, todayKey).habitIds);

  return sortHabitsForHome(
    getSafeHabits(habits).filter(
      (habit) =>
        isHabitScheduledOnDate(habit, todayKey) && !priorityIds.has(habit.id)
    ),
    false
  );
}

export function sortHabitsForHome(habits, moveCompletedToBottom = false) {
  const orderedHabits = getSafeHabits(habits).sort(compareHabitOrder);

  if (!moveCompletedToBottom) {
    return orderedHabits;
  }

  return orderedHabits.sort((firstHabit, secondHabit) => {
    const firstCompleted = wasCompletedToday(firstHabit);
    const secondCompleted = wasCompletedToday(secondHabit);

    if (firstCompleted === secondCompleted) {
      return compareHabitOrder(firstHabit, secondHabit);
    }

    return firstCompleted ? 1 : -1;
  });
}

function compareHabitOrder(firstHabit, secondHabit) {
  const firstOrder = Number.isFinite(firstHabit.order)
    ? firstHabit.order
    : Number.MAX_SAFE_INTEGER;
  const secondOrder = Number.isFinite(secondHabit.order)
    ? secondHabit.order
    : Number.MAX_SAFE_INTEGER;

  if (firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  return String(firstHabit.id || "").localeCompare(String(secondHabit.id || ""));
}

function getSafeHabits(habits) {
  return Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
}

function isCompletedOnDate(habit, dateKey) {
  return (
    Array.isArray(habit?.completedDates) && habit.completedDates.includes(dateKey)
  );
}
