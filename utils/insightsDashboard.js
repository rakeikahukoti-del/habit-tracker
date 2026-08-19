import {
  getBestStreak,
  getCurrentStreak,
  isHabitScheduledOnDate,
  toDateKey,
} from "./habitStats";
import { getAnalyticsAggregates } from "./personalRecords";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SIGNIFICANT_TREND_POINTS = 8;
const MIN_TREND_OPPORTUNITIES = 3;
const MIN_RANKING_OPPORTUNITIES = 5;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getInsightsDashboard(habits, gamification = null, now = new Date()) {
  const safeHabits = getSafeHabits(habits);
  // Built once and threaded through every consistency/comparison call
  // below, instead of each one independently re-filtering, deduping, and
  // sorting every habit's completedDates - see the perf-baseline report.
  // Cutoff is `now`, the broadest date any of these calls ever needs: each
  // call only ever looks up dateKeys <= its own (earlier-or-equal) endDate,
  // so a cache built to `now` is a safe superset for all of them.
  const caches = getHabitConsistencyCaches(safeHabits, now);
  const aggregates = getAnalyticsAggregates(safeHabits, gamification, now);
  const consistency = {
    currentMonth: getMonthToDateConsistency(safeHabits, now, caches),
    currentWeek: getCurrentWeekConsistency(safeHabits, now, caches),
    last30Days: getConsistencyScoreForLastDays(safeHabits, 30, now, caches),
    last90Days: getConsistencyScoreForLastDays(safeHabits, 90, now, caches),
    overall: getConsistencyFromDaySummaries(aggregates.daySummaries),
    previousMonth: getPreviousMonthToDateConsistency(safeHabits, now, caches),
    previousWeek: getPreviousWeekToDateConsistency(safeHabits, now, caches),
  };
  const weeklyComparison = getWeeklyComparison(safeHabits, now, caches);
  const monthlyComparison = getMonthlyComparison(safeHabits, now, caches);
  const rollingTrend = getTrendComparison(safeHabits, {
    currentDays: 30,
    now,
    previousDays: 30,
  }, caches);
  const habitRankings = getHabitRankings(safeHabits, now);
  const weekdayConsistency = getWeekdayConsistency(aggregates.daySummaries);
  const insightCards = getInsightCards({
    aggregates,
    consistency,
    habitRankings,
    monthlyComparison,
    rollingTrend,
    weekdayConsistency,
    weeklyComparison,
  });
  const dashboardSections = getDashboardSections({
    aggregates,
    consistency,
    habitRankings,
    insightCards,
    monthlyComparison,
    rollingTrend,
    weeklyComparison,
  });

  return {
    consistency,
    dashboardSections,
    habitRankings,
    insightCards,
    monthlyComparison,
    readiness: getInsightsReadiness(aggregates),
    rollingTrend,
    totals: aggregates.lifetime,
    weeklyComparison,
    weekdayConsistency,
  };
}

export function getConsistencyScoreForLastDays(
  habits,
  numberOfDays,
  now = new Date(),
  caches = null
) {
  const today = startOfDay(now);
  const start = addDays(today, -(Math.max(1, numberOfDays) - 1));

  return getConsistencyScore(habits, { endDate: today, startDate: start }, caches);
}

export function getConsistencyScore(habits, { endDate, startDate }, caches = null) {
  const safeHabits = getSafeHabits(habits);
  const start = startOfDay(startDate || new Date());
  const end = startOfDay(endDate || start);

  if (end < start || safeHabits.length === 0) {
    return createConsistencySummary(0, 0);
  }

  // Caller-supplied caches are assumed to already correspond to `habits`
  // (every call site in this file builds them from the same habits array
  // it passes down) - only build fresh here for standalone/external calls
  // that don't have one to share. `end`, not `now`, is a safe cutoff in
  // that fallback case: this function never looks up a dateKey later than
  // `end`, so a cache built to exactly that bound is still a correct
  // (if narrower) equivalent of the eager per-day rebuild it replaces.
  const safeCaches = caches || getHabitConsistencyCaches(safeHabits, end);

  return getConsistencyFromDaySummaries(
    getDateRangeDays(start, end).map((date) =>
      getDayConsistencySummary(date, safeCaches)
    )
  );
}

