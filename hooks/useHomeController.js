import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { AppState, LayoutAnimation } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getDailyPlan, saveDailyPlan } from "../storage/dailyPlanStorage";
import {
  defaultAppPreferences,
  dismissFirstSwipeHint,
  dismissReturnGuidance,
  getAppPreferences,
  getLastShownLevel,
  getReturnGuidanceDismissedDate,
  hasDismissedFirstSwipeHint,
  hasCompletedOnboarding,
  setLastShownLevel,
} from "../storage/appPreferences";
import {
  awardHabitCompletion,
  consumeGamificationMessages,
  getGamification,
  getGamificationLevelInfo,
  getRankForLevel,
  rebuildGamificationFromHabits,
} from "../storage/gamificationStorage";
import {
  completeHabitForToday,
  getHabits,
  uncompleteHabitForToday,
} from "../storage/habitsStorage";
import {
  getHomeSummary,
  getQueuedRewardsFromMessages,
  getVisibleHomeHabits,
  shouldShowConfetti,
} from "../utils/homeHabitActions";
import {
  addPriorityId,
  getAvailablePriorityHabits,
  getDailyPlanProgress,
  getNextPriorityHabit,
  getTodayPriorityHabits,
  removePriorityId,
  reorderPriorityIds,
} from "../utils/dailyPlanning";
import { getVisibleRank } from "../utils/rankDisplay";
import {
  getCurrentStreak,
  getTodayKey,
  wasCompletedToday,
} from "../utils/habitStats";
import { getFirstSwipeHintState } from "../utils/firstUseExperience";
import { getReturnExperienceState } from "../utils/returnExperience";

