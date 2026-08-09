import {
  isHabitScheduledOnDate,
  toDateKey,
} from "./habitStats";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function getAvailableActivityYears(habits, now = new Date()) {
  const currentYear = startOfDay(now).getFullYear();
  const years = new Set([currentYear]);

  getSafeHabits(habits).forEach((habit) => {
    const createdAt = parseStoredDate(habit.createdAt);

    if (createdAt && createdAt.getFullYear() <= currentYear) {
      years.add(createdAt.getFullYear());
    }

    getSafeDateKeys(habit.completedDates, toDateKey(now)).forEach((dateKey) => {
      const year = Number(dateKey.slice(0, 4));

      if (Number.isInteger(year) && year <= currentYear) {
        years.add(year);
      }
    });
  });

  return Array.from(years)
    .filter((year) => Number.isInteger(year) && year <= currentYear)
    .sort((first, second) => second - first);
}

export function getYearActivityDays(habits, year, now = new Date()) {
  const safeYear = normalizeYear(year, now);
  const start = new Date(safeYear, 0, 1);
  const end = new Date(safeYear, 11, 31);
  const profiles = getHabitActivityProfiles(habits, now);

  return getDateRange(start, end).map((date) =>
    getDayActivitySummaryFromProfiles(profiles, date, now)
  );
}

export function getDayActivitySummary(habits, dateKey, now = new Date()) {
  if (!isValidDateKey(dateKey)) {
    return getEmptyDaySummary(dateKey || "", "beforeTracking", now);
  }

  return getDayActivitySummaryFromProfiles(
    getHabitActivityProfiles(habits, now),
    dateKeyToLocalDate(dateKey),
    now
  );
}

export function getMonthActivitySummary(habits, visibleMonth, now = new Date()) {
  const monthStart = startOfMonth(visibleMonth || now);
  const monthEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0
  );
  const today = startOfDay(now);
  // Built once and reused for every day/month-summary computation below,
  // instead of each call rebuilding its own per-habit Set from
  // completedDates - see the perf-baseline report for why that mattered
  // (this was the dominant cost in Year in Review, which calls this
  // function 12x for a year's monthly breakdown; the old per-day
  // getDayActivitySummary() call rebuilt the full profile cache on every
  // one of ~365 days). Two caches, not one, because getHabitActivityProfiles
  // silently drops any habit with no resolvable start date, while the
  // month-summary path below has always defaulted that case to "starts
  // today" instead - kept as separate helpers rather than unifying them
  // so that edge-case behavior doesn't shift as a side effect of this
  // performance fix.
  const profiles = getHabitActivityProfiles(habits, now);
  const completionCaches = getHabitCompletionCaches(habits, now);
  const days = getDateRange(monthStart, monthEnd)
    .filter((date) => date <= today)
    .map((date) => getDayActivitySummaryFromProfiles(profiles, date, now));
  const scheduledDays = days.filter((day) => day.scheduledCount > 0);
  const completedCount = days.reduce(
    (sum, day) => sum + day.completedCount,
    0
  );
  const possibleCount = days.reduce((sum, day) => sum + day.scheduledCount, 0);
  const perfectDays = scheduledDays.filter((day) => day.isPerfectDay).length;
  const activeDays = days.filter((day) => day.completedCount > 0).length;
  const habitSummaries = getHabitMonthSummaries(
    completionCaches,
    monthStart,
    monthEnd,
    now
  );
  const strongestHabit = habitSummaries
    .filter((habit) => habit.possibleCount > 0)
    .sort(
      (first, second) =>
        second.completionRate - first.completionRate ||
        second.completedCount - first.completedCount ||
        first.name.localeCompare(second.name)
    )[0] || null;
  const mostImprovedHabit = getMostImprovedHabit(
    completionCaches,
    monthStart,
    monthEnd,
    now
  );

  return {
    activeDays,
    bestStreak: getBestMonthPerfectStreak(days),
    completedCount,
    completionRate:
      possibleCount === 0
        ? 0
        : Math.round((completedCount / possibleCount) * 100),
    days,
    label: monthStart.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    }),
    monthKey: `${monthStart.getFullYear()}-${String(
      monthStart.getMonth() + 1
    ).padStart(2, "0")}`,
    mostImprovedHabit,
    perfectDays,
    possibleCount,
    strongestHabit,
  };
}

