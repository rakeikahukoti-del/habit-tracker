import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { getGamification } from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import {
  getAvailableActivityYears,
  getMonthActivitySummary,
  getYearActivityDays,
} from "../utils/activityHistory";
import { getProgressOverview } from "../utils/habitStats";
import { getAnalyticsAggregates } from "../utils/personalRecords";
import { ROLLING_WEEK_WINDOW, getWeeklyReview } from "../utils/weeklyReview";

export function useStatsController() {
  const [period, setPeriod] = useState("month");
  const [habits, setHabits] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weeklyDetailsExpanded, setWeeklyDetailsExpanded] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDayKey, setSelectedDayKey] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadProgress() {
        try {
          setError("");
          const [storedHabits, storedGamification] = await Promise.all([
            getHabits(),
            getGamification(),
          ]);

          if (!isActive) {
            return;
          }

          setHabits(storedHabits);
          setGamification(storedGamification);
        } catch {
          if (isActive) {
            setError("Could not load progress. Try again.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadProgress();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const progress = useMemo(
    () => getProgressOverview(habits, period, gamification),
    [gamification, habits, period]
  );
  const weeklyReview = useMemo(
    () => getWeeklyReview(habits, new Date(), ROLLING_WEEK_WINDOW),
    [habits]
  );
  const analyticsAggregates = useMemo(
    () => getAnalyticsAggregates(habits, gamification),
    [gamification, habits]
  );
  const lifetimeStats = analyticsAggregates.lifetime;
  const personalRecords = analyticsAggregates.personalRecords.slice(0, 4);
  const availableYears = useMemo(
    () => getAvailableActivityYears(habits),
    [habits]
  );
  const yearActivityDays = useMemo(
    () => getYearActivityDays(habits, selectedYear),
    [habits, selectedYear]
  );
  const selectedDay = useMemo(
    () =>
      yearActivityDays.find((day) => day.dateKey === selectedDayKey) ||
      null,
    [selectedDayKey, yearActivityDays]
  );
  const monthSummary = useMemo(
    () => getMonthActivitySummary(habits, selectedMonth),
    [habits, selectedMonth]
  );

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    setSelectedMonth((currentMonth) => {
      const today = new Date();
      const monthIndex =
        selectedYear === today.getFullYear()
          ? Math.min(currentMonth.getMonth(), today.getMonth())
          : currentMonth.getMonth();

      return new Date(selectedYear, monthIndex, 1);
    });
    setSelectedDayKey("");
  }, [selectedYear]);

  return {
    availableYears,
    error,
    gamification,
    habits,
    lifetimeStats,
    loading,
    monthSummary,
    period,
    personalRecords,
    progress,
    selectedDay,
    selectedDayKey,
    selectedMonth,
    selectedYear,
    setPeriod,
    setSelectedDayKey,
    setSelectedMonth,
    setSelectedYear,
    setWeeklyDetailsExpanded,
    weeklyDetailsExpanded,
    weeklyReview,
    yearActivityDays,
  };
}
