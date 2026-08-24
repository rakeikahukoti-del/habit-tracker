const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getTodayKey() {
  return toDateKey(new Date());
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function wasCompletedToday(habit) {
  return getCompletedDates(habit).includes(getTodayKey());
}

export function getWeekDays() {
  const today = startOfDay(new Date());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      dateKey: toDateKey(date),
    };
  });
}

export function getWeeklyProgress(habit) {
  const completedSet = new Set(getCompletedDates(habit));

  return getWeekDays().map((day) => ({
    ...day,
    completed: completedSet.has(day.dateKey),
  }));
}

// Schedule-aware variant of getWeeklyProgress, adding a `scheduled` flag
// per day - built for the per-habit drill-down screen's dedicated "Last 7
// days" dot row (app/analytics/[id].js) specifically, not as a replacement
// for getWeeklyProgress: HabitCard's and HabitPerformanceList's dot rows
// (both via ProgressDots, both fed by getWeeklyProgress/getHabitPerformance)
// stay exactly as they render today - widening getWeeklyProgress itself
// would change those two call sites' output too, outside this fix's scope.
// Reuses isHabitScheduledOnDate, the same schedule-filtering check
// getWeeklyCompletionSummary below (WeeklyReviewCard's own dot-row data)
// already uses, rather than a new schedule-detection rule.
export function getScheduleAwareWeeklyProgress(habit) {
  const completedSet = new Set(getCompletedDates(habit));

  return getWeekDays().map((day) => ({
    ...day,
    completed: completedSet.has(day.dateKey),
    scheduled: isHabitScheduledOnDate(habit, day.dateKey),
  }));
}

export function getStatsSummary(habits) {
  const safeHabits = getSafeHabits(habits);
  const weekDays = getWeekDays();
  const totalHabits = safeHabits.length;
  const completedToday = safeHabits.filter(wasCompletedToday).length;
  const currentLongestStreak = safeHabits.reduce(
    (longest, habit) =>
      Math.max(longest, getCurrentStreak(getCompletedDates(habit), habit)),
    0
  );
  const bestAllTimeStreak = safeHabits.reduce(
    (best, habit) =>
      Math.max(best, getBestStreak(getCompletedDates(habit), habit)),
    0
  );
  const weeklySummary = getWeeklyCompletionSummary(safeHabits, weekDays);
  const totalPossibleCompletions = weeklySummary.reduce(
    (sum, day) => sum + day.totalHabits,
    0
  );
  const totalWeeklyCompletions = weeklySummary.reduce(
    (sum, day) => sum + day.completedCount,
    0
  );
  const weeklyCompletionPercentage =
    totalPossibleCompletions === 0
      ? 0
      : Math.round((totalWeeklyCompletions / totalPossibleCompletions) * 100);

  return {
    totalHabits,
    completedToday,
    currentLongestStreak,
    bestAllTimeStreak,
    weeklyCompletionPercentage,
    weeklySummary,
  };
}

export function getWeeklyCompletionSummary(habits, weekDays = getWeekDays()) {
  const habitProfiles = getHabitProfiles(habits);

  return weekDays.map((day) => {
    const date = dateKeyToLocalDate(day.dateKey);
    const scheduledHabits = habitProfiles.filter((profile) =>
      isScheduledOpportunity(profile.habit, date, profile.startDate)
    );
    const completedCount = scheduledHabits.filter((profile) =>
      profile.completedSet.has(day.dateKey)
    ).length;
    const percentage =
      scheduledHabits.length === 0
        ? 0
        : Math.round((completedCount / scheduledHabits.length) * 100);

    return {
      ...day,
      completedCount,
      totalHabits: scheduledHabits.length,
      percentage,
    };
  });
}