export function getHabitDayState(habit, dateKey, now = new Date()) {
  if (!isValidDateKey(dateKey)) {
    return {
      completed: false,
      dateKey,
      isFuture: false,
      scheduled: false,
      state: "beforeHabit",
    };
  }

  const profile = getHabitActivityProfiles([habit], now)[0];
  const date = dateKeyToLocalDate(dateKey);

  if (!profile || date < profile.startDate) {
    return {
      completed: false,
      dateKey,
      isFuture: false,
      scheduled: false,
      state: "beforeHabit",
    };
  }

  if (date > startOfDay(now)) {
    return {
      completed: false,
      dateKey,
      isFuture: true,
      scheduled: false,
      state: "future",
    };
  }

  const scheduled = isHabitScheduledOnDate(profile.habit, dateKey);
  const completed = profile.completedSet.has(dateKey);

  return {
    completed,
    dateKey,
    isFuture: false,
    scheduled,
    state: !scheduled ? "unscheduled" : completed ? "complete" : "incomplete",
  };
}

export function getHeatmapIntensity(summary) {
  if (!summary || summary.state === "future") {
    return "future";
  }

  if (
    summary.state === "beforeTracking" ||
    summary.state === "unscheduled" ||
    summary.scheduledCount === 0
  ) {
    return "none";
  }

  if (summary.completedCount === 0) {
    return "empty";
  }

  if (summary.completionRate >= 100) {
    return "complete";
  }

  if (summary.completionRate >= 67) {
    return "mostly";
  }

  return "partial";
}

export function getMonthRange(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);

  return { end, start };
}

export function getYearRange(year) {
  return {
    end: new Date(year, 11, 31),
    start: new Date(year, 0, 1),
  };
}

export function getActivityDayAccessibilityLabel(summary) {
  if (!summary) {
    return "No activity data";
  }

  const dateLabel = formatFullDate(summary.dateKey);

  if (summary.state === "future") {
    return `${dateLabel}, future date`;
  }

  if (summary.state === "beforeTracking") {
    return `${dateLabel}, before activity tracking`;
  }

  if (summary.state === "unscheduled") {
    return `${dateLabel}, no habits scheduled`;
  }

  if (summary.isPerfectDay) {
    return `${dateLabel}, perfect day, ${summary.completedCount} of ${summary.scheduledCount} scheduled habits completed`;
  }

  return `${dateLabel}, ${summary.completedCount} of ${summary.scheduledCount} scheduled habits completed, ${summary.completionRate}%`;
}

export function getMonthLabel(monthIndex) {
  return MONTH_LABELS[monthIndex] || "";
}

function getDayActivitySummaryFromProfiles(profiles, date, now) {
  const today = startOfDay(now);
  const safeDate = startOfDay(date);
  const dateKey = toDateKey(safeDate);

  if (safeDate > today) {
    return getEmptyDaySummary(dateKey, "future", now);
  }

  if (
    profiles.length === 0 ||
    profiles.every((profile) => safeDate < profile.startDate)
  ) {
    return getEmptyDaySummary(dateKey, "beforeTracking", now);
  }

  const scheduledProfiles = profiles.filter(
    (profile) =>
      safeDate >= profile.startDate && isHabitScheduledOnDate(profile.habit, dateKey)
  );

  if (scheduledProfiles.length === 0) {
    return getEmptyDaySummary(dateKey, "unscheduled", now);
  }

  const completedHabits = scheduledProfiles
    .filter((profile) => profile.completedSet.has(dateKey))
    .map((profile) => ({
      id: profile.habit.id,
      name: profile.habit.name || "Untitled habit",
    }));
  const completionRate = Math.round(
    (completedHabits.length / scheduledProfiles.length) * 100
  );
  const state =
    completedHabits.length === 0
      ? "scheduledIncomplete"
      : completedHabits.length === scheduledProfiles.length
        ? "scheduledComplete"
        : "scheduledPartial";

  return {
    completedCount: completedHabits.length,
    completedHabits,
    completionRate,
    dateKey,
    habitNames: scheduledProfiles.map(
      (profile) => profile.habit.name || "Untitled habit"
    ),
    intensity: getHeatmapIntensity({
      completedCount: completedHabits.length,
      completionRate,
      scheduledCount: scheduledProfiles.length,
      state,
    }),
    isFuture: false,
    isPerfectDay: completedHabits.length === scheduledProfiles.length,
    scheduledCount: scheduledProfiles.length,
    state,
  };
}

function getEmptyDaySummary(dateKey, state) {
  const summary = {
    completedCount: 0,
    completedHabits: [],
    completionRate: 0,
    dateKey,
    habitNames: [],
    isFuture: state === "future",
    isPerfectDay: false,
    scheduledCount: 0,
    state,
  };

  return {
    ...summary,
    intensity: getHeatmapIntensity(summary),
  };
}

