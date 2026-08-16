import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { AccessibilityInfo, AppState, LayoutAnimation } from "react-native";
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
  consumeGamificationMessages,
  getGamification,
  getGamificationLevelInfo,
  getRankForLevel,
} from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import {
  getActiveRewardType,
  getHomeSummary,
  getQueuedRewardsFromMessages,
  getRewardAccessibilityAnnouncement,
  getVisibleHomeHabits,
  shouldShowConfetti,
} from "../utils/homeHabitActions";
import { XP_PER_COMPLETION, XP_PER_LEVEL } from "../utils/gamification";
import {
  addPriorityId,
  getAvailablePriorityHabits,
  getTodayPriorityHabits,
  removePriorityId,
  reorderPriorityIds,
} from "../utils/dailyPlanning";
import { getVisibleRank } from "../utils/rankDisplay";
import { getBadgeUnlockDismissDelay } from "../utils/badgeUnlockTiming";
import {
  getCurrentStreak,
  getTodayKey,
  wasCompletedToday,
} from "../utils/habitStats";
import {
  completeHabitTodayWithRewards,
  undoHabitTodayWithRewards,
} from "../utils/habitCompletionActions";
import { getFirstSwipeHintState } from "../utils/firstUseExperience";
import { getReturnExperienceState } from "../utils/returnExperience";
import { shouldRunInitialCompletionHaptic } from "../utils/interactionFeedback";
import { useReducedMotion } from "./useReducedMotion";

