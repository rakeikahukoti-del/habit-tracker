import {
  getTodayKey,
  isHabitScheduledOnDate,
  toDateKey,
  wasCompletedToday,
} from "./habitStats";
import { getNextScheduledOpportunity } from "./weeklyReview";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getReturnExperienceState({
  dismissedDate = "",
  habits,
  todayKey = getTodayKey(),
} = {}) {
  const safeTodayKey = isValidDateKey(todayKey) ? todayKey : getTodayKey();
  const safeHabits = getSafeHabits(habits);

  if (safeHabits.length === 0) {
    return createReturnState({
      message: "",
      messageKey: "no-habits",
      shouldShow: false,
      state: "no-habits",
      todayKey: safeTodayKey,
    });
  }

  if (dismissedDate === safeTodayKey) {
    return createReturnState({
      message: "",
      messageKey: "dismissed-today",
      shouldShow: false,
      state: "dismissed",
      todayKey: safeTodayKey,
    });
  }

  const lastCompletionDateKey = getLastCompletionDateKey(safeHabits, safeTodayKey);
  const actionableHabitsToday = getActionableHabitsToday(safeHabits, safeTodayKey);
  const nextScheduledOpportunity = getNextScheduledForHabits(
    safeHabits,
    dateKeyToLocalDate(safeTodayKey)
  );

  if (!lastCompletionDateKey) {
    return createReturnState({
      actionableHabitsToday,
      lastCompletionDateKey,
      message: "",
      messageKey: "new-user",
      nextScheduledOpportunity,
      shouldShow: false,
      state: "new-user",
      todayKey: safeTodayKey,
    });
  }

  const inactiveCalendarDays = Math.max(
    0,
    getDayDistance(lastCompletionDateKey, safeTodayKey) - 1
  );

  if (inactiveCalendarDays === 0) {
    return createReturnState({
      actionableHabitsToday,
      inactiveCalendarDays,
      lastCompletionDateKey,
      message: "",
      messageKey: "active",
      nextScheduledOpportunity,
      shouldShow: false,
      state: "active",
      todayKey: safeTodayKey,
    });
  }

  const missedScheduledOpportunities = getMissedScheduledOpportunities({
    habits: safeHabits,
    sinceDateKey: lastCompletionDateKey,
    todayKey: safeTodayKey,
  });
  const messageKey = getReturnMessageKey({
    actionableCount: actionableHabitsToday.length,
    missedScheduledOpportunities,
    nextScheduledOpportunity,
  });

  return createReturnState({
    actionableHabitsToday,
    inactiveCalendarDays,
    lastCompletionDateKey,
    message: getReturnMessage(messageKey, {
      actionableCount: actionableHabitsToday.length,
      nextScheduledOpportunity,
    }),
    messageKey,
    missedScheduledOpportunities,
    nextScheduledOpportunity,
    shouldShow: true,
    state:
      missedScheduledOpportunities > 0
        ? "scheduled-return"
        : "unscheduled-return",
    todayKey: safeTodayKey,
  });
}

export function getHabitRecoveryContext(habit, todayKey = getTodayKey()) {
  const safeHabit = habit && typeof habit === "object" ? habit : {};
  const completedDates = getCompletedDateKeys(safeHabit, todayKey);
  const lastCompletedDateKey = completedDates[completedDates.length - 1] || "";
  const nextScheduledOpportunity = getNextScheduledOpportunity(
    safeHabit,
    dateKeyToLocalDate(todayKey)
  );

  return {
    lastCompletedLabel: lastCompletedDateKey
      ? formatDateKey(lastCompletedDateKey)
      : "No completions yet",
    lastCompletedDateKey,
    nextScheduledLabel: nextScheduledOpportunity.label,
    nextScheduledOpportunity,
  };
}

function createReturnState({
  actionableHabitsToday = [],
  inactiveCalendarDays = 0,
  lastCompletionDateKey = "",
  message,
  messageKey,
  missedScheduledOpportunities = 0,
  nextScheduledOpportunity = null,
  shouldShow,
  state,
  todayKey,
}) {
  return {
    actionableHabitCount: actionableHabitsToday.length,
    inactiveCalendarDays,
    lastCompletionDateKey,
    message,
    messageKey,
    missedScheduledOpportunities,
    nextScheduledOpportunity,
    shouldShow,
    state,
    todayKey,
  };
}

