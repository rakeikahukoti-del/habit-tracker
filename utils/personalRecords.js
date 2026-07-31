import {
  getBestStreak,
  isHabitScheduledOnDate,
  toDateKey,
} from "./habitStats";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COMPLETION_XP = 10;
const PERFECT_DAY_XP = 25;
const HABIT_MILESTONES = [10, 25, 50, 100, 250, 365];

export function getPersonalRecords(habits, gamification = null, now = new Date()) {
  return getAnalyticsAggregates(habits, gamification, now).personalRecords;
}

export function getLifetimeStats(habits, gamification = null, now = new Date()) {
  return getLifetimeStatsFromContext(buildAnalyticsContext(habits, now), gamification);
}

export function getAnalyticsAggregates(habits, gamification = null, now = new Date()) {
  const context = buildAnalyticsContext(habits, now);

  return getAnalyticsAggregatesFromContext(context, gamification);
}

function getAnalyticsAggregatesFromContext(context, gamification) {
  const lifetime = getLifetimeStatsFromContext(context, gamification);
  const dailyRecords = getDailyRecords(context);
  const weeklyRecords = getWeeklyRecords(context);
  const monthlyRecords = getMonthlyRecords(context);
  const habitRecords = getHabitRecords(context);
  const personalRecords = [
    dailyRecords.longestOverallStreak,
    dailyRecords.mostHabitsCompletedInOneDay,
    dailyRecords.mostConsecutivePerfectDays,
    weeklyRecords.highestWeeklyCompletionRate,
    monthlyRecords.highestMonthlyCompletionRate,
    habitRecords.mostCompletedHabit,
    habitRecords.longestRunningHabit,
    dailyRecords.highestXpEarnedInOneDay,
    weeklyRecords.highestXpEarnedInOneWeek,
    {
      id: "total-lifetime-completions",
      title: "Lifetime completions",
      value: formatNumber(lifetime.totalCompletions),
      rawValue: lifetime.totalCompletions,
      description: "Valid habit completions recorded.",
      achievedAt: lifetime.lastCompletionDate,
    },
  ].filter((record) => record && record.rawValue > 0);

  return {
    daySummaries: context.daySummaries,
    habitProfiles: context.habitProfiles,
    lifetime,
    monthlySummaries: context.monthlySummaries,
    personalRecords,
    todayKey: context.todayKey,
    weeklySummaries: context.weeklySummaries,
  };
}

export function getHabitMilestones(habit, now = new Date()) {
  const context = buildAnalyticsContext([habit], now);
  const profile = context.habitProfiles[0];
  const completionCount = profile?.completedDates.length || 0;
  const completedMilestones = HABIT_MILESTONES.filter(
    (milestone) => completionCount >= milestone
  );
  const nextMilestone =
    HABIT_MILESTONES.find((milestone) => completionCount < milestone) || null;

  return {
    completionCount,
    completedMilestones,
    milestones: HABIT_MILESTONES.map((milestone) => ({
      completed: completionCount >= milestone,
      remaining: Math.max(0, milestone - completionCount),
      target: milestone,
    })),
    nextMilestone,
    progressToNext:
      nextMilestone === null
        ? 100
        : Math.min(100, Math.round((completionCount / nextMilestone) * 100)),
  };
}

export function getMonthlyReview(habits, gamification = null, now = new Date()) {
  const context = buildAnalyticsContext(habits, now);
  const aggregates = getAnalyticsAggregatesFromContext(context, gamification);
  const currentMonthKey = getMonthKey(context.today);
  const month = context.monthlySummaries.find(
    (summary) => summary.key === currentMonthKey
  ) || {
    completedCount: 0,
    perfectDays: 0,
    possibleCount: 0,
    rate: 0,
  };
  const bestHabit = getBestHabitForMonth(context, currentMonthKey);
  const recordsThisMonth = aggregates.personalRecords.filter(
    (record) => record.achievedAt && record.achievedAt.startsWith(currentMonthKey)
  );

  return {
    bestHabit,
    completionRate: month.rate,
    hasMeaningfulData: month.completedCount > 0 || month.possibleCount > 0,
    label: formatMonthLabel(currentMonthKey),
    perfectDays: month.perfectDays,
    recordsAchieved: recordsThisMonth.slice(0, 3),
    totalCompletions: month.completedCount,
    totalXpEarned: getXpForDates(context, month.dateKeys),
  };
}