export function getTrendComparison(
  habits,
  {
    currentDays = 7,
    minOpportunities = MIN_TREND_OPPORTUNITIES,
    now = new Date(),
    previousDays = currentDays,
    threshold = SIGNIFICANT_TREND_POINTS,
  } = {},
  caches = null
) {
  const safeCaches = caches || getHabitConsistencyCaches(getSafeHabits(habits), now);
  const today = startOfDay(now);
  const currentStart = addDays(today, -(currentDays - 1));
  const previousEnd = addDays(currentStart, -1);
  const previousStart = addDays(previousEnd, -(previousDays - 1));
  const current = getConsistencyScore(habits, {
    endDate: today,
    startDate: currentStart,
  }, safeCaches);
  const previous = getConsistencyScore(habits, {
    endDate: previousEnd,
    startDate: previousStart,
  }, safeCaches);

  return getComparisonResult(current, previous, {
    currentLabel: `Last ${currentDays} days`,
    minOpportunities,
    previousLabel: `Previous ${previousDays} days`,
    threshold,
  });
}

export function getWeeklyComparison(habits, now = new Date(), caches = null) {
  const safeCaches = caches || getHabitConsistencyCaches(getSafeHabits(habits), now);
  const today = startOfDay(now);
  const weekStart = getStartOfWeek(today);
  const elapsedDays = daysBetween(weekStart, today) + 1;
  const previousWeekStart = addDays(weekStart, -7);
  const previousWeekEnd = addDays(previousWeekStart, elapsedDays - 1);
  const current = getConsistencyScore(habits, {
    endDate: today,
    startDate: weekStart,
  }, safeCaches);
  const previous = getConsistencyScore(habits, {
    endDate: previousWeekEnd,
    startDate: previousWeekStart,
  }, safeCaches);

  return getComparisonResult(current, previous, {
    currentLabel: "This week",
    previousLabel: "Last week",
  });
}

export function getMonthlyComparison(habits, now = new Date(), caches = null) {
  const safeCaches = caches || getHabitConsistencyCaches(getSafeHabits(habits), now);
  const today = startOfDay(now);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const elapsedDays = daysBetween(monthStart, today) + 1;
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0);
  const previousMonthEnd = addDays(
    previousMonthStart,
    Math.min(elapsedDays, previousMonthLastDay.getDate()) - 1
  );
  const current = getConsistencyScore(habits, {
    endDate: today,
    startDate: monthStart,
  }, safeCaches);
  const previous = getConsistencyScore(habits, {
    endDate: previousMonthEnd,
    startDate: previousMonthStart,
  }, safeCaches);

  return getComparisonResult(current, previous, {
    currentLabel: "This month",
    previousLabel: "Last month",
  });
}

export function getHabitRankings(habits, now = new Date()) {
  const rankedHabits = getSafeHabits(habits)
    .map((habit, index) => getHabitStrength(habit, now, index))
    .sort(
      (first, second) =>
        second.score - first.score ||
        second.completionRate - first.completionRate ||
        first.name.localeCompare(second.name)
    );
  const rankable = rankedHabits.filter((habit) => habit.hasSufficientData);
  const strongest = rankable.slice(0, 3);
  const needsAttention = [...rankable]
    .filter((habit) => habit.possibleCount > 0 && habit.completionRate < 75)
    .sort(
      (first, second) =>
        first.completionRate - second.completionRate ||
        first.currentStreak - second.currentStreak ||
        first.name.localeCompare(second.name)
    )
    .slice(0, 3);
  const improving = [...rankable]
    .filter((habit) => habit.trend.direction === "improving")
    .sort(
      (first, second) =>
        second.trend.delta - first.trend.delta || first.name.localeCompare(second.name)
    )
    .slice(0, 3);
  const declining = [...rankable]
    .filter((habit) => habit.trend.direction === "declining")
    .sort(
      (first, second) =>
        first.trend.delta - second.trend.delta || first.name.localeCompare(second.name)
    )
    .slice(0, 3);

  return {
    all: rankedHabits,
    declining,
    improving,
    needsAttention,
    strongest,
  };
}

