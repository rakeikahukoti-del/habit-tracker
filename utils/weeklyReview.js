import {
  isHabitScheduledOnDate,
  toDateKey,
} from "./habitStats";

const MIN_COMPARISON_OPPORTUNITIES = 3;
const WEEK_LENGTH = 7;

// Window strategy for getWeeklyReview's 3rd parameter (Thread C week-
// definition swap). Defaults to the original calendar-week-to-date window
// (getWeekToDateDays + the weekday-aligned "same days last week" comparison
// wording) so every existing caller - homeHabitActions.js (Home screen) and
// the smoke-test suite's direct getWeeklyReview() calls - sees zero
// behavior change without passing anything. ROLLING_WEEK_WINDOW is the one
// opt-in caller (useStatsController -> WeeklyReviewCard) should pass, since
// it pairs the rolling-7-day generator with wording that doesn't claim a
// weekday alignment the rolling window doesn't have. Bundled together
// rather than as two separate options so a caller can't accidentally pair
// the rolling window with the calendar-week label (or vice versa).
export const ROLLING_WEEK_WINDOW = {
  getComparisonLabel: getRollingComparisonLabel,
  getDays: getRollingWeekDays,
};

export function getWeeklyReview(
  habits,
  now = new Date(),
  { getComparisonLabel = getWeekToDateComparisonLabel, getDays = getWeekToDateDays } = {}
) {
  const safeHabits = getSafeHabits(habits);
  const today = startOfDay(now);
  const currentDays = getDays(today);
  const previousDays = currentDays.map((date) => addDays(date, -WEEK_LENGTH));
  const current = getPeriodSummary(safeHabits, currentDays, toDateKey(today));
  const previous = getPeriodSummary(safeHabits, previousDays, toDateKey(today));
  const comparisonStats = getComparisonStats(current, previous);
  const comparison = {
    ...comparisonStats,
    label: getComparisonLabel(comparisonStats),
  };
  const dateRange = getDateRangeLabel(currentDays);

  return {
    activeDays: current.activeDays,
    activeDaysLabel: `${current.activeDays} active ${
      current.activeDays === 1 ? "day" : "days"
    }`,
    bestHabit: current.bestHabit,
    breakdown: current.breakdown,
    completedCount: current.completedCount,
    comparison,
    completionRate: current.completionRate,
    completionRateLabel:
      current.possibleCount === 0 ? "No scheduled habits" : `${current.completionRate}%`,
    context: getWeeklyContext(current, comparison),
    dateRange,
    days: current.days,
    focusHabit: current.focusHabit,
    hasScheduledData: current.possibleCount > 0,
    missedCount: current.missedCount,
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
  const comparisonStats = getComparisonStats(current, previous);
  const comparison = {
    ...comparisonStats,
    label: getWeekToDateComparisonLabel(comparisonStats),
  };
  const nextScheduled = getNextScheduledOpportunity(safeHabit, today);

  return {
    comparison,
    completedCount: current.completedCount,
    completionRate: current.completionRate,
    completionRateLabel:
      current.possibleCount === 0 ? "No scheduled days" : `${current.completionRate}%`,
    hasScheduledData: current.possibleCount > 0,
    missedCount: current.missedCount,
    nextScheduled,
    possibleCount: current.possibleCount,
    summaryLabel: `${current.completedCount} of ${current.possibleCount}`,
    status: current.breakdown[0]?.status || "No scheduled days this week",
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
  const breakdown = getSortedHabitBreakdown(habitSummaries);

  return {
    activeDays,
    bestHabit: getBestHabitSummary(rankedHabitSummaries),
    breakdown,
    completedCount,
    completionRate,
    days: daySummaries,
    focusHabit: getFocusHabitSummary(rankedHabitSummaries),
    missedCount: Math.max(0, possibleCount - completedCount),
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
    missedCount: Math.max(0, possibleCount - completedCount),
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
    missedCount: summary.missedCount,
    name: summary.habit?.name || "Unnamed habit",
    possibleCount: summary.possibleCount,
  };
}

function getSortedHabitBreakdown(habitSummaries) {
  return habitSummaries
    .map((summary) => ({
      ...formatHabitSummary(summary),
      sortGroup: getWeeklyStatusSortGroup(summary),
      status: getWeeklyHabitStatus(summary),
    }))
    .sort(
      (first, second) =>
        first.sortGroup - second.sortGroup ||
        first.completionRate - second.completionRate ||
        second.possibleCount - first.possibleCount ||
        first.name.localeCompare(second.name)
    )
    .map(({ sortGroup, ...summary }) => summary);
}

// Shared by getWeeklyReview's per-habit breakdown table (rendered on
// Progress, in scope) and getHabitWeeklyPattern's `status` field (per-habit
// drill-down) - but the latter is confirmed dead (no component or test
// reads `weeklyPattern.status`; the only status assertion in the smoke
// suite is on "On track", untouched below), so this wording change is safe
// to make once here rather than needing the getComparisonLabel-style split.
function getWeeklyHabitStatus(summary) {
  if (summary.possibleCount === 0) {
    return "No scheduled days in the last 7 days";
  }

  if (summary.completedCount === summary.possibleCount) {
    return "Complete (last 7 days)";
  }

  const remaining = summary.possibleCount - summary.completedCount;

  if (remaining === 1) {
    return "One scheduled completion remaining";
  }

  if (summary.completedCount > 0) {
    return "On track";
  }

  return "No completions in the last 7 days";
}

function getWeeklyStatusSortGroup(summary) {
  if (summary.possibleCount === 0) {
    return 3;
  }

  if (summary.completedCount === summary.possibleCount) {
    return 2;
  }

  if (summary.completedCount > 0) {
    return 1;
  }

  return 0;
}

// Split from the wording (below) so the same current-vs-previous math can
// be labeled two different ways without duplicating it: getWeekToDateDays'
// previousDays is the same weekdays one week back, so its label can
// honestly say "the same days last week"; a rolling window's previousDays
// is just the prior 7-day span, no weekday alignment, so it needs
// window-agnostic wording instead (getRollingComparisonLabel, below).
function getComparisonStats(current, previous) {
  if (
    current.possibleCount < MIN_COMPARISON_OPPORTUNITIES ||
    previous.possibleCount < MIN_COMPARISON_OPPORTUNITIES
  ) {
    return { available: false, delta: 0 };
  }

  return {
    available: true,
    delta: current.completionRate - previous.completionRate,
  };
}

function getWeekToDateComparisonLabel(comparison) {
  if (!comparison.available) {
    return "Comparison needs more scheduled data.";
  }

  if (comparison.delta === 0) {
    return "Same as the same days last week.";
  }

  return `${comparison.delta > 0 ? "Up" : "Down"} ${Math.abs(
    comparison.delta
  )}% from the same days last week.`;
}

function getRollingComparisonLabel(comparison) {
  if (!comparison.available) {
    return "Comparison needs more scheduled data.";
  }

  if (comparison.delta === 0) {
    return "Same as last week.";
  }

  return `${comparison.delta > 0 ? "Up" : "Down"} ${Math.abs(
    comparison.delta
  )}% vs last week.`;
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

// Rolling 7-day window (today and the 6 days before it), always a fixed
// length regardless of what day of the week `today` is - unlike
// getWeekToDateDays above, which shrinks to 1 day on a Monday. Kept private
// (like getWeekToDateDays) and reached only via ROLLING_WEEK_WINDOW, so
// getWeeklyReview stays the single call path this thread was scoped to -
// see the module-level comment on ROLLING_WEEK_WINDOW.
function getRollingWeekDays(today) {
  return Array.from({ length: WEEK_LENGTH }, (_, index) =>
    addDays(today, index - (WEEK_LENGTH - 1))
  );
}

function getDateRangeLabel(days) {
  if (!Array.isArray(days) || days.length === 0) {
    return "";
  }

  const firstDay = days[0];
  const lastDay = days[days.length - 1];
  const sameMonth =
    firstDay.getMonth() === lastDay.getMonth() &&
    firstDay.getFullYear() === lastDay.getFullYear();
  const firstLabel = firstDay.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameMonth ? {} : { year: "numeric" }),
  });
  const lastLabel = lastDay.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${firstLabel} - ${lastLabel}`;
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