export function getMonthlyAggregates(habits, now = new Date()) {
  return buildAnalyticsContext(habits, now).monthlySummaries;
}

export function getQuarterlyAggregates(habits, now = new Date()) {
  const context = buildAnalyticsContext(habits, now);
  const quarters = new Map();

  context.monthlySummaries.forEach((month) => {
    const [year, monthNumber] = month.key.split("-").map(Number);
    const quarter = Math.ceil(monthNumber / 3);
    const key = `${year}-Q${quarter}`;
    const existing = quarters.get(key) || {
      completedCount: 0,
      key,
      label: `Q${quarter} ${year}`,
      perfectDays: 0,
      possibleCount: 0,
      rate: 0,
    };

    existing.completedCount += month.completedCount;
    existing.perfectDays += month.perfectDays;
    existing.possibleCount += month.possibleCount;
    existing.rate = getPercentage(existing.completedCount, existing.possibleCount);
    quarters.set(key, existing);
  });

  return Array.from(quarters.values()).sort((first, second) =>
    first.key.localeCompare(second.key)
  );
}

export function getYearlyAggregates(habits, now = new Date()) {
  const context = buildAnalyticsContext(habits, now);
  const years = new Map();

  context.monthlySummaries.forEach((month) => {
    const key = month.key.slice(0, 4);
    const existing = years.get(key) || {
      completedCount: 0,
      key,
      label: key,
      perfectDays: 0,
      possibleCount: 0,
      rate: 0,
    };

    existing.completedCount += month.completedCount;
    existing.perfectDays += month.perfectDays;
    existing.possibleCount += month.possibleCount;
    existing.rate = getPercentage(existing.completedCount, existing.possibleCount);
    years.set(key, existing);
  });

  return Array.from(years.values()).sort((first, second) =>
    first.key.localeCompare(second.key)
  );
}

function buildAnalyticsContext(habits, now) {
  const today = startOfDay(now);
  const todayKey = toDateKey(today);
  const safeHabits = Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
  const habitProfiles = safeHabits.map((habit, index) => {
    const completedDates = getSafeDateKeys(habit.completedDates, todayKey);
    const startDate = getHabitStartDate(habit, completedDates, today);

    return {
      completedDates,
      completedSet: new Set(completedDates),
      habit,
      index,
      startDate,
    };
  });
  const oldestDate = getOldestDate(habitProfiles, today);
  const days = getDateRangeDays(oldestDate, today);
  const daySummaries = days.map((date) => getDaySummary(date, habitProfiles));
  const weeklySummaries = getPeriodSummaries(daySummaries, getWeekKey, formatWeekLabel);
  const monthlySummaries = getPeriodSummaries(
    daySummaries,
    getMonthKey,
    formatMonthLabel
  );

  return {
    daySummaries,
    habitProfiles,
    monthlySummaries,
    today,
    todayKey,
    weeklySummaries,
  };
}

function getLifetimeStatsFromContext(context, gamification) {
  const totalCompletions = context.habitProfiles.reduce(
    (sum, profile) => sum + profile.completedDates.length,
    0
  );
  const scheduledCompletionCount = context.daySummaries.reduce(
    (sum, day) => sum + day.completedCount,
    0
  );
  const totalScheduledOpportunities = context.daySummaries.reduce(
    (sum, day) => sum + day.possibleCount,
    0
  );
  const activeDays = context.daySummaries.filter((day) => day.actualCompletions > 0)
    .length;
  const firstDate = context.daySummaries[0]?.dateKey || context.todayKey;
  const lastCompletionDate = getLastCompletionDate(context.habitProfiles);

  return {
    averageCompletionsPerActiveDay:
      activeDays === 0 ? 0 : Number((totalCompletions / activeDays).toFixed(1)),
    averageWeeklyCompletion: getAverageRate(context.weeklySummaries),
    daysUsingMomentum:
      Math.max(1, daysBetween(dateKeyToLocalDate(firstDate), context.today) + 1),
    lastCompletionDate,
    overallCompletionRate: getPercentage(
      scheduledCompletionCount,
      totalScheduledOpportunities
    ),
    totalCompletions,
    totalPerfectDays: context.daySummaries.filter((day) => day.isPerfect).length,
    totalScheduledOpportunities,
    totalStreakDaysAccumulated: scheduledCompletionCount,
    totalXpEarned:
      Number.isFinite(gamification?.xp) && gamification.xp >= 0
        ? gamification.xp
        : getDerivedXp(context),
  };
}

