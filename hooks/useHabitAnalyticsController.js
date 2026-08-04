import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { getHabits } from "../storage/habitsStorage";
import {
  getHabitAnalyticsGuidance,
  getHabitAnalyticsReadiness,
} from "../utils/analyticsReadiness";
import {
  getHabitPerformance,
  getTodayKey,
  toDateKey,
} from "../utils/habitStats";
import { getHabitStrength } from "../utils/insightsDashboard";
import { getHabitMilestones } from "../utils/personalRecords";
import { getHabitWeeklyPattern } from "../utils/weeklyReview";

export function useHabitAnalyticsController() {
  const { id } = useLocalSearchParams();
  const [habit, setHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadHabit() {
        try {
          setError("");
          const habits = await getHabits();
          const foundHabit = habits.find((item) => item.id === id);

          if (!isActive) {
            return;
          }

          setHabit(foundHabit || null);
        } catch {
          if (isActive) {
            setError("Could not load habit analytics. Try again.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadHabit();

      return () => {
        isActive = false;
      };
    }, [id])
  );

  const analytics = useMemo(
    () => (habit ? getHabitPerformance(habit, "month") : null),
    [habit]
  );
  const historyDays = useMemo(
    () => (habit ? getLastThirtyDays(habit) : []),
    [habit]
  );
  const readiness = useMemo(
    () => (habit ? getHabitAnalyticsReadiness(habit) : null),
    [habit]
  );
  const guidance = useMemo(
    () => getHabitAnalyticsGuidance(readiness),
    [readiness]
  );
  const weeklyPattern = useMemo(
    () => (habit ? getHabitWeeklyPattern(habit) : null),
    [habit]
  );
  const focusGuidance = useMemo(
    () => getHabitFocusGuidance(guidance, weeklyPattern),
    [guidance, weeklyPattern]
  );
  const milestones = useMemo(
    () => (habit ? getHabitMilestones(habit) : null),
    [habit]
  );
  const habitStrength = useMemo(
    () => (habit ? getHabitStrength(habit) : null),
    [habit]
  );

  return {
    analytics,
    error,
    focusGuidance,
    guidance,
    habit,
    habitStrength,
    historyDays,
    loading,
    milestones,
    readiness,
    weeklyPattern,
  };
}

function getLastThirtyDays(habit) {
  const completedSet = new Set(habit.completedDates || []);
  const today = startOfDay(new Date());
  const todayKey = getTodayKey();

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    const dateKey = toDateKey(date);

    return {
      completed: completedSet.has(dateKey),
      dateKey,
      isToday: dateKey === todayKey,
    };
  });
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getHabitFocusGuidance(guidance, weeklyPattern) {
  if (!weeklyPattern?.nextScheduled?.available) {
    return guidance;
  }

  if (weeklyPattern.nextScheduled.timing === "today") {
    return "This habit is scheduled today.";
  }

  if (weeklyPattern.hasScheduledData && weeklyPattern.completionRate === 100) {
    return `${weeklyPattern.nextScheduled.label}. This week is complete so far.`;
  }

  return weeklyPattern.nextScheduled.label;
}