export function getHabitStrength(habit, now = new Date(), index = 0) {
  const today = startOfDay(now);
  // One habit, so no cross-habit sharing needed with getHabitRankings'
  // other calls - but still built once and reused for this function's own
  // three consistency-scoring calls below, instead of each rebuilding it.
  const caches = getHabitConsistencyCaches([habit], now);
  const completedDates = caches[0]?.sortedCompletedKeys || [];
  const last30 = getConsistencyScore([habit], {
    endDate: today,
    startDate: addDays(today, -29),
  }, caches);
  const last7 = getConsistencyScore([habit], {
    endDate: today,
    startDate: addDays(today, -6),
  }, caches);
  const trend = getTrendComparison([habit], {
    currentDays: 7,
    now,
    previousDays: 7,
  }, caches);
  const currentStreak = getCurrentStreak(completedDates, habit);
  const bestStreak = getBestStreak(completedDates, habit);
  const completionBonus = Math.min(12, completedDates.length);
  const streakBonus = Math.min(12, currentStreak * 2);
  const bestStreakBonus = Math.min(8, bestStreak);
  const score = Math.round(
    last30.rate * 0.55 +
      last7.rate * 0.2 +
      completionBonus +
      streakBonus +
      bestStreakBonus
  );

  return {
    bestStreak,
    category: habit?.category || "General",
    completedCount: completedDates.length,
    completionRate: last30.rate,
    currentStreak,
    hasSufficientData: last30.possibleCount >= MIN_RANKING_OPPORTUNITIES,
    habit,
    id: habit?.id || `habit-${index}`,
    name: habit?.name || "Habit",
    possibleCount: last30.possibleCount,
    score,
    trend,
    weeklyRate: last7.rate,
  };
}

export function getInsightCards({
  aggregates,
  consistency,
  habitRankings,
  monthlyComparison,
  rollingTrend,
  weekdayConsistency,
  weeklyComparison,
}) {
  const cards = [];
  const strongestHabit = habitRankings.strongest[0];
  const improvingHabit = habitRankings.improving[0];
  const decliningHabit = habitRankings.declining[0];
  const bestRecord = aggregates.personalRecords[0];

  if (consistency.last30Days.possibleCount === 0) {
    return [
      createInsightCard({
        body: "Complete scheduled habits for a few days to unlock trend insights.",
        label: "Getting started",
        tone: "neutral",
      }),
    ];
  }

  if (weeklyComparison.available) {
    cards.push(
      createInsightCard({
        body: `${weeklyComparison.currentLabel} is ${weeklyComparison.rate}% complete, ${weeklyComparison.summary}.`,
        label: "Weekly trend",
        tone: weeklyComparison.direction,
      })
    );
  }

  if (weekdayConsistency.best?.possibleCount >= MIN_TREND_OPPORTUNITIES) {
    cards.push(
      createInsightCard({
        body: `${weekdayConsistency.best.label} is your most consistent weekday at ${weekdayConsistency.best.rate}%.`,
        label: "Consistency",
        tone: "positive",
      })
    );
  }

  if (strongestHabit) {
    cards.push(
      createInsightCard({
        body: `${strongestHabit.name} is your strongest habit over the last 30 days at ${strongestHabit.completionRate}%.`,
        label: "Strongest habit",
        tone: "positive",
      })
    );
  }

  if (improvingHabit) {
    cards.push(
      createInsightCard({
        body: `${improvingHabit.name} improved by ${improvingHabit.trend.delta} percentage points this week.`,
        label: "Improving",
        tone: "positive",
      })
    );
  } else if (decliningHabit) {
    cards.push(
      createInsightCard({
        body: `${decliningHabit.name} is down ${Math.abs(
          decliningHabit.trend.delta
        )} percentage points this week.`,
        label: "Needs attention",
        tone: "attention",
      })
    );
  }

  if (monthlyComparison.available && rollingTrend.available) {
    cards.push(
      createInsightCard({
        body: `${monthlyComparison.currentLabel} is ${monthlyComparison.rate}% complete. Your 30-day trend is ${rollingTrend.direction}.`,
        label: "Monthly view",
        tone: rollingTrend.direction,
      })
    );
  }

  if (bestRecord) {
    cards.push(
      createInsightCard({
        body: `${bestRecord.title}: ${bestRecord.value}.`,
        label: "Personal best",
        tone: "neutral",
      })
    );
  }

  return dedupeInsightCards(cards).slice(0, 5);
}