export function getAnalyticsSummary(habits, gamification = null) {
  const safeHabits = getSafeHabits(habits);
  const habitAnalytics = safeHabits.map(getHabitAnalytics);
  const totalCompletions = safeHabits.reduce(
    (sum, habit) => sum + getCompletedDates(habit).length,
    0
  );
  const habitsCompletedThisWeek = getCompletionCountInLastDays(safeHabits, 7);
  const habitsCompletedThisMonth = getCompletionCountInLastDays(safeHabits, 30);
  const mostConsistentHabit = getTopHabit(habitAnalytics);
  const weakestHabit = getWeakestHabit(habitAnalytics);
  const bestCategory = getBestCategory(safeHabits);
  const insights = getAnalyticsInsights({
    bestCategory,
    habitAnalytics,
    mostConsistentHabit,
    weakestHabit,
  });

  return {
    bestCategory,
    habitAnalytics,
    habitsCompletedThisMonth,
    habitsCompletedThisWeek,
    insights,
    mostConsistentHabit,
    totalCompletions,
    totalXpEarned: gamification?.xp || 0,
    weakestHabit,
  };
}

export function getProgressOverview(habits, period = "month", gamification = null) {
  const safeHabits = getSafeHabits(habits);
  const periodDays = getPeriodDays(safeHabits, period);
  const completionSummary = getCompletionSummaryForDays(safeHabits, periodDays);
  const weekDays = getWeekDays();
  const weeklySummary = getWeeklyCompletionSummary(safeHabits, weekDays);
  const perfectDays = completionSummary.days.filter(
    (day) => day.totalHabits > 0 && day.completedCount === day.totalHabits
  ).length;
  const historyDays = getCompletionSummaryForDays(
    safeHabits,
    getDateRangeDays(addDays(startOfDay(new Date()), -34), startOfDay(new Date()))
  ).days;

  return {
    ...completionSummary,
    averagePerDay:
      periodDays.length === 0
        ? 0
        : Number((completionSummary.completedCount / periodDays.length).toFixed(1)),
    bestAllTimeStreak: safeHabits.reduce(
      (best, habit) =>
        Math.max(best, getBestStreak(getCompletedDates(habit), habit)),
      0
    ),
    currentLongestStreak: safeHabits.reduce(
      (longest, habit) =>
        Math.max(longest, getCurrentStreak(getCompletedDates(habit), habit)),
      0
    ),
    habitCount: safeHabits.length,
    historyDays,
    perfectDays,
    period,
    totalXpEarned: gamification?.xp || 0,
    weeklySummary,
  };
}

export function getDeepAnalytics(habits, period = "month", gamification = null) {
  const safeHabits = getSafeHabits(habits);
  const overview = getProgressOverview(safeHabits, period, gamification);
  const previousOverview = getPreviousProgressOverview(safeHabits, period);
  const habitPerformance = safeHabits
    .map((habit) => getHabitPerformance(habit, period))
    .sort(
      (first, second) =>
        second.completionRate - first.completionRate ||
        second.currentStreak - first.currentStreak ||
        second.completedCount - first.completedCount
    );
  const bestHabit = habitPerformance[0] || null;
  const weakestHabit = [...habitPerformance]
    .filter((item) => item.possibleCount > 0)
    .sort(
      (first, second) =>
        first.completionRate - second.completionRate ||
        first.currentStreak - second.currentStreak
    )[0] || null;

  return {
    ...overview,
    bestHabit,
    habitPerformance,
    previousCompletionRate: previousOverview.completionRate,
    trendDelta: overview.completionRate - previousOverview.completionRate,
    trendPoints: getTrendPoints(safeHabits, period),
    weakestHabit,
  };
}