function getDailyRecords(context) {
  const bestDay = getBestSummary(context.daySummaries, "actualCompletions");
  const bestPerfectRun = getBestPerfectDayRun(context.daySummaries);
  const bestXpDay = context.daySummaries
    .map((day) => ({
      ...day,
      xp: day.actualCompletions * COMPLETION_XP + (day.isPerfect ? PERFECT_DAY_XP : 0),
    }))
    .sort(
      (first, second) =>
        second.xp - first.xp || first.dateKey.localeCompare(second.dateKey)
    )[0];
  const longestStreak = context.habitProfiles
    .map((profile) => ({
      dateKey: getLastCompletionDate([profile]),
      name: profile.habit.name || "Habit",
      streak: getBestStreak(profile.completedDates, profile.habit),
    }))
    .sort((first, second) => second.streak - first.streak || first.name.localeCompare(second.name))[0];

  return {
    highestXpEarnedInOneDay:
      bestXpDay && bestXpDay.xp > 0
        ? {
            achievedAt: bestXpDay.dateKey,
            description: "Most XP earned from completions and perfect-day bonus.",
            id: "highest-xp-day",
            rawValue: bestXpDay.xp,
            title: "Best XP day",
            value: `${bestXpDay.xp} XP`,
          }
        : null,
    longestOverallStreak:
      longestStreak && longestStreak.streak > 0
        ? {
            achievedAt: longestStreak.dateKey,
            description: `${longestStreak.name} holds this record.`,
            id: "longest-overall-streak",
            rawValue: longestStreak.streak,
            title: "Longest streak",
            value: `${longestStreak.streak} days`,
          }
        : null,
    mostConsecutivePerfectDays:
      bestPerfectRun.count > 0
        ? {
            achievedAt: bestPerfectRun.endDate,
            description: "Scheduled days where every habit was completed.",
            id: "perfect-day-run",
            rawValue: bestPerfectRun.count,
            title: "Perfect-day run",
            value: `${bestPerfectRun.count} days`,
          }
        : null,
    mostHabitsCompletedInOneDay:
      bestDay && bestDay.actualCompletions > 0
        ? {
            achievedAt: bestDay.dateKey,
            description: "Highest number of habits completed on one date.",
            id: "most-completions-day",
            rawValue: bestDay.actualCompletions,
            title: "Best completion day",
            value: `${bestDay.actualCompletions} habits`,
          }
        : null,
  };
}

function getWeeklyRecords(context) {
  const bestWeek = getBestRatedSummary(context.weeklySummaries);
  const bestXpWeek = context.weeklySummaries
    .map((week) => ({
      ...week,
      xp: getXpForDates(context, week.dateKeys),
    }))
    .sort(
      (first, second) =>
        second.xp - first.xp || first.key.localeCompare(second.key)
    )[0];

  return {
    highestWeeklyCompletionRate:
      bestWeek && bestWeek.rate > 0
        ? {
            achievedAt: bestWeek.endDate,
            description: `${bestWeek.completedCount} of ${bestWeek.possibleCount} scheduled completions.`,
            id: "highest-weekly-rate",
            rawValue: bestWeek.rate,
            title: "Best week",
            value: `${bestWeek.rate}%`,
          }
        : null,
    highestXpEarnedInOneWeek:
      bestXpWeek && bestXpWeek.xp > 0
        ? {
            achievedAt: bestXpWeek.endDate,
            description: "Most XP earned in a calendar week.",
            id: "highest-xp-week",
            rawValue: bestXpWeek.xp,
            title: "Best XP week",
            value: `${bestXpWeek.xp} XP`,
          }
        : null,
  };
}

function getMonthlyRecords(context) {
  const bestMonth = getBestRatedSummary(context.monthlySummaries);

  return {
    highestMonthlyCompletionRate:
      bestMonth && bestMonth.rate > 0
        ? {
            achievedAt: bestMonth.endDate,
            description: `${bestMonth.completedCount} of ${bestMonth.possibleCount} scheduled completions.`,
            id: "highest-monthly-rate",
            rawValue: bestMonth.rate,
            title: "Best month",
            value: `${bestMonth.rate}%`,
          }
        : null,
  };
}