function getInsightsReadiness(aggregates) {
  const totalCompletions = aggregates.lifetime.totalCompletions;
  const scheduledOpportunities = aggregates.lifetime.totalScheduledOpportunities;

  if (aggregates.habitProfiles.length === 0) {
    return {
      state: "empty",
      message: "Create a habit to begin building insights.",
    };
  }

  if (totalCompletions === 0) {
    return {
      state: "no-completions",
      message: "Complete habits to start seeing patterns.",
    };
  }

  if (scheduledOpportunities < 14) {
    return {
      state: "building",
      message: "Momentum is building enough schedule history for deeper trends.",
    };
  }

  return {
    state: "ready",
    message: "Insights are based on scheduled habit history.",
  };
}

function getDashboardSections({
  aggregates,
  consistency,
  habitRankings,
  insightCards,
  monthlyComparison,
  rollingTrend,
  weeklyComparison,
}) {
  if (aggregates.habitProfiles.length === 0) {
    return ["overview", "empty-state"];
  }

  if (aggregates.lifetime.totalCompletions === 0) {
    return ["overview", "consistency", "weekly-comparison", "empty-state"];
  }

  const sections = ["overview", "insights"];

  if (consistency.currentWeek.possibleCount > 0) {
    sections.push("weekly-comparison");
  }

  if (rollingTrend.available || monthlyComparison.available) {
    sections.push("trends");
  }

  if (habitRankings.strongest.length > 0 || habitRankings.needsAttention.length > 0) {
    sections.push("habit-rankings");
  }

  if (insightCards.length === 0) {
    sections.push("empty-state");
  }

  return sections;
}

function getMonthToDateConsistency(habits, now, caches) {
  const today = startOfDay(now);

  return getConsistencyScore(habits, {
    endDate: today,
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
  }, caches);
}

function getPreviousMonthToDateConsistency(habits, now, caches) {
  const today = startOfDay(now);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const elapsedDays = daysBetween(monthStart, today) + 1;
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0);

  return getConsistencyScore(habits, {
    endDate: addDays(
      previousMonthStart,
      Math.min(elapsedDays, previousMonthLastDay.getDate()) - 1
    ),
    startDate: previousMonthStart,
  }, caches);
}

function getCurrentWeekConsistency(habits, now, caches) {
  const today = startOfDay(now);

  return getConsistencyScore(habits, {
    endDate: today,
    startDate: getStartOfWeek(today),
  }, caches);
}

function getPreviousWeekToDateConsistency(habits, now, caches) {
  const today = startOfDay(now);
  const weekStart = getStartOfWeek(today);
  const elapsedDays = daysBetween(weekStart, today) + 1;
  const previousWeekStart = addDays(weekStart, -7);

  return getConsistencyScore(habits, {
    endDate: addDays(previousWeekStart, elapsedDays - 1),
    startDate: previousWeekStart,
  }, caches);
}

function getComparisonResult(
  current,
  previous,
  {
    currentLabel,
    minOpportunities = MIN_TREND_OPPORTUNITIES,
    previousLabel,
    threshold = SIGNIFICANT_TREND_POINTS,
  }
) {
  if (
    current.possibleCount < minOpportunities ||
    previous.possibleCount < minOpportunities
  ) {
    return {
      available: false,
      current,
      currentLabel,
      delta: 0,
      direction: "insufficient",
      previous,
      previousLabel,
      rate: current.rate,
      summary: "needs more scheduled data",
    };
  }

  const delta = current.rate - previous.rate;
  const direction =
    delta >= threshold
      ? "improving"
      : delta <= -threshold
        ? "declining"
        : "stable";

  return {
    available: true,
    current,
    currentLabel,
    delta,
    direction,
    previous,
    previousLabel,
    rate: current.rate,
    summary:
      direction === "stable"
        ? "stable against the previous period"
        : `${delta > 0 ? "up" : "down"} ${Math.abs(
            delta
          )} percentage points`,
  };
}