function getHabitActivityProfiles(habits, now) {
  const todayKey = toDateKey(now);

  return getSafeHabits(habits)
    .map((habit) => {
      const completedDates = getSafeDateKeys(habit.completedDates, todayKey);
      const startDate = getHabitStartDate(habit, completedDates);

      if (!startDate) {
        return null;
      }

      return {
        completedDates,
        completedSet: new Set(completedDates),
        habit,
        startDate,
      };
    })
    .filter(Boolean);
}

// Same shape as getHabitActivityProfiles's entries, but every habit is kept
// (startDate defaults to "today" instead of the habit being dropped) - the
// behavior getHabitMonthSummaries has always had. Kept as a separate cache
// rather than reusing getHabitActivityProfiles so that behavior didn't
// shift as a side effect of caching it.
function getHabitCompletionCaches(habits, now) {
  const today = startOfDay(now);
  const todayKey = toDateKey(today);

  return getSafeHabits(habits).map((habit) => {
    const completedDates = getSafeDateKeys(habit.completedDates, todayKey);

    return {
      completedSet: new Set(completedDates),
      habit,
      startDate: getHabitStartDate(habit, completedDates) || today,
    };
  });
}

function getHabitMonthSummaries(completionCaches, monthStart, monthEnd, now) {
  const today = startOfDay(now);

  return completionCaches.map(({ completedSet, habit, startDate }) => {
    const days = getDateRange(monthStart, monthEnd).filter(
      (date) =>
        date <= today &&
        date >= startDate &&
        isHabitScheduledOnDate(habit, toDateKey(date))
    );
    const completedCount = days.filter((date) =>
      completedSet.has(toDateKey(date))
    ).length;
    const possibleCount = days.length;

    return {
      completedCount,
      completionRate:
        possibleCount === 0
          ? 0
          : Math.round((completedCount / possibleCount) * 100),
      id: habit.id,
      name: habit.name || "Untitled habit",
      possibleCount,
    };
  });
}

function getMostImprovedHabit(completionCaches, monthStart, monthEnd, now) {
  const previousMonthStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() - 1,
    1
  );
  const previousMonthEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    0
  );
  const current = getHabitMonthSummaries(
    completionCaches,
    monthStart,
    monthEnd,
    now
  );
  const previous = getHabitMonthSummaries(
    completionCaches,
    previousMonthStart,
    previousMonthEnd,
    now
  );

  return current
    .map((habit) => {
      const previousHabit = previous.find((item) => item.id === habit.id);

      if (!previousHabit || habit.possibleCount === 0 || previousHabit.possibleCount === 0) {
        return null;
      }

      return {
        ...habit,
        improvement: habit.completionRate - previousHabit.completionRate,
      };
    })
    .filter((habit) => habit && habit.improvement > 0)
    .sort(
      (first, second) =>
        second.improvement - first.improvement ||
        second.completionRate - first.completionRate ||
        first.name.localeCompare(second.name)
    )[0] || null;
}

function getBestMonthPerfectStreak(days) {
  let best = 0;
  let current = 0;

  days.forEach((day) => {
    if (day.scheduledCount === 0) {
      return;
    }

    if (day.isPerfectDay) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });

  return best;
}

function formatFullDate(dateKey) {
  if (!isValidDateKey(dateKey)) {
    return "Unknown date";
  }

  return dateKeyToLocalDate(dateKey).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getHabitStartDate(habit, completedDates) {
  const createdAt = parseStoredDate(habit?.createdAt);
  const firstCompletion = completedDates[0]
    ? dateKeyToLocalDate(completedDates[0])
    : null;

  if (createdAt && firstCompletion) {
    return createdAt < firstCompletion ? createdAt : firstCompletion;
  }

  return createdAt || firstCompletion;
}

function getSafeHabits(habits) {
  return Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
}

function getSafeDateKeys(completedDates, todayKey) {
  if (!Array.isArray(completedDates)) {
    return [];
  }

  return Array.from(
    new Set(
      completedDates.filter(
        (dateKey) =>
          typeof dateKey === "string" &&
          isValidDateKey(dateKey) &&
          dateKey <= todayKey
      )
    )
  ).sort();
}

function normalizeYear(year, now) {
  const currentYear = startOfDay(now).getFullYear();
  const parsedYear = Number(year);

  if (!Number.isInteger(parsedYear)) {
    return currentYear;
  }

  return Math.min(currentYear, Math.max(1970, parsedYear));
}

function getDateRange(startDate, endDate) {
  const dates = [];
  let cursor = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

function addDays(date, days) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function parseStoredDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const parsedDate = isValidDateKey(value) ? dateKeyToLocalDate(value) : new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? null : startOfDay(parsedDate);
}

function isValidDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  return toDateKey(dateKeyToLocalDate(dateKey)) === dateKey;
}

function dateKeyToLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