export function getHabitPerformance(habit, period = "month") {
  const safeHabit = habit && typeof habit === "object" ? habit : {};
  const days = getPeriodDays([safeHabit], period);
  const completedDates = getCompletedDates(safeHabit);
  const completedSet = new Set(completedDates);
  const startDate =
    getHabitStartDate(safeHabit, completedDates) || startOfDay(new Date());
  const scheduledDays = days.filter((day) =>
    isScheduledOpportunity(safeHabit, day, startDate)
  );
  const completedCount = scheduledDays.filter((day) =>
    completedSet.has(toDateKey(day))
  ).length;
  const possibleCount = scheduledDays.length;
  const completionRate =
    possibleCount === 0 ? 0 : Math.round((completedCount / possibleCount) * 100);
  const trend = getHabitTrendForPeriod(safeHabit, period);
  const previousRate = trend[trend.length - 2]?.percentage || 0;
  const latestRate = trend[trend.length - 1]?.percentage || 0;

  return {
    bestStreak: getBestStreak(completedDates, safeHabit),
    category: safeHabit.category || "General",
    completedCount,
    completionRate,
    currentStreak: getCurrentStreak(completedDates, safeHabit),
    habit: safeHabit,
    possibleCount,
    trend,
    trendDelta: latestRate - previousRate,
    weeklyProgress: getWeeklyProgress(safeHabit),
  };
}

export function getHabitAnalytics(habit) {
  const completedDates = Array.isArray(habit.completedDates)
    ? habit.completedDates
    : [];
  const completionRate = getHabitCompletionRate(habit);
  const weeklyCompletionPercentage = getHabitCompletionPercentageForDays(
    habit,
    7
  );
  const monthlyCompletionPercentage = getHabitCompletionPercentageForDays(
    habit,
    30
  );

  return {
    bestStreak: getBestStreak(completedDates, habit),
    category: habit.category || "General",
    completionRate,
    currentStreak: getCurrentStreak(completedDates, habit),
    habit,
    monthlyCompletionPercentage,
    trend: getHabitTrend(habit),
    weeklyCompletionPercentage,
  };
}

export function getCurrentStreak(completedDates, habit = null) {
  const completedSet = new Set(getSafeDateKeys(completedDates));
  const today = startOfDay(new Date());
  let cursor =
    completedSet.has(toDateKey(today)) && isScheduledOpportunity(habit, today)
      ? today
      : getPreviousScheduledDate(today, habit);
  let streak = 0;

  while (
    cursor &&
    isScheduledOpportunity(habit, cursor) &&
    completedSet.has(toDateKey(cursor))
  ) {
    streak += 1;
    cursor = getPreviousScheduledDate(cursor, habit);
  }

  return streak;
}

export function getBestStreak(completedDates, habit = null) {
  const sortedDates = getSortedUniqueDateKeys(completedDates).filter((dateKey) =>
    isScheduledOpportunity(habit, dateKeyToLocalDate(dateKey))
  );

  if (sortedDates.length === 0) {
    return 0;
  }

  let best = 1;
  let current = 1;

  for (let index = 1; index < sortedDates.length; index += 1) {
    const currentDate = dateKeyToLocalDate(sortedDates[index]);
    const previousScheduledDate = getPreviousScheduledDate(currentDate, habit);

    if (
      previousScheduledDate &&
      toDateKey(previousScheduledDate) === sortedDates[index - 1]
    ) {
      current += 1;
    } else {
      current = 1;
    }

    best = Math.max(best, current);
  }

  return best;
}

function getSortedUniqueDateKeys(completedDates) {
  return getSafeDateKeys(completedDates);
}

function getHabitCompletionRate(habit) {
  const today = startOfDay(new Date());
  const createdDate = getHabitStartDate(habit) || today;
  const days = getDateRangeDays(createdDate, today).filter((date) =>
    isScheduledOpportunity(habit, date)
  );
  const completedSet = new Set(getCompletedDates(habit));
  const completedCount = days.filter((date) =>
    completedSet.has(toDateKey(date))
  ).length;

  return days.length === 0
    ? 0
    : Math.min(100, Math.round((completedCount / days.length) * 100));
}

