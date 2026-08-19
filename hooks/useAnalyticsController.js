import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  hasShownFirstTrendUnlock,
  setFirstTrendUnlockShown,
} from "../storage/appPreferences";
import { getGamification } from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import {
  getAnalyticsReadiness,
  shouldShowFirstTrendUnlock,
} from "../utils/analyticsReadiness";
import { getDeepAnalytics } from "../utils/habitStats";
import { getInsightsDashboard } from "../utils/insightsDashboard";
import { getMonthlyReview } from "../utils/personalRecords";

export function useAnalyticsController() {
  const [period, setPeriod] = useState("month");
  const [habits, setHabits] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [firstTrendUnlockShown, setFirstTrendUnlockShownState] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadRequest, setReloadRequest] = useState(0);
  const [trendUnlockVisible, setTrendUnlockVisible] = useState(false);
  const [progressSignalsExpanded, setProgressSignalsExpanded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadAnalytics() {
        try {
          setLoading(true);
          setError("");
          const [
            storedHabits,
            storedGamification,
            storedFirstTrendUnlockShown,
          ] = await Promise.all([
            getHabits(),
            getGamification(),
            hasShownFirstTrendUnlock(),
          ]);

          if (!isActive) {
            return;
          }

          setHabits(storedHabits);
          setGamification(storedGamification);
          setFirstTrendUnlockShownState(storedFirstTrendUnlockShown);
        } catch {
          if (isActive) {
            setError("Could not load analytics. Try again.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadAnalytics();

      return () => {
        isActive = false;
      };
    }, [reloadRequest])
  );

  const analytics = useMemo(
    () => getDeepAnalytics(habits, period, gamification),
    [gamification, habits, period]
  );
  const readiness = useMemo(() => getAnalyticsReadiness(habits), [habits]);
  const monthlyReview = useMemo(
    () => getMonthlyReview(habits, gamification),
    [gamification, habits]
  );
  const insightsDashboard = useMemo(
    () => getInsightsDashboard(habits, gamification),
    [gamification, habits]
  );

  useEffect(() => {
    if (!shouldShowFirstTrendUnlock(readiness, firstTrendUnlockShown)) {
      return;
    }

    setTrendUnlockVisible(true);
    setFirstTrendUnlockShownState(true);
    setFirstTrendUnlockShown().catch(() => {
      // The banner is non-critical; persistence can recover on a future visit.
    });
  }, [firstTrendUnlockShown, readiness]);

  return {
    analytics,
    error,
    gamification,
    habits,
    insightsDashboard,
    loading,
    monthlyReview,
    period,
    progressSignalsExpanded,
    readiness,
    setPeriod,
    setProgressSignalsExpanded,
    setReloadRequest,
    setTrendUnlockVisible,
    trendUnlockVisible,
  };
}
