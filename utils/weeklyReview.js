import {
  isHabitScheduledOnDate,
  toDateKey,
} from "./habitStats";

const MIN_COMPARISON_OPPORTUNITIES = 3;
const WEEK_LENGTH = 7;

export function getWeeklyReview(habits, now = new Date()) {
  const safeHabits = getSafeHabits(habits);
  const today = startOfDay(now);
  const currentDays = getWeekToDateDays(today);
  const previousDays = currentDays.map((date) => addDays(date, -WEEK_LENGTH));
  const current = getPeriodSummary(safeHabits, currentDays, toDateKey(today));
  const previous = getPeriodSummary(safeHabits, previousDays, toDateKey(today));
  const comparison = getComparison(current, previous);

  return {
    activeDays: current.activeDays,
    activeDaysLabel: `${current.activeDays} active ${
      current.activeDays === 1 ? "day" : "days"
    }`,
    bestHabit: current.bestHabit,
    completedCount: current.completedCount,
    comparison,
    completionRate: current.completionRate,
    completionRateLabel:
      current.possibleCount === 0 ? "No scheduled habits" : `${current.completionRate}%`,
    context: getWeeklyContext(current, comparison),
    days: current.days,
    focusHabit: current.focusHabit,
    hasScheduledData: current.possibleCount > 0,
    possibleCount: current.possibleCount,
    previousCompletionRate: previous.completionRate,
    summaryLabel: `${current.completedCount} of ${current.possibleCount}`,
  };
}

export function getHabitWeeklyPattern(habit, now = new Date()) {
  const safeHabit = habit && typeof habit === "object" ? habit : null;
  const today = startOfDay(now);
  const currentDays = getWeekToDateDays(today);
  const previousDays = currentDays.map((date) => addDays(date, -WEEK_LENGTH));
  const current = getPeriodSummary(
    safeHabit ? [safeHabit] : [],
    currentDays,
    toDateKey(today)
  );
  const previous = getPeriodSummary(
    safeHabit ? [safeHabit] : [],
    previousDays,
    toDateKey(today)
  );
  const comparison = getComparison(current, previous);
  const nextScheduled = getNextScheduledOpportunity(safeHabit, today);

  return {
    comparison,
    completedCount: current.completedCount,
    completionRate: current.completionRate,
    completionRateLabel:
      current.possibleCount === 0 ? "No scheduled days" : `${current.completionRate}%`,
    hasScheduledData: current.possibleCount > 0,
    nextScheduled,
    possibleCount: current.possibleCount,
    summaryLabel: `${current.completedCount} of ${current.possibleCount}`,
  };
}

export function getNextScheduledOpportunity(habit, now = new Date()) {
  if (!habit || typeof habit !== "object") {
    return {
      available: false,
      dateKey: null,
      label: "No scheduled days configured",
      timing: "none",
    };
  }

  if (habit.frequency === "Custom" && getCustomDays(habit).length === 0) {
    return {
      available: false,
      dateKey: null,
      label: "No scheduled days configured",
      timing: "none",
    };
  }

  const today = startOfDay(now);
  const todayKey = toDateKey(today);
  const completedDateKeys = new Set(getCompletedDateKeys(habit, todayKey));
  const startOffset =
    isHabitScheduledOnDate(habit, todayKey) && !completedDateKeys.has(todayKey)
      ? 0
      : 1;

  for (let offset = startOffset; offset <= 370; offset += 1) {
    const date = addDays(today, offset);
    const dateKey = toDateKey(date);

    if (!isHabitScheduledOnDate(habit, dateKey)) {
      continue;
    }

    return {
      available: true,
      dateKey,
      label: getNextScheduledLabel(date, today, offset),
      timing: offset === 0 ? "today" : offset === 1 ? "tomorrow" : "future",
    };
  }

  return {
    available: false,
    dateKey: null,
    label: "No upcoming scheduled day",
    timing: "none",
  };
}

function getPeriodSummary(habits, days, todayKey) {
  const safeHabits = getSafeHabits(habits);
  const habitSummaries = safeHabits.map((habit) =>
    getHabitPeriodSummary(habit, days, todayKey)
  );
  const daySummaries = days.map((date) => {
    const dateKey = toDateKey(date);
    const scheduled = habitSummaries.filter((summary) =>
      summary.scheduledDateKeys.has(dateKey)
    );
    const completedCount = scheduled.filter((summary) =>
      summary.completedDateKeys.has(dateKey)
    ).length;

    return {
      completedCount,
      dateKey,
      totalHabits: scheduled.length,
    };
  });
  const completedCount = daySummaries.reduce(
    (sum, day) => sum + day.completedCount,
    0
  );
  const possibleCount = daySummaries.reduce(
    (sum, day) => sum + day.totalHabits,
    0
  );
  const completionRate =
    possibleCount === 0 ? 0 : Math.round((completedCount / possibleCount) * 100);
  const activeDays = daySummaries.filter((day) => day.completedCount > 0).length;
  const rankedHabitSummaries = habitSummaries.filter(
    (summary) => summary.possibleCount > 0
  );

  return {
    activeDays,
    bestHabit: getBestHabitSummary(rankedHabitSummaries),
    completedCount,
    completionRate,
    days: daySummaries,
    focusHabit: getFocusHabitSummary(rankedHabitSummaries),
    possibleCount,
  };
}