function getHabitRecords(context) {
  const totalCompletions = context.habitProfiles.reduce(
    (sum, profile) => sum + profile.completedDates.length,
    0
  );
  const mostCompletedHabit = context.habitProfiles
    .map((profile) => ({
      count: profile.completedDates.length,
      dateKey: getLastCompletionDate([profile]),
      name: profile.habit.name || "Habit",
    }))
    .sort(
      (first, second) =>
        second.count - first.count || first.name.localeCompare(second.name)
    )[0];
  const longestRunningHabit = context.habitProfiles
    .map((profile) => ({
      days: Math.max(1, daysBetween(profile.startDate, context.today) + 1),
      name: profile.habit.name || "Habit",
      startDate: toDateKey(profile.startDate),
    }))
    .sort(
      (first, second) =>
        second.days - first.days || first.name.localeCompare(second.name)
    )[0];

  return {
    longestRunningHabit:
      longestRunningHabit && totalCompletions > 0 && longestRunningHabit.days > 0
        ? {
            achievedAt: longestRunningHabit.startDate,
            description: `${longestRunningHabit.name} has been tracked the longest.`,
            id: "longest-running-habit",
            rawValue: longestRunningHabit.days,
            title: "Longest-running habit",
            value: `${longestRunningHabit.days} days`,
          }
        : null,
    mostCompletedHabit:
      mostCompletedHabit && mostCompletedHabit.count > 0
        ? {
            achievedAt: mostCompletedHabit.dateKey,
            description: `${mostCompletedHabit.name} has the most completions.`,
            id: "most-completed-habit",
            rawValue: mostCompletedHabit.count,
            title: "Most completed habit",
            value: `${mostCompletedHabit.count} times`,
          }
        : null,
  };
}

function getBestHabitForMonth(context, monthKey) {
  return context.habitProfiles
    .map((profile) => {
      const habitId = profile.habit.id || `habit-${profile.index}`;
      const monthDays = context.daySummaries.filter(
        (day) =>
          day.dateKey.startsWith(monthKey) && day.scheduledHabitIds.has(habitId)
      );
      const possibleCount = monthDays.length;
      const completedCount = monthDays.filter((day) =>
        profile.completedSet.has(day.dateKey)
      ).length;

      return {
        completionRate: getPercentage(completedCount, possibleCount),
        completedCount,
        name: profile.habit.name || "Habit",
        possibleCount,
      };
    })
    .filter((habit) => habit.possibleCount > 0 && habit.completedCount > 0)
    .sort(
      (first, second) =>
        second.completionRate - first.completionRate ||
        second.completedCount - first.completedCount ||
        first.name.localeCompare(second.name)
    )[0] || null;
}

function getDaySummary(date, habitProfiles) {
  const dateKey = toDateKey(date);
  const scheduledProfiles = habitProfiles.filter(
    (profile) =>
      isHabitScheduledOnDate(profile.habit, dateKey) && date >= profile.startDate
  );
  const completedCount = scheduledProfiles.filter((profile) =>
    profile.completedSet.has(dateKey)
  ).length;
  const actualCompletions = habitProfiles.filter((profile) =>
    profile.completedSet.has(dateKey)
  ).length;

  return {
    actualCompletions,
    completedCount,
    dateKey,
    isPerfect:
      scheduledProfiles.length > 0 && completedCount === scheduledProfiles.length,
    possibleCount: scheduledProfiles.length,
    scheduledHabitIds: new Set(
      scheduledProfiles.map(
        (profile) => profile.habit.id || `habit-${profile.index}`
      )
    ),
  };
}

function getPeriodSummaries(daySummaries, getKey, getLabel) {
  const summaries = new Map();

  daySummaries.forEach((day) => {
    const key = getKey(dateKeyToLocalDate(day.dateKey));
    const existing = summaries.get(key) || {
      completedCount: 0,
      dateKeys: [],
      endDate: day.dateKey,
      key,
      label: getLabel(key),
      perfectDays: 0,
      possibleCount: 0,
      rate: 0,
      startDate: day.dateKey,
    };

    existing.completedCount += day.completedCount;
    existing.dateKeys.push(day.dateKey);
    existing.endDate = day.dateKey;
    existing.perfectDays += day.isPerfect ? 1 : 0;
    existing.possibleCount += day.possibleCount;
    existing.rate = getPercentage(existing.completedCount, existing.possibleCount);
    summaries.set(key, existing);
  });

  return Array.from(summaries.values()).sort((first, second) =>
    first.key.localeCompare(second.key)
  );
}