export function useHomeController() {
  const reduceMotion = useReducedMotion();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [celebration, setCelebration] = useState("");
  const [completionReward, setCompletionReward] = useState(null);
  const [badgeUnlockQueue, setBadgeUnlockQueue] = useState([]);
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
  const [preferences, setPreferences] = useState(defaultAppPreferences);
  const [progressExpanded, setProgressExpanded] = useState(null);
  const [swipeHintVisible, setSwipeHintVisible] = useState(false);
  const [returnExperience, setReturnExperience] = useState(null);
  const habitActionInProgressRef = useRef(new Set());
  const todayKeyRef = useRef(getTodayKey());
  const badgeUnlock = badgeUnlockQueue[0] || null;
  const activeRewardType = useMemo(
    () =>
      getActiveRewardType({
        badgeUnlock,
        celebration,
        completionReward,
        levelUp,
        perfectDay,
      }),
    [badgeUnlock, celebration, completionReward, levelUp, perfectDay]
  );
  const activeRewardAnnouncement = useMemo(
    () =>
      getRewardAccessibilityAnnouncement(activeRewardType, {
        badgeUnlock,
        celebration,
        completionReward,
        levelUp,
        perfectDay,
      }),
    [
      activeRewardType,
      badgeUnlock,
      celebration,
      completionReward,
      levelUp,
      perfectDay,
    ]
  );

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
        setBadgeUnlockQueue(queuedRewards.badgeUnlocks);

        if (queuedRewards.levelUp) {
          try {
            await setLastShownLevel(queuedRewards.levelUp.level);
          } catch {
            // Consumed rewards can still be shown without failing Home hydration.
          }
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
    if (activeRewardType !== "completion") {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setCompletionReward(null);
    }, 3200);

    return () => clearTimeout(timeoutId);
  }, [activeRewardType]);

  useEffect(() => {
    if (activeRewardType !== "badge") {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setBadgeUnlockQueue((queue) => queue.slice(1));
    }, getBadgeUnlockDismissDelay(badgeUnlock?.tier));

    return () => clearTimeout(timeoutId);
  }, [activeRewardType, badgeUnlock]);

  useEffect(() => {
    if (activeRewardType !== "celebration") {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setCelebration("");
    }, 3200);

    return () => clearTimeout(timeoutId);
  }, [activeRewardType, celebration]);

  useEffect(() => {
    if (activeRewardAnnouncement) {
      AccessibilityInfo.announceForAccessibility?.(activeRewardAnnouncement);
    }
  }, [activeRewardAnnouncement]);

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
      if (shouldRunInitialCompletionHaptic(options.source, preferences)) {
        triggerLightHaptic();
      }

      if (wasCompletedToday(habit)) {
        const undoResult = await undoHabitTodayWithRewards(habit.id);

        if (!undoResult.habit) {
          setError("Could not find this habit. Pull to refresh and try again.");
          return;
        }

        setHabits(undoResult.habits);
        setGamification(undoResult.gamification);
        setCelebration("");
        setCompletionReward(null);
        setBadgeUnlockQueue([]);
        setPerfectDay(null);
        setLevelUp(null);

        return;
      }

      const completionResult = await completeHabitTodayWithRewards(habit.id);
      const savedHabit = completionResult.habit;

      if (!savedHabit) {
        setError("Could not find this habit. Pull to refresh and try again.");
        return;
      }

      const award = completionResult.award;
      const xpEarned = Math.max(
        XP_PER_COMPLETION,
        completionResult.gamification.xp - (completionResult.previousXp || 0)
      );
      const rewardLevelInfo = getGamificationLevelInfo(award.gamification);
      const rewardRank = getVisibleRank(getRankForLevel(rewardLevelInfo.level));

      setHabits(completionResult.habits);
      setGamification(award.gamification);
      setCompletionReward({
        habitName: savedHabit.name,
        rank: rewardRank,
        rankProgress: rewardLevelInfo.currentLevelXp,
        source: options.source || "tap",
        streak: getCurrentStreak(savedHabit.completedDates, savedHabit),
        xpEarned,
      });
      setBadgeUnlockQueue(
        preferences.showBadgePopups ? award.badgeUnlocks : []
      );
      setPerfectDay(award.perfectDay || null);
      setCelebration("");

      if (shouldShowConfetti(award.messages, preferences)) {
        setConfettiKey((currentKey) => currentKey + 1);
      }

      if (preferences.enableRewardHaptics) {
        triggerSuccessHaptic();
      }

      if (preferences.showLevelUpPopup) {
        await maybeShowLevelUpSafely(
          award.gamification,
          award.messages,
          setLevelUp
        );
      }

      // These flags improve future presentation but must not turn a saved
      // completion into a visible failure when a cleanup write is unavailable.
      await Promise.allSettled([
        consumeGamificationMessages(),
        dismissSwipeHint(),
        dismissReturnMessage(),
      ]);
    } catch {
      setError("Could not update this habit. Please try again.");
    } finally {
      habitActionInProgressRef.current.delete(habit.id);
    }
  }, [dismissReturnMessage, dismissSwipeHint, preferences]);

  const addPriorityForToday = useCallback(async (habit) => {
    const nextPlan = addPriorityId(dailyPlan, habits, habit.id);

    if (nextPlan.habitIds.length === dailyPlan.habitIds.length) {
      return;
    }

    await persistDailyPlan(nextPlan);
  }, [dailyPlan, habits, persistDailyPlan]);

  const removePriorityForToday = useCallback(async (habit) => {
    const nextPlan = removePriorityId(dailyPlan, habits, habit.id);

    await persistDailyPlan(nextPlan);
  }, [dailyPlan, habits, persistDailyPlan]);

  const movePriorityForToday = useCallback(async (habit, direction) => {
    const nextPlan = reorderPriorityIds(dailyPlan, habits, habit.id, direction);

    await persistDailyPlan(nextPlan);
  }, [dailyPlan, habits, persistDailyPlan]);

  const toggleProgressExpanded = useCallback(() => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setProgressExpanded((value) => !value);
  }, [reduceMotion]);

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
  // Pinned (priority) habits first, in the user's chosen focus order, then
  // everything else - the single list Home renders. Since remainingHabits
  // already excludes priority ids, this is a plain concatenation with no
  // dedup needed.
  const mergedHomeHabits = useMemo(
    () => [...priorityHabits, ...remainingHabits],
    [priorityHabits, remainingHabits]
  );
  const availablePriorityHabits = useMemo(
    () => getAvailablePriorityHabits({ habits, plan: dailyPlan }),
    [dailyPlan, habits]
  );
  const dismissBadgeUnlock = useCallback(() => {
    setBadgeUnlockQueue((queue) => queue.slice(1));
  }, []);

  return {
    activeRewardType,
    addPriorityForToday,
    availablePriorityHabits,
    badgeUnlock,
    celebration,
    completionReward,
    confettiKey,
    dailyPlan,
    error,
    habits,
    handleRefresh,
    handleToggleComplete,
    homeSummary,
    levelUp,
    loading,
    mergedHomeHabits,
    movePriorityForToday,
    perfectDay,
    preferences,
    priorityHabits,
    progressExpanded,
    refreshing,
    dismissSwipeHint,
    dismissReturnMessage,
    dismissBadgeUnlock,
    returnExperience,
    remainingHabits,
    removePriorityForToday,
    setCelebration,
    setCompletionReward,
    setLevelUp,
    setPerfectDay,
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

async function maybeShowLevelUpSafely(gamification, messages, setLevelUp) {
  if (!messages.some((message) => message.includes("Level up"))) {
    return;
  }

  const levelInfo = getGamificationLevelInfo(gamification);
  const lastShownLevel = await getLastShownLevel();

  if (levelInfo.level <= lastShownLevel) {
    return;
  }

  try {
    await setLastShownLevel(levelInfo.level);
  } catch {
    // Do not show a popup that cannot be marked as seen and may repeat.
    return;
  }

  setLevelUp({
    level: levelInfo.level,
    progress: (levelInfo.currentLevelXp / XP_PER_LEVEL) * 100,
    rank: getVisibleRank(getRankForLevel(levelInfo.level)),
  });
}
