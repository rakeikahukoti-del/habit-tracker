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
  return habit.completedDates.includes(getTodayKey());
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
  const completedSet = new Set(habit.completedDates);

  return getWeekDays().map((day) => ({
    ...day,
    completed: completedSet.has(day.dateKey),
  }));
}

export function getStatsSummary(habits) {
  const weekDays = getWeekDays();
  const totalHabits = habits.length;
  const completedToday = habits.filter(wasCompletedToday).length;
  const currentLongestStreak = habits.reduce(
    (longest, habit) =>
      Math.max(longest, getCurrentStreak(habit.completedDates)),
    0
  );
  const bestAllTimeStreak = habits.reduce(
    (best, habit) => Math.max(best, getBestStreak(habit.completedDates)),
    0
  );
  const weeklySummary = getWeeklyCompletionSummary(habits, weekDays);
  const totalPossibleCompletions = totalHabits * weekDays.length;
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
  return weekDays.map((day) => {
    const completedCount = habits.filter((habit) =>
      habit.completedDates.includes(day.dateKey)
    ).length;
    const percentage =
      habits.length === 0
        ? 0
        : Math.round((completedCount / habits.length) * 100);

    return {
      ...day,
      completedCount,
      totalHabits: habits.length,
      percentage,
    };
  });
}

export function getHabitHistoryDays(habit, numberOfDays = 30) {
  const completedSet = new Set(habit.completedDates);
  const todayKey = getTodayKey();
  const today = startOfDay(new Date());

  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = addDays(today, index - (numberOfDays - 1));
    const dateKey = toDateKey(date);

    return {
      dateKey,
      dayOfMonth: date.getDate(),
      label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      completed: completedSet.has(dateKey),
      isToday: dateKey === todayKey,
    };
  });
}

export function getAnalyticsSummary(habits, gamification = null) {
  const habitAnalytics = habits.map(getHabitAnalytics);
  const totalCompletions = habits.reduce(
    (sum, habit) => sum + habit.completedDates.length,
    0
  );
  const habitsCompletedThisWeek = getCompletionCountInLastDays(habits, 7);
  const habitsCompletedThisMonth = getCompletionCountInLastDays(habits, 30);
  const mostConsistentHabit = getTopHabit(habitAnalytics);
  const weakestHabit = getWeakestHabit(habitAnalytics);
  const bestCategory = getBestCategory(habits);
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
    bestStreak: getBestStreak(completedDates),
    category: habit.category || "General",
    completionRate,
    currentStreak: getCurrentStreak(completedDates),
    habit,
    monthlyCompletionPercentage,
    trend: getHabitTrend(habit),
    weeklyCompletionPercentage,
  };
}

export function getCurrentStreak(completedDates) {
  const completedSet = new Set(completedDates);
  const today = startOfDay(new Date());
  let cursor = completedSet.has(toDateKey(today)) ? today : addDays(today, -1);
  let streak = 0;

  while (completedSet.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function getBestStreak(completedDates) {
  const sortedDates = getSortedUniqueDateKeys(completedDates);

  if (sortedDates.length === 0) {
    return 0;
  }

  let best = 1;
  let current = 1;

  for (let index = 1; index < sortedDates.length; index += 1) {
    const previous = dateKeyToLocalDate(sortedDates[index - 1]);
    const currentDate = dateKeyToLocalDate(sortedDates[index]);
    const differenceInDays = Math.round((currentDate - previous) / MS_PER_DAY);

    if (differenceInDays === 1) {
      current += 1;
    } else {
      current = 1;
    }

    best = Math.max(best, current);
  }

  return best;
}

function getSortedUniqueDateKeys(completedDates) {
  return Array.from(new Set(completedDates)).sort();
}

function getHabitCompletionRate(habit) {
  const createdAt = habit.createdAt ? new Date(habit.createdAt) : new Date();
  const today = startOfDay(new Date());
  const createdDate =
    Number.isNaN(createdAt.getTime()) ? today : startOfDay(createdAt);
  const daysSinceCreated =
    Math.max(1, Math.round((today - createdDate) / MS_PER_DAY) + 1);
  const completedCount = new Set(habit.completedDates || []).size;

  return Math.min(100, Math.round((completedCount / daysSinceCreated) * 100));
}

function getHabitCompletionPercentageForDays(habit, numberOfDays) {
  const completedSet = new Set(habit.completedDates || []);
  const today = startOfDay(new Date());
  let completedCount = 0;

  for (let index = 0; index < numberOfDays; index += 1) {
    const date = addDays(today, -index);

    if (completedSet.has(toDateKey(date))) {
      completedCount += 1;
    }
  }

  return Math.round((completedCount / numberOfDays) * 100);
}

function getHabitTrend(habit) {
  const completedSet = new Set(habit.completedDates || []);
  const today = startOfDay(new Date());

  return Array.from({ length: 4 }, (_, index) => {
    const weekOffset = 3 - index;
    const weekEnd = addDays(today, -(weekOffset * 7));
    const weekStart = addDays(weekEnd, -6);
    let completedCount = 0;

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addDays(weekStart, dayIndex);

      if (completedSet.has(toDateKey(date))) {
        completedCount += 1;
      }
    }

    return {
      completedCount,
      label: `W${index + 1}`,
      percentage: Math.round((completedCount / 7) * 100),
    };
  });
}

function getCompletionCountInLastDays(habits, numberOfDays) {
  const dateKeys = getDateKeysForLastDays(numberOfDays);

  return habits.reduce(
    (sum, habit) =>
      sum +
      habit.completedDates.filter((dateKey) => dateKeys.has(dateKey)).length,
    0
  );
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
    return ["Add habits to start building useful insights."];
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