function getBestSummary(summaries, property) {
  return [...summaries].sort(
    (first, second) =>
      second[property] - first[property] ||
      first.dateKey.localeCompare(second.dateKey)
  )[0];
}

function getBestRatedSummary(summaries) {
  return [...summaries]
    .filter((summary) => summary.possibleCount > 0)
    .sort(
      (first, second) =>
        second.rate - first.rate ||
        second.completedCount - first.completedCount ||
        first.key.localeCompare(second.key)
    )[0];
}

function getBestPerfectDayRun(daySummaries) {
  let best = { count: 0, endDate: null };
  let current = { count: 0, endDate: null };

  daySummaries.forEach((day) => {
    if (day.possibleCount === 0) {
      return;
    }

    if (day.isPerfect) {
      current = {
        count: current.count + 1,
        endDate: day.dateKey,
      };
    } else {
      current = { count: 0, endDate: null };
    }

    if (current.count > best.count) {
      best = { ...current };
    }
  });

  return best;
}

function getXpForDates(context, dateKeys) {
  const dateKeySet = new Set(dateKeys);

  return context.daySummaries
    .filter((day) => dateKeySet.has(day.dateKey))
    .reduce(
      (sum, day) =>
        sum +
        day.actualCompletions * COMPLETION_XP +
        (day.isPerfect ? PERFECT_DAY_XP : 0),
      0
    );
}

function getDerivedXp(context) {
  return context.daySummaries.reduce(
    (sum, day) =>
      sum +
      day.actualCompletions * COMPLETION_XP +
      (day.isPerfect ? PERFECT_DAY_XP : 0),
    0
  );
}

function getAverageRate(summaries) {
  const ratedSummaries = summaries.filter((summary) => summary.possibleCount > 0);

  if (ratedSummaries.length === 0) {
    return 0;
  }

  return Math.round(
    ratedSummaries.reduce((sum, summary) => sum + summary.rate, 0) /
      ratedSummaries.length
  );
}

function getLastCompletionDate(habitProfiles) {
  const dates = habitProfiles.flatMap((profile) => profile.completedDates);

  return dates.length ? dates.sort()[dates.length - 1] : null;
}

function getOldestDate(habitProfiles, today) {
  const dates = habitProfiles.flatMap((profile) => [
    profile.startDate,
    ...profile.completedDates.map(dateKeyToLocalDate),
  ]);

  if (dates.length === 0) {
    return today;
  }

  return dates.reduce((oldest, date) => (date < oldest ? date : oldest), dates[0]);
}

function getHabitStartDate(habit, completedDates, today) {
  const createdAt = parseStoredDate(habit?.createdAt);

  if (createdAt && createdAt <= today) {
    return createdAt;
  }

  const firstCompletion = completedDates[0];

  return firstCompletion ? dateKeyToLocalDate(firstCompletion) : today;
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

function parseStoredDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? dateKeyToLocalDate(value)
    : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return startOfDay(parsedDate);
}

function isValidDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  return toDateKey(dateKeyToLocalDate(dateKey)) === dateKey;
}

function getWeekKey(date) {
  return toDateKey(startOfWeek(date));
}

function formatWeekLabel(key) {
  const date = dateKeyToLocalDate(key);

  return `Week of ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

function getMonthKey(date) {
  return toDateKey(date).slice(0, 7);
}

function formatMonthLabel(key) {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function startOfWeek(date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + diff);

  return start;
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

function daysBetween(startDate, endDate) {
  return Math.round((startOfDay(endDate) - startOfDay(startDate)) / MS_PER_DAY);
}

function getPercentage(completedCount, possibleCount) {
  if (!Number.isFinite(completedCount) || !Number.isFinite(possibleCount)) {
    return 0;
  }

  if (possibleCount <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round((completedCount / possibleCount) * 100))
  );
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString() : "0";
}