function getHabitCompletionPercentageForDays(habit, numberOfDays) {
  const completedSet = new Set(getCompletedDates(habit));
  const today = startOfDay(new Date());
  const startDate = getHabitStartDate(habit) || today;
  let possibleCount = 0;
  let completedCount = 0;

  for (let index = 0; index < numberOfDays; index += 1) {
    const date = addDays(today, -index);

    if (!isScheduledOpportunity(habit, date, startDate)) {
      continue;
    }

    possibleCount += 1;

    if (completedSet.has(toDateKey(date))) {
      completedCount += 1;
    }
  }

  return possibleCount === 0
    ? 0
    : Math.round((completedCount / possibleCount) * 100);
}

function getHabitTrend(habit) {
  const completedSet = new Set(getCompletedDates(habit));
  const today = startOfDay(new Date());
  const startDate = getHabitStartDate(habit) || today;

  return Array.from({ length: 4 }, (_, index) => {
    const weekOffset = 3 - index;
    const weekEnd = addDays(today, -(weekOffset * 7));
    const weekStart = addDays(weekEnd, -6);
    let possibleCount = 0;
    let completedCount = 0;

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addDays(weekStart, dayIndex);

      if (!isScheduledOpportunity(habit, date, startDate)) {
        continue;
      }

      possibleCount += 1;

      if (completedSet.has(toDateKey(date))) {
        completedCount += 1;
      }
    }

    return {
      completedCount,
      label: `W${index + 1}`,
      percentage:
        possibleCount === 0
          ? 0
          : Math.round((completedCount / possibleCount) * 100),
    };
  });
}

function getCompletionCountInLastDays(habits, numberOfDays) {
  const dateKeys = getDateKeysForLastDays(numberOfDays);
  const safeHabits = getSafeHabits(habits);

  return safeHabits.reduce(
    (sum, habit) =>
      sum +
      getCompletedDates(habit).filter((dateKey) => dateKeys.has(dateKey)).length,
    0
  );
}

function getSafeHabits(habits) {
  return Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
}

function getCompletedDates(habit) {
  return getSafeDateKeys(habit?.completedDates);
}

function getHabitProfiles(habits) {
  return getSafeHabits(habits).map((habit) => {
    const completedDates = getCompletedDates(habit);

    return {
      completedDates,
      completedSet: new Set(completedDates),
      habit,
      startDate:
        getHabitStartDate(habit, completedDates) || startOfDay(new Date()),
    };
  });
}

function getSafeDateKeys(completedDates) {
  if (!Array.isArray(completedDates)) {
    return [];
  }

  return Array.from(
    new Set(
      completedDates.filter(
        (dateKey) =>
          typeof dateKey === "string" && isValidDateKey(dateKey)
      )
    )
  ).sort();
}

function getPreviousScheduledDate(date, habit) {
  let cursor = addDays(date, -1);

  for (let attempts = 0; attempts < 14; attempts += 1) {
    if (isScheduledDate(cursor, habit)) {
      return cursor;
    }

    cursor = addDays(cursor, -1);
  }

  return null;
}

function isScheduledOpportunity(
  habit,
  date,
  startDate = getHabitStartDate(habit)
) {
  if (!habit || typeof habit !== "object") {
    return true;
  }

  return (
    (!startDate || startOfDay(date) >= startDate) &&
    isScheduledDate(date, habit)
  );
}

export function isHabitScheduledOnDate(habit, dateKey) {
  if (typeof dateKey !== "string" || !isValidDateKey(dateKey)) {
    return false;
  }

  const date = dateKeyToLocalDate(dateKey);

  return isScheduledOpportunity(habit, date);
}

function isScheduledDate(date, habit) {
  const scheduledWeekdays = getScheduledWeekdays(habit);

  if (!scheduledWeekdays) {
    return true;
  }

  return scheduledWeekdays.has(getWeekdayLabel(date));
}