function getReturnMessageKey({
  actionableCount,
  missedScheduledOpportunities,
  nextScheduledOpportunity,
}) {
  if (actionableCount > 1) {
    return "multiple-actionable";
  }

  if (actionableCount === 1) {
    return missedScheduledOpportunities > 0
      ? "start-one-today"
      : "one-available-today";
  }

  if (nextScheduledOpportunity?.timing === "tomorrow") {
    return "next-tomorrow";
  }

  if (nextScheduledOpportunity?.available) {
    return "next-future";
  }

  return "nothing-today";
}

function getReturnMessage(messageKey, { actionableCount, nextScheduledOpportunity }) {
  if (messageKey === "multiple-actionable") {
    return `Welcome back. ${actionableCount} habits are available today.`;
  }

  if (messageKey === "start-one-today") {
    return "Welcome back. Start with one habit today.";
  }

  if (messageKey === "one-available-today") {
    return "Welcome back. One habit is available today.";
  }

  if (messageKey === "next-tomorrow") {
    return "Welcome back. Your next scheduled habit is tomorrow.";
  }

  if (messageKey === "next-future") {
    return `Welcome back. ${nextScheduledOpportunity.label}.`;
  }

  return "Welcome back. Nothing is scheduled today.";
}

function getMissedScheduledOpportunities({ habits, sinceDateKey, todayKey }) {
  const startDate = addDays(dateKeyToLocalDate(sinceDateKey), 1);
  const endDate = addDays(dateKeyToLocalDate(todayKey), -1);

  if (endDate < startDate) {
    return 0;
  }

  let missedCount = 0;
  let cursor = startDate;

  while (cursor <= endDate) {
    const dateKey = toDateKey(cursor);

    habits.forEach((habit) => {
      if (!isHabitActiveOnDate(habit, dateKey)) {
        return;
      }

      if (
        isHabitScheduledOnDate(habit, dateKey) &&
        !getCompletedDateKeys(habit, todayKey).includes(dateKey)
      ) {
        missedCount += 1;
      }
    });

    cursor = addDays(cursor, 1);
  }

  return missedCount;
}

function getActionableHabitsToday(habits, todayKey) {
  return habits.filter(
    (habit) =>
      isHabitActiveOnDate(habit, todayKey) &&
      isHabitScheduledOnDate(habit, todayKey) &&
      !wasCompletedToday(habit)
  );
}

function getNextScheduledForHabits(habits, today) {
  return habits
    .map((habit) => getNextScheduledOpportunity(habit, today))
    .filter((opportunity) => opportunity.available)
    .sort((first, second) =>
      String(first.dateKey || "").localeCompare(String(second.dateKey || ""))
    )[0] || {
    available: false,
    dateKey: null,
    label: "No upcoming scheduled day",
    timing: "none",
  };
}

function getLastCompletionDateKey(habits, todayKey) {
  const dateKeys = habits
    .flatMap((habit) => getCompletedDateKeys(habit, todayKey))
    .sort();

  return dateKeys[dateKeys.length - 1] || "";
}

function getCompletedDateKeys(habit, todayKey) {
  return Array.isArray(habit?.completedDates)
    ? Array.from(
        new Set(
          habit.completedDates.filter(
            (dateKey) =>
              isValidDateKey(dateKey) &&
              dateKey <= todayKey
          )
        )
      ).sort()
    : [];
}

function isHabitActiveOnDate(habit, dateKey) {
  const createdDateKey = getCreatedDateKey(habit);

  return !createdDateKey || createdDateKey <= dateKey;
}

function getCreatedDateKey(habit) {
  if (isValidDateKey(habit?.createdAt)) {
    return habit.createdAt;
  }

  const parsed = typeof habit?.createdAt === "string"
    ? new Date(habit.createdAt)
    : null;

  return parsed && !Number.isNaN(parsed.getTime()) ? toDateKey(parsed) : "";
}

function getDayDistance(startDateKey, endDateKey) {
  const start = dateKeyToLocalDate(startDateKey);
  const end = dateKeyToLocalDate(endDateKey);

  return Math.round((end - start) / MS_PER_DAY);
}

function addDays(date, numberOfDays) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + numberOfDays);

  return nextDate;
}

function dateKeyToLocalDate(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateKey(dateKey) {
  return dateKeyToLocalDate(dateKey).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function isValidDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return toDateKey(dateKeyToLocalDate(value)) === value;
}

function getSafeHabits(habits) {
  return Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
}