function getHabitPeriodSummary(habit, days, todayKey) {
  const completedDateKeys = new Set(getCompletedDateKeys(habit, todayKey));
  const scheduledDateKeys = new Set(
    days
      .map(toDateKey)
      .filter((dateKey) => isHabitScheduledOnDate(habit, dateKey))
  );
  const possibleCount = scheduledDateKeys.size;
  const completedCount = Array.from(scheduledDateKeys).filter((dateKey) =>
    completedDateKeys.has(dateKey)
  ).length;
  const completionRate =
    possibleCount === 0 ? 0 : Math.round((completedCount / possibleCount) * 100);

  return {
    completedCount,
    completedDateKeys,
    completionRate,
    habit,
    possibleCount,
    scheduledDateKeys,
  };
}

function getBestHabitSummary(habitSummaries) {
  const best = [...habitSummaries].sort(
    (first, second) =>
      second.completionRate - first.completionRate ||
      second.completedCount - first.completedCount ||
      String(first.habit?.name || "").localeCompare(String(second.habit?.name || ""))
  )[0];

  return best ? formatHabitSummary(best) : null;
}

function getFocusHabitSummary(habitSummaries) {
  const focus = [...habitSummaries]
    .filter((summary) => summary.completedCount < summary.possibleCount)
    .sort(
      (first, second) =>
        first.completionRate - second.completionRate ||
        second.possibleCount - first.possibleCount ||
        String(first.habit?.name || "").localeCompare(String(second.habit?.name || ""))
    )[0];

  return focus ? formatHabitSummary(focus) : null;
}

function formatHabitSummary(summary) {
  return {
    completedCount: summary.completedCount,
    completionRate: summary.completionRate,
    id: summary.habit?.id || "",
    name: summary.habit?.name || "Unnamed habit",
    possibleCount: summary.possibleCount,
  };
}

function getComparison(current, previous) {
  if (
    current.possibleCount < MIN_COMPARISON_OPPORTUNITIES ||
    previous.possibleCount < MIN_COMPARISON_OPPORTUNITIES
  ) {
    return {
      available: false,
      delta: 0,
      label: "Comparison needs more scheduled data.",
    };
  }

  const delta = current.completionRate - previous.completionRate;

  if (delta === 0) {
    return {
      available: true,
      delta,
      label: "Same as last week.",
    };
  }

  return {
    available: true,
    delta,
    label: `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta)}% from last week.`,
  };
}

function getWeeklyContext(current, comparison) {
  if (current.possibleCount === 0) {
    return "No scheduled habits this week.";
  }

  if (comparison.available && comparison.delta > 0) {
    return comparison.label;
  }

  if (comparison.available && comparison.delta < 0) {
    return comparison.label;
  }

  if (current.completedCount === 0) {
    return "Building your first completion this week.";
  }

  return `${current.completedCount} of ${current.possibleCount} scheduled habits completed this week.`;
}

function getWeekToDateDays(today) {
  const weekStart = getStartOfWeek(today);
  const dayCount = Math.floor((today - weekStart) / (24 * 60 * 60 * 1000)) + 1;

  return Array.from({ length: dayCount }, (_, index) => addDays(weekStart, index));
}

function getStartOfWeek(date) {
  const localDate = startOfDay(date);
  const mondayOffset = (localDate.getDay() + 6) % WEEK_LENGTH;

  return addDays(localDate, -mondayOffset);
}

function getNextScheduledLabel(date, today, offset) {
  if (offset === 0) {
    return "Scheduled today";
  }

  if (offset === 1) {
    return "Next scheduled tomorrow";
  }

  const sameYear = date.getFullYear() === today.getFullYear();
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const monthDay = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });

  return `Next scheduled ${weekday}, ${monthDay}`;
}

function getCompletedDateKeys(habit, todayKey) {
  if (!Array.isArray(habit?.completedDates)) {
    return [];
  }

  return Array.from(
    new Set(
      habit.completedDates.filter(
        (dateKey) =>
          typeof dateKey === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(dateKey) &&
          dateKey <= todayKey
      )
    )
  );
}

function getCustomDays(habit) {
  return Array.isArray(habit?.customDays)
    ? habit.customDays.filter((day) =>
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].includes(day)
      )
    : [];
}

function getSafeHabits(habits) {
  return Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
}

function addDays(date, days) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return startOfDay(nextDate);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
