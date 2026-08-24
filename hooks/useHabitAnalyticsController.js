import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { getHabits } from "../storage/habitsStorage";
import {
  getHabitAnalyticsGuidance,
  getHabitAnalyticsReadiness,
} from "../utils/analyticsReadiness";
import {
  getHabitPerformance,
  getScheduleAwareWeeklyProgress,
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
  // Bumped only by retry() below, never by a plain refocus - keeps this
  // screen's existing no-flash-on-refocus behavior intact while still
  // giving AnalyticsError's "Try again" button a real reload to trigger.
  const [reloadRequest, setReloadRequest] = useState(0);

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
    }, [id, reloadRequest])
  );

  const retry = useCallback(() => {
    setLoading(true);
    setReloadRequest((value) => value + 1);
  }, []);

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
  const scheduleAwareWeeklyProgress = useMemo(
    () => (habit ? getScheduleAwareWeeklyProgress(habit) : []),
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
    retry,
    scheduleAwareWeeklyProgress,
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

// HabitWeekCard's "Next scheduled" row already shows
// weeklyPattern.nextScheduled.label verbatim two sections below this card,
// so the ordinary case here falls back to `guidance` (streak/pattern
// guidance from getHabitAnalyticsGuidance) instead of repeating that same
// sentence - see Phase 12 Finding B. The "today" and "week complete"
// branches stay schedule-specific and aren't verbatim repeats of the Week
// card's text, so they're untouched.
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

  return guidance;
}
