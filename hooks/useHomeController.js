import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { AppState, LayoutAnimation } from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  defaultAppPreferences,
  getAppPreferences,
  getLastShownLevel,
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
  getThemeUnlockForLevel,
  getVisibleHomeHabits,
  shouldShowConfetti,
} from "../utils/homeHabitActions";
import {
  getCurrentStreak,
  getTodayKey,
  wasCompletedToday,
} from "../utils/habitStats";

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
  const [themeUnlock, setThemeUnlock] = useState(null);
  const [moveCompletedToBottom, setMoveCompletedToBottom] = useState(false);
  const [preferences, setPreferences] = useState(defaultAppPreferences);
  const [progressExpanded, setProgressExpanded] = useState(null);
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
        messages,
        storedGamification,
      ] = await Promise.all([
        getHabits(),
        getAppPreferences(),
        consumeGamificationMessages(),
        getGamification(),
      ]);

      if (!isActive()) {
        return;
      }

      setHabits(storedHabits);
      setMoveCompletedToBottom(storedPreferences.moveCompletedToBottom);
      setPreferences(storedPreferences);
      setGamification(storedGamification);

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
        setThemeUnlock(queuedRewards.themeUnlock);
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

        const nextHabits = habits.map((item) =>
          item.id === habit.id ? savedHabit : item
        );
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

      const nextHabits = habits.map((item) =>
        item.id === habit.id ? savedHabit : item
      );
      const previousXp = gamification?.xp || 0;
      const award = await awardHabitCompletion({
        completedHabit: savedHabit,
        habits: nextHabits,
      });
      const xpEarned = Math.max(10, award.gamification.xp - previousXp);
      const rewardLevelInfo = getGamificationLevelInfo(award.gamification);
      const rewardRank = getRankForLevel(rewardLevelInfo.level);

      await consumeGamificationMessages();

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
      setThemeUnlock(award.themeUnlocks[0] || null);
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
  }, [gamification, habits, preferences]);

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

  return {
    badgeUnlock,
    celebration,
    completionReward,
    confettiKey,
    error,
    habits,
    handleRefresh,
    handleToggleComplete,
    homeSummary,
    levelUp,
    loading,
    perfectDay,
    preferences,
    progressExpanded,
    refreshing,
    setBadgeUnlock,
    setCelebration,
    setCompletionReward,
    setLevelUp,
    setPerfectDay,
    setThemeUnlock,
    themeUnlock,
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
    rank: getRankForLevel(levelInfo.level),
    themeUnlock: getThemeUnlockForLevel(levelInfo.level),
  });
}
