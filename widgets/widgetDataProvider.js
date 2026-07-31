import { getAppPreferences } from "../storage/appPreferences";
import { getDailyPlan } from "../storage/dailyPlanStorage";
import { getGamification } from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import {
  getDailyPlanProgress,
  getRemainingTodayHabits,
  getTodayPriorityHabits,
  sortHabitsForHome,
} from "../utils/dailyPlanning";
import { getGamificationLevelInfo, getRankForLevel } from "../utils/gamification";
import {
  getCurrentStreak,
  isHabitScheduledOnDate,
  toDateKey,
} from "../utils/habitStats";
import { getVisibleRank } from "../utils/rankDisplay";

const WIDGET_LIMITS = {
  large: 8,
  medium: 5,
  small: 0,
};

export async function getMomentumWidgetData(size = "medium") {
  try {
    const [habits, gamification, preferences] = await Promise.all([
      getHabits(),
      getGamification(),
      getAppPreferences(),
    ]);
    const todayKey = toDateKey(new Date());
    const dailyPlan = await getDailyPlan(habits, todayKey);

    return createMomentumWidgetModel({
      dailyPlan,
      gamification,
      habits,
      preferences,
      size,
    });
  } catch {
    return createWidgetErrorModel(size);
  }
}

export function createMomentumWidgetModel({
  dailyPlan,
  gamification,
  habits,
  now = new Date(),
  preferences,
  size = "medium",
}) {
  const widgetSize = getWidgetSize(size);
  const todayKey = toDateKey(now);
  const safeHabits = Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
  const scheduledHabits = sortHabitsForHome(
    safeHabits.filter((habit) => isHabitScheduledOnDate(habit, todayKey)),
    Boolean(preferences?.moveCompletedToBottom)
  );
  const completedCount = scheduledHabits.filter((habit) =>
    isCompletedOnDate(habit, todayKey)
  ).length;
  const totalCount = scheduledHabits.length;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const completionPercentage =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const priorityHabits = getTodayPriorityHabits(dailyPlan, scheduledHabits, todayKey);
  const remainingHabits = getRemainingTodayHabits({
    habits: scheduledHabits,
    moveCompletedToBottom: Boolean(preferences?.moveCompletedToBottom),
    plan: dailyPlan,
    todayKey,
  });
  const displayHabits = [...priorityHabits, ...remainingHabits].slice(
    0,
    WIDGET_LIMITS[widgetSize]
  );
  const focusHabit =
    priorityHabits.find((habit) => !isCompletedOnDate(habit, todayKey)) ||
    scheduledHabits.find((habit) => !isCompletedOnDate(habit, todayKey)) ||
    scheduledHabits[0] ||
    null;
  const levelInfo = getGamificationLevelInfo(gamification);
  const rank = getVisibleRank(getRankForLevel(levelInfo.level));
  const dailyPlanProgress = getDailyPlanProgress(dailyPlan, scheduledHabits, todayKey);

  return {
    accessibilityLabel: getWidgetAccessibilityLabel({
      completionPercentage,
      remainingCount,
      totalCount,
    }),
    dateLabel: formatWidgetDate(now),
    empty: totalCount === 0,
    focusHabit: focusHabit ? mapWidgetHabit(focusHabit, todayKey, now) : null,
    generatedAt: now.toISOString(),
    habits: displayHabits.map((habit) => mapWidgetHabit(habit, todayKey, now)),
    progress: {
      completedCount,
      completionPercentage,
      remainingCount,
      totalCount,
    },
    rank,
    size: widgetSize,
    todayFocus: {
      completedCount: dailyPlanProgress.completedCount,
      totalCount: dailyPlanProgress.totalCount,
    },
    weeklyProgress: getCompactWeeklyProgress(scheduledHabits, now),
  };
}

export function getSupportedWidgetSizes() {
  return [
    {
      description: "Date, completion percentage, and remaining habit count.",
      key: "small",
      label: "Small",
    },
    {
      description: "Today's focus, top habits, progress, and current streaks.",
      key: "medium",
      label: "Medium",
    },
    {
      description: "Today's habits, focus priorities, weekly progress, and summary.",
      key: "large",
      label: "Large",
    },
  ];
}

function getWidgetSize(size) {
  return Object.prototype.hasOwnProperty.call(WIDGET_LIMITS, size)
    ? size
    : "medium";
}

function mapWidgetHabit(habit, todayKey, now) {
  const completed = isCompletedOnDate(habit, todayKey);

  return {
    accessibilityLabel: `${habit.name || "Habit"} is ${
      completed ? "complete" : "not complete"
    } today.`,
    category: habit.category || "General",
    completed,
    emoji: habit.emoji || "•",
    id: habit.id,
    name: habit.name || "Habit",
    streak: getCurrentStreak(habit.completedDates, habit),
    weeklyProgress: getHabitWeeklyProgress(habit, now).map((day) => ({
      completed: day.completed,
      label: day.label,
    })),
  };
}

function getCompactWeeklyProgress(habits, now) {
  if (habits.length === 0) {
    return [];
  }

  const habitProgress = habits.map((habit) => getHabitWeeklyProgress(habit, now));
  const firstHabitProgress = habitProgress[0];

  return firstHabitProgress.map((day, dayIndex) => {
    const completedCount = habitProgress.filter(
      (progress) => progress[dayIndex]?.completed
    ).length;

    return {
      completedCount,
      completionPercentage:
        habits.length === 0 ? 0 : Math.round((completedCount / habits.length) * 100),
      label: day.label,
      totalCount: habits.length,
    };
  });
}

function getHabitWeeklyProgress(habit, now) {
  const today = startOfDay(now);
  const completedDates = new Set(
    Array.isArray(habit.completedDates) ? habit.completedDates : []
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dateKey = toDateKey(date);

    return {
      completed: completedDates.has(dateKey),
      dateKey,
      label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
    };
  });
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isCompletedOnDate(habit, dateKey) {
  return Array.isArray(habit?.completedDates) && habit.completedDates.includes(dateKey);
}

function getWidgetAccessibilityLabel({
  completionPercentage,
  remainingCount,
  totalCount,
}) {
  if (totalCount === 0) {
    return "Momentum widget. No habits scheduled today.";
  }

  return `Momentum widget. ${completionPercentage}% complete. ${remainingCount} habits remaining today.`;
}

function createWidgetErrorModel(size) {
  return {
    accessibilityLabel: "Momentum widget could not load habit data.",
    dateLabel: formatWidgetDate(new Date()),
    empty: true,
    error: "Could not load widget data.",
    focusHabit: null,
    generatedAt: new Date().toISOString(),
    habits: [],
    progress: {
      completedCount: 0,
      completionPercentage: 0,
      remainingCount: 0,
      totalCount: 0,
    },
    rank: "Bronze",
    size: getWidgetSize(size),
    todayFocus: {
      completedCount: 0,
      totalCount: 0,
    },
    weeklyProgress: [],
  };
}

function formatWidgetDate(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    weekday: "short",
    day: "numeric",
  });
}
