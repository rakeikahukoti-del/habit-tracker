import { useCallback, useMemo } from "react";
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
  HomeHabitList,
  HomeHeader,
  LevelUpModal,
  PerfectDayModal,
  ReturnExperienceCard,
  SwipeHintCard,
} from "../components/home";
import { AppText } from "../components/ui";
import { v2Breakpoints, v2CompactSpacing, v2FontWeight, v2Layout, v2Radius, v2Spacing, v2Typography } from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { useHomeController } from "../hooks/useHomeController";
import { useReducedMotion } from "../hooks/useReducedMotion";

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
    dismissBadgeUnlock,
    dismissReturnMessage,
    returnExperience,
    removePriorityForToday,
    setCelebration,
    setCompletionReward,
    setLevelUp,
    setPerfectDay,
    swipeHintVisible,
    toggleProgressExpanded,
  } = useHomeController();
  const reduceMotion = useReducedMotion();

  const handleReorderPress = useCallback(() => {
    router.push("/reorder-habits");
  }, []);

  const {
    completedTodayCount,
    completionLabel,
    completionPercentage,
    levelInfo,
    longestCurrentStreak,
    rank,
    remainingTodayCount,
    scheduledTodayCount,
    statusMessage,
    todayCountLabel,
    todayXp,
    weeklyContext,
  } = homeSummary;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ConfettiBurst trigger={confettiKey} />
      <View style={styles.container}>
        <HomeHabitList
          availablePriorityHabits={availablePriorityHabits}
          countLabel={todayCountLabel}
          data={mergedHomeHabits}
          enableLongPressReorder={preferences.enableLongPressReorder}
          enableSwipeToComplete={preferences.enableSwipeToComplete}
          isSmallScreen={isSmallScreen}
          ListHeaderComponent={
            <>
              <HomeHeader isSmallScreen={isSmallScreen} />

              <DailyProgressionPanel
                completedTodayCount={completedTodayCount}
                completionLabel={completionLabel}
                completionPercentage={completionPercentage}
                habitCount={habits.length}
                isSmallScreen={isSmallScreen}
                levelInfo={levelInfo}
                longestCurrentStreak={longestCurrentStreak}
                progressExpanded={progressExpanded}
                rank={rank}
                remainingTodayCount={remainingTodayCount}
                scheduledTodayCount={scheduledTodayCount}
                showProgressCard={preferences.showProgressCard}
                showXpRankOnHome={preferences.showXpRankOnHome}
                statusMessage={statusMessage}
                todayCountLabel={todayCountLabel}
                todayXp={todayXp}
                toggleProgressExpanded={toggleProgressExpanded}
                weeklyContext={weeklyContext}
              />

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
            </>
          }
          loading={loading}
          onAddPress={() => router.push("/add")}
          onAddPriority={handleAddPriority}
          onMovePriority={movePriorityForToday}
          onRefresh={handleRefresh}
          onReorderPress={handleReorderPress}
          onRemovePriority={handleRemovePriority}
          onToggleComplete={handleToggleComplete}
          priorityHabits={priorityHabits}
          refreshing={refreshing}
          title="Today's Habits"
          totalHabitsCount={habits.length}
        />
      </View>

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

      <CompletionRewardCard
        onClose={() => setCompletionReward(null)}
        reward={completionReward}
        visible={activeRewardType === "completion"}
      />

      <BadgeUnlockCard
        badge={badgeUnlock}
        onClose={dismissBadgeUnlock}
        visible={activeRewardType === "badge"}
      />

      <CelebrationBanner
        celebration={celebration}
        onClose={() => setCelebration("")}
        visible={activeRewardType === "celebration"}
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