function getScheduledWeekdays(habit) {
  if (!habit || typeof habit !== "object") {
    return null;
  }

  if (habit.frequency === "Weekdays") {
    return new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  }

  if (habit.frequency === "Custom") {
    const customDays = Array.isArray(habit.customDays) ? habit.customDays : [];

    return new Set(
      customDays.filter((day) =>
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].includes(day)
      )
    );
  }

  return null;
}

function getWeekdayLabel(date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

function getDateKeysForLastDays(numberOfDays) {
  const today = startOfDay(new Date());

  return new Set(
    Array.from({ length: numberOfDays }, (_, index) =>
      toDateKey(addDays(today, -index))
    )
  );
}

function getTopHabit(habitAnalytics) {
  return [...habitAnalytics].sort(
    (first, second) =>
      second.monthlyCompletionPercentage - first.monthlyCompletionPercentage ||
      second.currentStreak - first.currentStreak ||
      second.bestStreak - first.bestStreak
  )[0];
}

function getWeakestHabit(habitAnalytics) {
  return [...habitAnalytics].sort(
    (first, second) =>
      first.monthlyCompletionPercentage - second.monthlyCompletionPercentage ||
      first.currentStreak - second.currentStreak
  )[0];
}

function getBestCategory(habits) {
  const categories = {};

  habits.forEach((habit) => {
    const category = habit.category || "General";

    if (!categories[category]) {
      categories[category] = {
        completed: 0,
        habitCount: 0,
        name: category,
      };
    }

    categories[category].completed += getCompletionCountInLastDays([habit], 30);
    categories[category].habitCount += 1;
  });

  return Object.values(categories)
    .map((category) => ({
      ...category,
      monthlyAverage:
        category.habitCount === 0
          ? 0
          : Math.round(category.completed / category.habitCount),
    }))
    .sort((first, second) => second.monthlyAverage - first.monthlyAverage)[0];
}

function getAnalyticsInsights({
  bestCategory,
  habitAnalytics,
  mostConsistentHabit,
  weakestHabit,
}) {
  if (habitAnalytics.length === 0) {
    return ["Create a habit first. Insights appear after you complete it."];
  }

  const insights = [];

  if (mostConsistentHabit) {
    insights.push(
      `${mostConsistentHabit.habit.name} is your strongest habit.`
    );
  }

  if (bestCategory) {
    insights.push(
      `You are most consistent with ${bestCategory.name}.`
    );
  }

  const droppedHabit = habitAnalytics.find((item) => {
    const previousWeek = item.trend[item.trend.length - 2]?.percentage || 0;
    const currentWeek = item.trend[item.trend.length - 1]?.percentage || 0;

    return previousWeek - currentWeek >= 25;
  });

  if (droppedHabit) {
    insights.push(`${droppedHabit.habit.name} completion dropped this week.`);
  } else if (weakestHabit && weakestHabit.monthlyCompletionPercentage < 50) {
    insights.push(`${weakestHabit.habit.name} has the most room to improve.`);
  }

  return insights.slice(0, 3);
}

function getPreviousProgressOverview(habits, period) {
  const safeHabits = getSafeHabits(habits);
  const currentDays = getPeriodDays(safeHabits, period);

  if (currentDays.length === 0) {
    return getCompletionSummaryForDays(safeHabits, []);
  }

  const previousEnd = addDays(currentDays[0], -1);
  const previousStart = addDays(previousEnd, -(currentDays.length - 1));

  return getCompletionSummaryForDays(
    safeHabits,
    getDateRangeDays(previousStart, previousEnd)
  );
}

function getCompletionSummaryForDays(habits, days) {
  const habitProfiles = getHabitProfiles(habits);
  const daySummaries = days.map((date) => {
    const dateKey = toDateKey(date);
    const scheduledHabits = habitProfiles.filter((profile) =>
      isScheduledOpportunity(profile.habit, date, profile.startDate)
    );
    const completedCount = scheduledHabits.filter((profile) =>
      profile.completedSet.has(dateKey)
    ).length;
    const percentage =
      scheduledHabits.length === 0
        ? 0
        : Math.round((completedCount / scheduledHabits.length) * 100);

    return {
      completedCount,
      dateKey,
      label: date
        .toLocaleDateString(undefined, { weekday: "short" })
        .slice(0, 1),
      percentage,
      totalHabits: scheduledHabits.length,
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
    possibleCount === 0
      ? 0
      : Math.round((completedCount / possibleCount) * 100);

  return {
    completedCount,
    completionRate,
    days: daySummaries,
    possibleCount,
  };
}

function getTrendPoints(habits, period) {
  const safeHabits = getSafeHabits(habits);
  const today = startOfDay(new Date());

  if (period === "week") {
    return getCompletionSummaryForDays(
      safeHabits,
      getDateRangeDays(addDays(today, -6), today)
    ).days.map((day) => ({
      label: day.label,
      percentage: day.percentage,
    }));
  }

  const bucketCount = period === "year" || period === "all" ? 6 : 5;
  const bucketSize = period === "year" || period === "all" ? 30 : 7;

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketEnd = addDays(today, -((bucketCount - index - 1) * bucketSize));
    const bucketStart = addDays(bucketEnd, -(bucketSize - 1));
    const summary = getCompletionSummaryForDays(
      safeHabits,
      getDateRangeDays(bucketStart, bucketEnd)
    );

    return {
      label:
        period === "month"
          ? `W${index + 1}`
          : bucketEnd.toLocaleDateString(undefined, { month: "short" }),
      percentage: summary.completionRate,
    };
  });
}

function getHabitTrendForPeriod(habit, period) {
  return getTrendPoints([habit], period);
}

function getPeriodDays(habits, period) {
  const today = startOfDay(new Date());

  if (period === "week") {
    return getDateRangeDays(addDays(today, -6), today);
  }

  if (period === "year") {
    return getDateRangeDays(addDays(today, -364), today);
  }

  if (period === "all") {
    const oldestDate = getOldestRelevantDate(habits) || addDays(today, -29);

    return getDateRangeDays(oldestDate, today);
  }

  return getDateRangeDays(addDays(today, -29), today);
}

function getDateRangeDays(startDate, endDate) {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const days = [];
  let cursor = start;

  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
}

function getOldestRelevantDate(habits) {
  const dates = getSafeHabits(habits).flatMap((habit) => {
    const createdAt = parseStoredDate(habit.createdAt);
    const safeCreatedAt =
      createdAt && !Number.isNaN(createdAt.getTime())
        ? [startOfDay(createdAt)]
        : [];
    const completedDates = getCompletedDates(habit).map(dateKeyToLocalDate);

    return [...safeCreatedAt, ...completedDates];
  });

  return dates.length
    ? dates.reduce((oldest, date) => (date < oldest ? date : oldest), dates[0])
    : null;
}

// `completedDates` intentionally has no default *value* here - only a
// default of "not provided". A default expression like
// `completedDates = getCompletedDates(habit)` is evaluated eagerly by JS
// on every call that omits the argument, regardless of whether the
// function body ends up using it - and the common path below (a valid
// createdAt) never does. getCompletedDates() re-filters, dedupes, and
// sorts the habit's full completedDates array, so with that as an eager
// default this function was paying an O(m log m) cost on every call from
// every caller that didn't pass completedDates explicitly (isHabitScheduledOnDate
// among them, itself called once per day per habit in every day-range
// loop in the app) for a value that was then thrown away unread.
function getHabitStartDate(habit, completedDates) {
  const createdAt = parseStoredDate(habit?.createdAt);

  if (createdAt) {
    return startOfDay(createdAt);
  }

  const safeCompletedDates = completedDates || getCompletedDates(habit);
  const firstCompletion = safeCompletedDates[0];

  return firstCompletion ? dateKeyToLocalDate(firstCompletion) : null;
}

function parseStoredDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? dateKeyToLocalDate(value)
    : new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
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

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}