function getWeekdayConsistency(daySummaries) {
  const weekdaySummaries = WEEKDAY_LABELS.map((label) => ({
    completedCount: 0,
    label,
    possibleCount: 0,
    rate: 0,
  }));

  daySummaries.forEach((day) => {
    const date = dateKeyToLocalDate(day.dateKey);
    const weekday = weekdaySummaries[date.getDay()];

    weekday.completedCount += day.completedCount;
    weekday.possibleCount += day.possibleCount;
    weekday.rate = getPercentage(weekday.completedCount, weekday.possibleCount);
  });

  const comparable = weekdaySummaries.filter(
    (summary) => summary.possibleCount >= MIN_TREND_OPPORTUNITIES
  );

  return {
    all: weekdaySummaries,
    best:
      [...comparable].sort(
        (first, second) =>
          second.rate - first.rate ||
          second.completedCount - first.completedCount ||
          first.label.localeCompare(second.label)
      )[0] || null,
    difficult:
      [...comparable].sort(
        (first, second) =>
          first.rate - second.rate ||
          first.completedCount - second.completedCount ||
          first.label.localeCompare(second.label)
      )[0] || null,
  };
}

function getConsistencyFromDaySummaries(daySummaries) {
  const completedCount = daySummaries.reduce(
    (sum, day) => sum + day.completedCount,
    0
  );
  const possibleCount = daySummaries.reduce(
    (sum, day) => sum + day.possibleCount,
    0
  );

  return createConsistencySummary(completedCount, possibleCount);
}

// Built once per getInsightsDashboard()/getHabitStrength() call (see call
// sites above) and reused across every day this function gets asked
// about, instead of each call re-filtering/deduping/sorting the habit's
// full completedDates array (getCompletedDateKeys) - the actual
// bottleneck this whole cache exists to remove; see the perf-baseline
// report for the measurements.
function getHabitConsistencyCaches(habits, now) {
  const todayKey = toDateKey(startOfDay(now));

  return getSafeHabits(habits).map((habit) => {
    const sortedCompletedKeys = getCompletedDateKeys(habit, todayKey);

    return {
      completedSet: new Set(sortedCompletedKeys),
      createdAt: parseStoredDate(habit?.createdAt),
      earliestCompletionKey: sortedCompletedKeys[0] || null,
      habit,
      sortedCompletedKeys,
    };
  });
}

// Same result as the old getHabitStartDate(habit, fallbackDate), computed
// from the cache in O(1) instead of re-deriving it: createdAt is fixed per
// habit, and because sortedCompletedKeys is already sorted ascending, its
// first element is the earliest completion regardless of which day is
// being asked about - if that earliest key already satisfies this day's
// <= cutoff, filtering the full array down to "completions on or before
// today" (what the original re-filter did) could never produce an earlier
// result.
function getHabitStartDateFromCache(cache, fallbackDate, fallbackDateKey) {
  if (cache.createdAt && cache.createdAt <= fallbackDate) {
    return cache.createdAt;
  }

  if (cache.earliestCompletionKey && cache.earliestCompletionKey <= fallbackDateKey) {
    return dateKeyToLocalDate(cache.earliestCompletionKey);
  }

  return startOfDay(fallbackDate);
}

function getDayConsistencySummary(date, caches) {
  const dateKey = toDateKey(date);
  const scheduledCaches = caches.filter(
    (cache) =>
      getHabitStartDateFromCache(cache, date, dateKey) <= date &&
      isHabitScheduledOnDate(cache.habit, dateKey)
  );
  const completedCount = scheduledCaches.filter((cache) =>
    cache.completedSet.has(dateKey)
  ).length;

  return {
    completedCount,
    dateKey,
    possibleCount: scheduledCaches.length,
  };
}

function createConsistencySummary(completedCount, possibleCount) {
  return {
    completedCount,
    possibleCount,
    rate: getPercentage(completedCount, possibleCount),
  };
}

function createInsightCard({ body, label, tone }) {
  return {
    body,
    id: `${label}:${body}`,
    label,
    tone,
  };
}

function dedupeInsightCards(cards) {
  const seen = new Set();

  return cards.filter((card) => {
    if (seen.has(card.body)) {
      return false;
    }

    seen.add(card.body);
    return true;
  });
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
  return toDateKey(dateKeyToLocalDate(dateKey)) === dateKey;
}

function getSafeHabits(habits) {
  return Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
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

function getStartOfWeek(date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + diff);

  return start;
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
