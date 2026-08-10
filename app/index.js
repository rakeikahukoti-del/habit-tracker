import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import BottomNav from "../components/BottomNav";
import ConfettiBurst from "../components/ConfettiBurst";
import {
  BadgeUnlockCard,
  CelebrationBanner,
  CompletionRewardCard,
  DailyProgressionPanel,
  FocusModeModal,
  HomeHabitList,
  HomeHeader,
  LevelUpModal,
  PerfectDayModal,
  ReturnExperienceCard,
  SwipeHintCard,
  TodaysFocusSection,
} from "../components/home";
import { AppText } from "../components/ui";
import { v2Breakpoints, v2CompactSpacing, v2FontWeight, v2Layout, v2Radius, v2Spacing, v2Typography } from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { useHomeController } from "../hooks/useHomeController";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { getNextPriorityHabit } from "../utils/dailyPlanning";
import { getCurrentStreak } from "../utils/habitStats";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < v2Breakpoints.smallScreenMaxWidth;
  const isTablet = width >= v2Breakpoints.tabletMinWidth;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen, isTablet }),
    [colors, isSmallScreen, isTablet]
  );
  const {
    activeRewardType,
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
    dismissBadgeUnlock,
    dismissReturnMessage,
    returnExperience,
    remainingHabits,
    removePriorityForToday,
    setCelebration,
    setCompletionReward,
    setLevelUp,
    setPerfectDay,
    setDailyPlanMessage,
    swipeHintVisible,
    toggleProgressExpanded,
    visibleHabits,
  } = useHomeController();
  const reduceMotion = useReducedMotion();
  const [focusModeVisible, setFocusModeVisible] = useState(false);
  const [skippedFocusIds, setSkippedFocusIds] = useState([]);
  const [focusBusy, setFocusBusy] = useState(false);

  const handleReorderPress = useCallback(() => {
    router.push("/reorder-habits");
  }, []);

  const {
    completedTodayCount,
    completionLabel,
    completionPercentage,
    habitsSectionMessage,
    levelInfo,
    longestCurrentStreak,
    motivation,
    nextAction,
    rank,
    remainingTodayCount,
    scheduledTodayCount,
    todayCountLabel,
    todayXp,
    weeklyContext,
  } = homeSummary;
  const homeListHabits = priorityHabits.length > 0 ? remainingHabits : visibleHabits;
  const focusHabit = useMemo(
    () =>
      getNextPriorityHabit({
        habits,
        plan: dailyPlan,
        skippedIds: skippedFocusIds,
      }) || nextPriorityHabit,
    [dailyPlan, habits, nextPriorityHabit, skippedFocusIds]
  );
  const focusComplete = dailyPlanProgress.allComplete;
  const focusStreak = focusHabit
    ? getCurrentStreak(focusHabit.completedDates, focusHabit)
    : 0;
  const habitListTitle =
    priorityHabits.length > 0 ? "More for Today" : "Today's Habits";
  const habitListMessage =
    priorityHabits.length > 0
      ? "Focus habits stay pinned above."
      : habitsSectionMessage;

  const handleOpenFocusMode = useCallback(() => {
    setSkippedFocusIds([]);
    setFocusModeVisible(true);
  }, []);

  const handleCloseFocusMode = useCallback(() => {
    setFocusModeVisible(false);
    setFocusBusy(false);
  }, []);

  const handleFocusComplete = useCallback(async () => {
    if (!focusHabit || focusBusy) {
      return;
    }

    setFocusBusy(true);
    await handleToggleComplete(focusHabit, { source: "focus" });
    setSkippedFocusIds((ids) => ids.filter((id) => id !== focusHabit.id));
    setFocusBusy(false);
  }, [focusBusy, focusHabit, handleToggleComplete]);

  const handleFocusSkip = useCallback(() => {
    if (!focusHabit) {
      return;
    }

    setSkippedFocusIds((ids) =>
      ids.includes(focusHabit.id) ? ids : [...ids, focusHabit.id]
    );
  }, [focusHabit]);

  const handleAddPriority = useCallback(
    async (habit) => {
      await addPriorityForToday(habit);
    },
    [addPriorityForToday]
  );

  const handleRemovePriority = useCallback(
    async (habit) => {
      await removePriorityForToday(habit);
    },
    [removePriorityForToday]
  );

  useEffect(() => {
    if (!dailyPlanMessage) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setDailyPlanMessage("");
    }, 2200);

    return () => clearTimeout(timeoutId);
  }, [dailyPlanMessage, setDailyPlanMessage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ConfettiBurst trigger={confettiKey} />
      <View style={styles.container}>
        <HomeHeader isSmallScreen={isSmallScreen} />

        <DailyProgressionPanel
          completedTodayCount={completedTodayCount}
          completionLabel={completionLabel}
          completionPercentage={completionPercentage}
          isSmallScreen={isSmallScreen}
          levelInfo={levelInfo}
          longestCurrentStreak={longestCurrentStreak}
          motivation={motivation}
          nextAction={nextAction}
          progressExpanded={progressExpanded}
          rank={rank}
          remainingTodayCount={remainingTodayCount}
          scheduledTodayCount={scheduledTodayCount}
          showProgressCard={preferences.showProgressCard}
          showXpRankOnHome={preferences.showXpRankOnHome}
          todayCountLabel={todayCountLabel}
          todayXp={todayXp}
          toggleProgressExpanded={toggleProgressExpanded}
          weeklyContext={weeklyContext}
        />

        {activeRewardType === "celebration" ? (
          <CelebrationBanner
            celebration={celebration}
            onDismiss={() => setCelebration("")}
          />
        ) : null}

        {activeRewardType === "completion" && completionReward ? (
          <CompletionRewardCard
            reward={completionReward}
            onDismiss={() => setCompletionReward(null)}
          />
        ) : null}

        {activeRewardType === "badge" && badgeUnlock ? (
          <BadgeUnlockCard badge={badgeUnlock} onDismiss={dismissBadgeUnlock} />
        ) : null}

        {error ? <AppText style={styles.errorBanner}>{error}</AppText> : null}

        {returnExperience?.shouldShow ? (
          <ReturnExperienceCard
            message={returnExperience.message}
            onDismiss={dismissReturnMessage}
          />
        ) : null}

        {swipeHintVisible ? (
          <SwipeHintCard onDismiss={dismissSwipeHint} />
        ) : null}

        <TodaysFocusSection
          availablePriorityHabits={availablePriorityHabits}
          dailyPlanMessage={dailyPlanMessage}
          dailyPlanProgress={dailyPlanProgress}
          enableLongPressReorder={preferences.enableLongPressReorder}
          enableSwipeToComplete={preferences.enableSwipeToComplete}
          habits={habits}
          isSmallScreen={isSmallScreen}
          onAddPriority={handleAddPriority}
          onMovePriority={movePriorityForToday}
          onOpenFocusMode={handleOpenFocusMode}
          onReorderPress={handleReorderPress}
          onRemovePriority={handleRemovePriority}
          onToggleComplete={handleToggleComplete}
          priorityHabits={priorityHabits}
        />

        <HomeHabitList
          countLabel={todayCountLabel}
          data={homeListHabits}
          enableLongPressReorder={preferences.enableLongPressReorder}
          enableSwipeToComplete={preferences.enableSwipeToComplete}
          isSmallScreen={isSmallScreen}
          loading={loading}
          onAddPress={() => router.push("/add")}
          onRefresh={handleRefresh}
          onReorderPress={handleReorderPress}
          onToggleComplete={handleToggleComplete}
          refreshing={refreshing}
          subtitle={habitListMessage}
          title={habitListTitle}
          totalHabitsCount={habits.length}
        />
      </View>

      <FocusModeModal
        dailyPlanProgress={dailyPlanProgress}
        focusBusy={focusBusy}
        focusComplete={focusComplete}
        focusHabit={focusHabit}
        focusStreak={focusStreak}
        onComplete={handleFocusComplete}
        onExit={handleCloseFocusMode}
        onSkip={handleFocusSkip}
        visible={focusModeVisible}
      />

      <LevelUpModal
        levelUp={levelUp}
        onClose={() => setLevelUp(null)}
        reduceMotion={reduceMotion}
        visible={activeRewardType === "level-up"}
      />

      <PerfectDayModal
        onClose={() => setPerfectDay(null)}
        reduceMotion={reduceMotion}
        visible={activeRewardType === "perfect-day"}
      />
      <BottomNav />
    </SafeAreaView>
  );
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      flex: 1,
      maxWidth: isTablet ? v2Layout.formMaxWidth : "100%",
      paddingHorizontal: isSmallScreen ? v2Layout.screenPaddingCompact : v2Layout.screenPadding,
      overflow: "hidden",
      width: "100%",
    },
    errorBanner: {
      backgroundColor: colors.dangerSoft,
      borderRadius: v2Radius.small,
      color: colors.danger,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      marginBottom: v2Spacing.sm,
      paddingHorizontal: v2CompactSpacing.md,
      paddingVertical: v2CompactSpacing.sm,
    },
  });
}