export function useHomeController() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [celebration, setCelebration] = useState("");
  const [completionReward, setCompletionReward] = useState(null);
  const [badgeUnlock, setBadgeUnlock] = useState(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [gamification, setGamification] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [perfectDay, setPerfectDay] = useState(null);
  const [moveCompletedToBottom, setMoveCompletedToBottom] = useState(false);
  const [dailyPlan, setDailyPlan] = useState({
    date: getTodayKey(),
    habitIds: [],
    version: 1,
  });
  const [dailyPlanMessage, setDailyPlanMessage] = useState("");
  const [preferences, setPreferences] = useState(defaultAppPreferences);
  const [progressExpanded, setProgressExpanded] = useState(null);
  const [swipeHintVisible, setSwipeHintVisible] = useState(false);
  const [returnExperience, setReturnExperience] = useState(null);
  const habitActionInProgressRef = useRef(new Set());
  const todayKeyRef = useRef(getTodayKey());

  const loadHabits = useCallback(async ({ isActive = () => true } = {}) => {
    try {
      if (!isActive()) {
        return;
      }

      setError("");
      const completedOnboarding = await hasCompletedOnboarding();

      if (!isActive()) {
        return;
      }

      if (!completedOnboarding) {
        router.replace("/onboarding");
        return;
      }

      const [
        storedHabits,
        storedPreferences,
        firstSwipeHintDismissed,
        returnGuidanceDismissedDate,
        messages,
        storedGamification,
      ] = await Promise.all([
        getHabits(),
        getAppPreferences(),
        hasDismissedFirstSwipeHint(),
        getReturnGuidanceDismissedDate(),
        consumeGamificationMessages(),
        getGamification(),
      ]);
      const storedDailyPlan = await getDailyPlan(storedHabits);

      if (!isActive()) {
        return;
      }

      setHabits(storedHabits);
      setDailyPlan(storedDailyPlan);
      setMoveCompletedToBottom(storedPreferences.moveCompletedToBottom);
      setPreferences(storedPreferences);
      setGamification(storedGamification);
      setSwipeHintVisible(
        getFirstSwipeHintState({
          dismissed: firstSwipeHintDismissed,
          habits: storedHabits,
          swipeEnabled: storedPreferences.enableSwipeToComplete,
        }).shouldShow
      );
      setReturnExperience(
        getReturnExperienceState({
          dismissedDate: returnGuidanceDismissedDate,
          habits: storedHabits,
        })
      );

      setProgressExpanded((currentValue) =>
        currentValue === null ? storedHabits.length <= 3 : currentValue
      );

      if (messages.length > 0) {
        const queuedRewards = getQueuedRewardsFromMessages(
          messages,
          storedGamification,
          storedPreferences
        );

        setCelebration(queuedRewards.celebration);
        setPerfectDay(queuedRewards.perfectDay);
        setLevelUp(queuedRewards.levelUp);
        setBadgeUnlock(queuedRewards.badgeUnlock);

        if (queuedRewards.levelUp) {
          await setLastShownLevel(queuedRewards.levelUp.level);
        }
      }
    } catch {
      if (isActive()) {
        setError("Could not load habits. Pull to refresh and try again.");
      }
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  }, []);

  const persistDailyPlan = useCallback(async (nextPlan, nextHabits = habits) => {
    try {
      const savedPlan = await saveDailyPlan(nextPlan, nextHabits);

      setDailyPlan(savedPlan);
      return savedPlan;
    } catch {
      setError("Could not update today's focus. Please try again.");
      return dailyPlan;
    }
  }, [dailyPlan, habits]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      loadHabits({
        isActive: () => isActive,
      });

      return () => {
        isActive = false;
      };
    }, [loadHabits])
  );

  useEffect(() => {
    function refreshIfDateChanged() {
      const nextTodayKey = getTodayKey();

      if (todayKeyRef.current === nextTodayKey) {
        return;
      }

      todayKeyRef.current = nextTodayKey;
      loadHabits();
    }

    const intervalId = setInterval(refreshIfDateChanged, 60 * 1000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshIfDateChanged();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [loadHabits]);

  useEffect(() => {
    if (!completionReward) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setCompletionReward(null);
    }, 3200);

    return () => clearTimeout(timeoutId);
  }, [completionReward]);

  useEffect(() => {
    if (!badgeUnlock) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setBadgeUnlock(null);
    }, 4200);

    return () => clearTimeout(timeoutId);
  }, [badgeUnlock]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadHabits();
    } finally {
      setRefreshing(false);
    }
  }, [loadHabits]);

  const dismissSwipeHint = useCallback(async () => {
    setSwipeHintVisible(false);

    try {
      await dismissFirstSwipeHint();
    } catch {
      // Guidance can recover on the next load if persistence fails.
    }
  }, []);

  const dismissReturnMessage = useCallback(async () => {
    const todayKey = getTodayKey();

    setReturnExperience((currentValue) =>
      currentValue ? { ...currentValue, shouldShow: false } : currentValue
    );

    try {
      await dismissReturnGuidance(todayKey);
    } catch {
      // Return guidance is informational and should never block habit updates.
    }
  }, []);

  const handleToggleComplete = useCallback(async (habit, options = {}) => {
    if (habitActionInProgressRef.current.has(habit.id)) {
      return;
    }

    habitActionInProgressRef.current.add(habit.id);

    try {
      setError("");
      if (preferences.enableRewardHaptics) {
        triggerLightHaptic();
      }

      if (wasCompletedToday(habit)) {
        const savedHabit = await uncompleteHabitForToday(habit.id);

        if (!savedHabit) {
          setError("Could not find this habit. Pull to refresh and try again.");
          return;
        }

        const nextHabits = await getHabits();
        const nextGamification = await rebuildGamificationFromHabits(
          nextHabits,
          { includeMessage: false }
        );

        setHabits(nextHabits);
        setGamification(nextGamification);
        setCelebration("");

        return;
      }

      const savedHabit = await completeHabitForToday(habit.id);

      if (!savedHabit) {
        setError("Could not find this habit. Pull to refresh and try again.");
        return;
      }

      const nextHabits = await getHabits();
      const previousGamification = await getGamification();
      const previousXp = previousGamification.xp || 0;
      const award = await awardHabitCompletion({
        completedHabit: savedHabit,
        habits: nextHabits,
      });
      const xpEarned = Math.max(10, award.gamification.xp - previousXp);
      const rewardLevelInfo = getGamificationLevelInfo(award.gamification);
      const rewardRank = getVisibleRank(getRankForLevel(rewardLevelInfo.level));

      await consumeGamificationMessages();
      await dismissSwipeHint();
      await dismissReturnMessage();

      setHabits(nextHabits);
      setGamification(award.gamification);
      setCompletionReward({
        habitName: savedHabit.name,
        rank: rewardRank,
        rankProgress: rewardLevelInfo.currentLevelXp,
        source: options.source || "tap",
        streak: getCurrentStreak(savedHabit.completedDates, savedHabit),
        xpEarned,
      });
      setBadgeUnlock(
        preferences.showBadgePopups && award.badgeUnlocks.length > 0
          ? award.badgeUnlocks[0]
          : null
      );
      setPerfectDay(award.perfectDay || null);
      setCelebration(
        preferences.showBadgePopups ? award.messages.join(" ") : ""
      );

      if (shouldShowConfetti(award.messages, preferences)) {
        setConfettiKey((currentKey) => currentKey + 1);
      }

      if (preferences.showLevelUpPopup) {
        await maybeShowLevelUp(
          award.gamification,
          award.messages,
          setLevelUp
        );
      }

      if (preferences.enableRewardHaptics) {
        triggerSuccessHaptic();
      }
    } catch {
      setError("Could not update this habit. Please try again.");
    } finally {
      habitActionInProgressRef.current.delete(habit.id);
    }
  }, [dismissReturnMessage, dismissSwipeHint, preferences]);

  const addPriorityForToday = useCallback(async (habit) => {
    const nextPlan = addPriorityId(dailyPlan, habits, habit.id);

    if (nextPlan.habitIds.length === dailyPlan.habitIds.length) {
      setDailyPlanMessage("Today can include up to three focus habits.");
      return;
    }

    await persistDailyPlan(nextPlan);
    setDailyPlanMessage(`${habit.name} added to today's focus.`);
  }, [dailyPlan, habits, persistDailyPlan]);

  const removePriorityForToday = useCallback(async (habit) => {
    const nextPlan = removePriorityId(dailyPlan, habits, habit.id);

    await persistDailyPlan(nextPlan);
    setDailyPlanMessage(`${habit.name} removed from today's focus.`);
  }, [dailyPlan, habits, persistDailyPlan]);

  const movePriorityForToday = useCallback(async (habit, direction) => {
    const nextPlan = reorderPriorityIds(dailyPlan, habits, habit.id, direction);

    await persistDailyPlan(nextPlan);
  }, [dailyPlan, habits, persistDailyPlan]);

  const toggleProgressExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setProgressExpanded((value) => !value);
  }, []);

  const homeSummary = useMemo(
    () => getHomeSummary(habits, gamification),
    [gamification, habits]
  );
  const visibleHabits = useMemo(
    () => getVisibleHomeHabits(habits, moveCompletedToBottom),
    [habits, moveCompletedToBottom]
  );
  const priorityHabits = useMemo(
    () => getTodayPriorityHabits(dailyPlan, habits),
    [dailyPlan, habits]
  );
  const remainingHabits = useMemo(
    () => {
      const priorityIds = new Set(priorityHabits.map((habit) => habit.id));

      return visibleHabits.filter((habit) => !priorityIds.has(habit.id));
    },
    [priorityHabits, visibleHabits]
  );
  const availablePriorityHabits = useMemo(
    () => getAvailablePriorityHabits({ habits, plan: dailyPlan }),
    [dailyPlan, habits]
  );
  const dailyPlanProgress = useMemo(
    () => getDailyPlanProgress(dailyPlan, habits),
    [dailyPlan, habits]
  );
  const nextPriorityHabit = useMemo(
    () => getNextPriorityHabit({ habits, plan: dailyPlan }),
    [dailyPlan, habits]
  );

  return {
    addPriorityForToday,
    availablePriorityHabits,
    badgeUnlock,
    celebration,
    completionReward,
    confettiKey,
    dailyPlan,
    dailyPlanMessage,
    dailyPlanProgress,
    error,
    habits,
    handleRefresh,
    handleToggleComplete,
    homeSummary,
    levelUp,
    loading,
    movePriorityForToday,
    nextPriorityHabit,
    perfectDay,
    preferences,
    priorityHabits,
    progressExpanded,
    refreshing,
    dismissSwipeHint,
    dismissReturnMessage,
    returnExperience,
    remainingHabits,
    removePriorityForToday,
    setBadgeUnlock,
    setCelebration,
    setCompletionReward,
    setLevelUp,
    setPerfectDay,
    setDailyPlanMessage,
    swipeHintVisible,
    toggleProgressExpanded,
    visibleHabits,
  };
}

async function triggerLightHaptic() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are a nice-to-have and should never block habit completion.
  }
}

async function triggerSuccessHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Some devices or environments do not support haptic feedback.
  }
}

async function maybeShowLevelUp(gamification, messages, setLevelUp) {
  if (!messages.some((message) => message.includes("Level up"))) {
    return;
  }

  const levelInfo = getGamificationLevelInfo(gamification);
  const lastShownLevel = await getLastShownLevel();

  if (levelInfo.level <= lastShownLevel) {
    return;
  }

  await setLastShownLevel(levelInfo.level);
  setLevelUp({
    level: levelInfo.level,
    progress: (levelInfo.currentLevelXp / 100) * 100,
    rank: getVisibleRank(getRankForLevel(levelInfo.level)),
  });
}
