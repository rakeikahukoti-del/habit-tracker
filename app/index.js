import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import BottomNav from "../components/BottomNav";
import { MomentumWolfMark } from "../components/brand";
import ConfettiBurst from "../components/ConfettiBurst";
import EmptyState from "../components/EmptyState";
import HabitCard from "../components/HabitCard";
import { BadgeMedal, RankMedal } from "../components/progression";
import { AppIcon, AppText } from "../components/ui";
import {
  v2FontWeight,
  v2Layout,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { useHomeController } from "../hooks/useHomeController";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { getNextPriorityHabit } from "../utils/dailyPlanning";
import { getCurrentStreak } from "../utils/habitStats";
import {
  PERFECT_DAY_BONUS_XP,
  XP_PER_LEVEL,
} from "../utils/gamification";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
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

  const renderHabitItem = useCallback(
    ({ item }) => (
      <View style={styles.listItem}>
        <HabitCard
          habit={item}
          enableLongPressReorder={preferences.enableLongPressReorder}
          enableSwipeToComplete={preferences.enableSwipeToComplete}
          onReorderPress={handleReorderPress}
          onToggleComplete={handleToggleComplete}
        />
      </View>
    ),
    [
      handleReorderPress,
      handleToggleComplete,
      preferences.enableLongPressReorder,
      preferences.enableSwipeToComplete,
      styles.listItem,
    ]
  );
  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [styles.separator]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ConfettiBurst trigger={confettiKey} />
      <View style={styles.container}>
        <View style={styles.todayHeader}>
          <View>
            <AppText style={styles.todayTitle}>Momentum</AppText>
            <AppText style={styles.todayDate}>{formatTodayDate()}</AppText>
          </View>
          <MomentumWolfMark decorative size={34} />
        </View>

        {preferences.showProgressCard ? (
          <View style={styles.progressPanel}>
            <Pressable
              accessibilityLabel={
                progressExpanded
                  ? `Collapse daily progression. ${completedTodayCount} of ${scheduledTodayCount} scheduled habits complete. ${nextAction}.`
                  : `Expand daily progression. ${completedTodayCount} of ${scheduledTodayCount} scheduled habits complete. ${nextAction}.`
              }
              accessibilityRole="button"
              accessibilityState={{ expanded: Boolean(progressExpanded) }}
              onPress={toggleProgressExpanded}
              style={({ pressed }) => [
                styles.progressHeader,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.progressHeaderText}>
                <AppText style={styles.progressLabel}>Today</AppText>
                <AppText style={styles.progressValue}>{completionLabel}</AppText>
                {!progressExpanded ? (
                  <AppText style={styles.progressCompactHint} numberOfLines={2}>
                    {nextAction}
                  </AppText>
                ) : null}
              </View>
              <View style={styles.progressHeaderRight}>
                <View style={styles.progressPill}>
                  <AppText style={styles.progressCount}>
                    {todayCountLabel}
                  </AppText>
                </View>
                {!progressExpanded && preferences.showXpRankOnHome ? (
                  <View style={styles.compactRankPill}>
                    <RankMedal rank={rank} size="mini" />
                    <AppText style={styles.compactRankText} numberOfLines={1}>
                      L{levelInfo.level}
                    </AppText>
                  </View>
                ) : null}
                <AppIcon
                  color={colors.muted}
                  name={progressExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  strokeWidth={2}
                />
              </View>
            </Pressable>

            {progressExpanded ? (
              <>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${completionPercentage}%` },
                    ]}
                  />
                </View>

                <View style={styles.progressMetaRow}>
                  {preferences.showXpRankOnHome ? (
                    <>
                      <AppText style={styles.progressMeta}>
                        Level {levelInfo.level}
                      </AppText>
                      <AppText style={styles.progressMeta}>
                        {todayXp} XP today
                      </AppText>
                      <View style={styles.rankMeta}>
                        <RankMedal rank={rank} size="mini" />
                        <AppText style={styles.progressMeta}>{rank}</AppText>
                      </View>
                    </>
                  ) : null}
                  <View style={styles.streakMeta}>
                    <AppIcon
                      color={colors.muted}
                      name="flame"
                      size={15}
                      strokeWidth={1.6}
                    />
                    <AppText style={styles.progressMeta}>
                      {longestCurrentStreak} streak
                    </AppText>
                  </View>
                  <AppText style={styles.progressMeta}>
                    {remainingTodayCount === 0
                      ? "Scheduled work clear"
                      : `${remainingTodayCount} remaining`}
                  </AppText>
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        {progressExpanded && preferences.showProgressCard ? (
          <View style={styles.focusNote}>
            <AppText style={styles.focusNoteLabel}>Next</AppText>
            <AppText style={styles.focusNoteText}>{motivation}</AppText>
            <AppText style={styles.weeklyContextText}>{weeklyContext}</AppText>
          </View>
        ) : null}

        {activeRewardType === "celebration" ? (
          <Pressable
            accessibilityLabel="Dismiss celebration message"
            accessibilityRole="button"
            onPress={() => setCelebration("")}
            style={({ pressed }) => [
              styles.celebrationBanner,
              pressed && styles.cardPressed,
            ]}
          >
            <AppText style={styles.celebrationText}>{celebration}</AppText>
          </Pressable>
        ) : null}

        {activeRewardType === "completion" && completionReward ? (
          <Pressable
            accessibilityLabel={`${completionReward.habitName} completed. ${completionReward.xpEarned} XP earned. ${completionReward.streak} day streak. Double tap to dismiss.`}
            accessibilityRole="button"
            onPress={() => setCompletionReward(null)}
            style={({ pressed }) => [
              styles.completionPopup,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.completionPopupTop}>
              <AppText style={styles.completionPopupEyebrow}>Completed</AppText>
              <AppText style={styles.completionPopupXp}>
                +{completionReward.xpEarned} XP
              </AppText>
            </View>
            <AppText style={styles.completionPopupTitle} numberOfLines={2}>
              {completionReward.habitName}
            </AppText>
            <AppText style={styles.completionPopupMeta}>
              {completionReward.streak} day streak • {completionReward.rank} •{" "}
              {completionReward.rankProgress}/{XP_PER_LEVEL} XP
            </AppText>
          </Pressable>
        ) : null}

        {activeRewardType === "badge" && badgeUnlock ? (
          <Pressable
            accessibilityLabel={`${badgeUnlock.label} achievement unlocked. ${badgeUnlock.description}. Double tap to dismiss.`}
            accessibilityRole="button"
            onPress={dismissBadgeUnlock}
            style={({ pressed }) => [
              styles.badgeUnlockPopup,
              pressed && styles.cardPressed,
            ]}
          >
            <BadgeMedal badge={badgeUnlock} earned large />
            <View style={styles.badgeUnlockContent}>
              <AppText style={styles.badgeUnlockEyebrow}>Badge earned</AppText>
              <AppText style={styles.badgeUnlockTitle}>{badgeUnlock.label}</AppText>
              <AppText style={styles.badgeUnlockDescription}>
                {badgeUnlock.description}
              </AppText>
              <View style={styles.badgeUnlockFooter}>
                <AppText style={styles.badgeUnlockTier}>{badgeUnlock.tier}</AppText>
                <AppText style={styles.badgeUnlockRarity}>
                  {badgeUnlock.rarity}
                </AppText>
              </View>
            </View>
          </Pressable>
        ) : null}

        {error ? <AppText style={styles.errorBanner}>{error}</AppText> : null}

        {returnExperience?.shouldShow ? (
          <Pressable
            accessibilityHint="Dismisses this return message for today."
            accessibilityLabel={`${returnExperience.message}. Double tap to dismiss.`}
            accessibilityRole="button"
            onPress={dismissReturnMessage}
            style={({ pressed }) => [
              styles.returnCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.returnIcon}>
              <AppIcon
                color={colors.primary}
                name="home"
                size={18}
                strokeWidth={2}
              />
            </View>
            <View style={styles.returnText}>
              <AppText style={styles.returnTitle}>Today</AppText>
              <AppText style={styles.returnBody}>{returnExperience.message}</AppText>
            </View>
            <AppText style={styles.returnDismiss}>Dismiss</AppText>
          </Pressable>
        ) : null}

        {swipeHintVisible ? (
          <Pressable
            accessibilityHint="Dismisses this one-time swipe tip."
            accessibilityLabel="Swipe right to complete a habit. Double tap to dismiss this tip."
            accessibilityRole="button"
            onPress={dismissSwipeHint}
            style={({ pressed }) => [
              styles.swipeHint,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.swipeHintIcon}>
              <AppIcon
                color={colors.primary}
                name="check"
                size={18}
                strokeWidth={2.4}
              />
            </View>
            <View style={styles.swipeHintText}>
              <AppText style={styles.swipeHintTitle}>Swipe to complete</AppText>
              <AppText style={styles.swipeHintBody}>
                Swipe a habit right when it is done. Tap the card to view its
                details.
              </AppText>
            </View>
            <AppText style={styles.swipeHintDismiss}>Got it</AppText>
          </Pressable>
        ) : null}

        <View style={styles.focusSection}>
          <View style={styles.focusSectionHeader}>
            <View style={styles.focusSectionText}>
              <AppText style={styles.focusSectionTitle}>Today's Focus</AppText>
              <AppText style={styles.focusSectionSubtitle}>
                {priorityHabits.length > 0
                  ? `${dailyPlanProgress.completedCount}/${dailyPlanProgress.totalCount} priorities complete`
                  : "Choose up to three habits to prioritize today."}
              </AppText>
            </View>
            {priorityHabits.length > 0 ? (
              <Pressable
                accessibilityLabel="Start focus mode"
                accessibilityRole="button"
                onPress={handleOpenFocusMode}
                style={({ pressed }) => [
                  styles.focusStartButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <AppIcon color={colors.inverseText} name="flame" size={15} />
                <AppText style={styles.focusStartText}>Focus</AppText>
              </Pressable>
            ) : null}
          </View>

          {dailyPlanMessage ? (
            <AppText style={styles.dailyPlanMessage}>{dailyPlanMessage}</AppText>
          ) : null}

          {priorityHabits.length > 0 ? (
            <View style={styles.priorityList}>
              {priorityHabits.map((habit, index) => (
                <View key={habit.id} style={styles.priorityItem}>
                  <HabitCard
                    habit={habit}
                    enableLongPressReorder={preferences.enableLongPressReorder}
                    enableSwipeToComplete={preferences.enableSwipeToComplete}
                    onReorderPress={handleReorderPress}
                    onToggleComplete={handleToggleComplete}
                  />
                  <View style={styles.priorityControls}>
                    <Pressable
                      accessibilityLabel={`Move ${habit.name} up in today's focus`}
                      accessibilityRole="button"
                      disabled={index === 0}
                      hitSlop={8}
                      onPress={() => movePriorityForToday(habit, "up")}
                      style={({ pressed }) => [
                        styles.priorityControlButton,
                        index === 0 && styles.priorityControlDisabled,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <AppIcon
                        color={index === 0 ? colors.softText : colors.text}
                        name="chevron-up"
                        size={16}
                      />
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`Move ${habit.name} down in today's focus`}
                      accessibilityRole="button"
                      disabled={index === priorityHabits.length - 1}
                      hitSlop={8}
                      onPress={() => movePriorityForToday(habit, "down")}
                      style={({ pressed }) => [
                        styles.priorityControlButton,
                        index === priorityHabits.length - 1 &&
                          styles.priorityControlDisabled,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <AppIcon
                        color={
                          index === priorityHabits.length - 1
                            ? colors.softText
                            : colors.text
                        }
                        name="chevron-down"
                        size={16}
                      />
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`Remove ${habit.name} from today's focus`}
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => handleRemovePriority(habit)}
                      style={({ pressed }) => [
                        styles.priorityRemoveButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <AppText style={styles.priorityRemoveText}>Remove</AppText>
                    </Pressable>
                  </View>
                </View>
              ))}
              {priorityHabits.length < 3 && availablePriorityHabits.length > 0 ? (
                <View style={styles.priorityAddRow}>
                  <AppText style={styles.priorityAddLabel}>Add to focus</AppText>
                  <View style={styles.priorityPicker}>
                    {availablePriorityHabits.slice(0, 4).map((habit) => (
                      <Pressable
                        accessibilityLabel={`Add ${habit.name} to today's focus`}
                        accessibilityRole="button"
                        key={habit.id}
                        onPress={() => handleAddPriority(habit)}
                        style={({ pressed }) => [
                          styles.priorityChip,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <AppText style={styles.priorityChipEmoji}>
                          {habit.emoji || "•"}
                        </AppText>
                        <AppText
                          numberOfLines={1}
                          style={styles.priorityChipText}
                        >
                          {habit.name}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ) : availablePriorityHabits.length > 0 ? (
            <View style={styles.priorityPicker}>
              {availablePriorityHabits.slice(0, 5).map((habit) => (
                <Pressable
                  accessibilityLabel={`Add ${habit.name} to today's focus`}
                  accessibilityRole="button"
                  key={habit.id}
                  onPress={() => handleAddPriority(habit)}
                  style={({ pressed }) => [
                    styles.priorityChip,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <AppText style={styles.priorityChipEmoji}>
                    {habit.emoji || "•"}
                  </AppText>
                  <AppText numberOfLines={1} style={styles.priorityChipText}>
                    {habit.name}
                  </AppText>
                </Pressable>
              ))}
            </View>
          ) : habits.length > 0 ? (
            <AppText style={styles.noFocusText}>
              Nothing is scheduled for today.
            </AppText>
          ) : null}
        </View>

        <View style={styles.listHeader}>
          <View style={styles.listHeaderText}>
            <View style={styles.listTitleRow}>
              <AppText style={styles.listTitle}>{habitListTitle}</AppText>
              <AppText style={styles.doneBadgeText}>
                {todayCountLabel}
              </AppText>
            </View>
            <AppText style={styles.listSubtitle}>{habitListMessage}</AppText>
          </View>
          <Pressable
            accessibilityLabel="Add a new habit"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push("/add")}
            style={({ pressed }) => [
              styles.inlineAddButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <AppIcon color={colors.text} name="plus" size={17} strokeWidth={2.2} />
            <AppText style={styles.inlineAddText}>Add</AppText>
          </Pressable>
        </View>

        <FlatList
          style={styles.list}
          data={homeListHabits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            homeListHabits.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={colors.primary} />
                <AppText style={styles.loadingText}>Loading habits...</AppText>
              </View>
            ) : habits.length === 0 ? (
              <EmptyState />
            ) : (
              <View style={styles.remainingEmptyState}>
                <AppText style={styles.remainingEmptyTitle}>
                  Your focus list is set
                </AppText>
                <AppText style={styles.remainingEmptyText}>
                  Everything else is clear for today.
                </AppText>
              </View>
            )
          }
          renderItem={renderHabitItem}
          initialNumToRender={8}
          ItemSeparatorComponent={renderSeparator}
          maxToRenderPerBatch={8}
          showsVerticalScrollIndicator={false}
          windowSize={7}
        />
      </View>

      <Modal
        transparent
        animationType="fade"
        onRequestClose={handleCloseFocusMode}
        visible={focusModeVisible}
      >
        <View style={styles.levelModalBackdrop}>
          <View
            accessibilityViewIsModal
            importantForAccessibility="yes"
            style={styles.modalCard}
          >
            <ScrollView
              contentContainerStyle={styles.focusModalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.focusModalIcon}>
                <AppIcon
                  color={colors.primary}
                  name={focusComplete ? "check" : "flame"}
                  size={24}
                  strokeWidth={2.2}
                />
              </View>
              <AppText style={styles.levelModalEyebrow}>Focus Mode</AppText>
              <AppText style={styles.focusModalTitle}>
                {focusComplete
                  ? "Today's focus is complete"
                  : focusHabit?.name || "No focus habit"}
              </AppText>
              <AppText style={styles.focusModalBody}>
                {focusComplete
                  ? "All priority habits are complete for today."
                  : focusHabit
                    ? `${dailyPlanProgress.completedCount}/${dailyPlanProgress.totalCount} complete • ${focusStreak} streak`
                    : "All incomplete priorities were skipped for this session."}
              </AppText>
              {focusHabit && !focusComplete ? (
                <View style={styles.focusHabitPreview}>
                  <AppText style={styles.focusHabitEmoji}>
                    {focusHabit.emoji || "•"}
                  </AppText>
                  <View style={styles.focusHabitText}>
                    <AppText numberOfLines={2} style={styles.focusHabitName}>
                      {focusHabit.name}
                    </AppText>
                    <AppText numberOfLines={1} style={styles.focusHabitCategory}>
                      {focusHabit.category || "General"}
                    </AppText>
                  </View>
                </View>
              ) : null}
              <View style={styles.focusModalActions}>
                {focusHabit && !focusComplete ? (
                  <>
                    <Pressable
                      accessibilityLabel={`Complete ${focusHabit.name}`}
                      accessibilityRole="button"
                      disabled={focusBusy}
                      onPress={handleFocusComplete}
                      style={({ pressed }) => [
                        styles.focusPrimaryButton,
                        focusBusy && styles.priorityControlDisabled,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <AppText style={styles.focusPrimaryButtonText}>
                        Complete
                      </AppText>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`Skip ${focusHabit.name} for this focus session`}
                      accessibilityRole="button"
                      onPress={handleFocusSkip}
                      style={({ pressed }) => [
                        styles.focusSecondaryButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <AppText style={styles.focusSecondaryButtonText}>
                        Skip
                      </AppText>
                    </Pressable>
                  </>
                ) : null}
                <Pressable
                  accessibilityLabel="Exit focus mode"
                  accessibilityRole="button"
                  onPress={handleCloseFocusMode}
                  style={({ pressed }) => [
                    styles.focusExitButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <AppText style={styles.focusExitButtonText}>Exit</AppText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType={reduceMotion ? "none" : "fade"}
        onRequestClose={() => setLevelUp(null)}
        visible={activeRewardType === "level-up"}
      >
        <View style={styles.levelModalBackdrop}>
          <View
            accessibilityViewIsModal
            importantForAccessibility="yes"
            style={styles.modalCard}
          >
            <ScrollView
              contentContainerStyle={styles.levelModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <RankMedal rank={levelUp?.rank} size="large" />
              <AppText style={styles.levelModalEyebrow}>Level up</AppText>
              <AppText style={styles.levelModalTitle}>Level {levelUp?.level}</AppText>
              <AppText style={styles.levelModalRank}>{levelUp?.rank} Rank</AppText>
              <AppText style={styles.levelModalMessage}>
                Your progress has reached a new level.
              </AppText>
              <View style={styles.levelModalTrack}>
                <View
                  style={[
                    styles.levelModalFill,
                    { width: `${levelUp?.progress || 0}%` },
                  ]}
                />
              </View>
              <Pressable
                accessibilityLabel="Close level up message"
                accessibilityRole="button"
                onPress={() => setLevelUp(null)}
                style={({ pressed }) => [
                  styles.levelModalButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <AppText style={styles.levelModalButtonText}>Continue</AppText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType={reduceMotion ? "none" : "fade"}
        onRequestClose={() => setPerfectDay(null)}
        visible={activeRewardType === "perfect-day"}
      >
        <View style={styles.levelModalBackdrop}>
          <View
            accessibilityViewIsModal
            importantForAccessibility="yes"
            style={styles.modalCard}
          >
            <ScrollView
              contentContainerStyle={styles.levelModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalIconCircle}>
                <AppIcon
                  color={colors.accent}
                  name="star"
                  size={34}
                  strokeWidth={2.4}
                />
              </View>
              <AppText style={styles.levelModalEyebrow}>Perfect day</AppText>
              <AppText style={styles.levelModalTitle}>All habits complete</AppText>
              <AppText style={styles.levelModalMessage}>
                You cleared every habit today and earned the perfect day bonus.
              </AppText>
              <AppText style={styles.levelModalUnlock}>
                +{PERFECT_DAY_BONUS_XP} bonus XP
              </AppText>
              <Pressable
                accessibilityLabel="Close perfect day message"
                accessibilityRole="button"
                onPress={() => setPerfectDay(null)}
                style={({ pressed }) => [
                  styles.levelModalButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <AppText style={styles.levelModalButtonText}>Nice</AppText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <BottomNav />
    </SafeAreaView>
  );
}

function formatTodayDate() {
  return new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
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
  todayHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingTop: isSmallScreen ? 6 : 10,
  },
  todayTitle: {
    color: colors.text,
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: v2FontWeight.bold,
    lineHeight: isSmallScreen ? 29 : 34,
  },
  todayDate: {
    color: colors.muted,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.medium,
    marginTop: 3,
  },
  progressPanel: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    marginBottom: 6,
    paddingVertical: 12,
  },
  progressHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  progressHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  progressLabel: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    marginBottom: 4,
  },
  progressValue: {
    color: colors.text,
    fontSize: isSmallScreen ? 28 : v2Typography.largeMetric.fontSize,
    fontWeight: v2FontWeight.bold,
    lineHeight: isSmallScreen ? 33 : v2Typography.largeMetric.lineHeight,
  },
  progressCompactHint: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: 18,
    marginTop: 3,
    maxWidth: isSmallScreen ? 190 : 240,
  },
  progressHeaderRight: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    flexWrap: "wrap",
    gap: v2Spacing.sm,
    justifyContent: "flex-end",
    maxWidth: "48%",
  },
  progressPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  progressCount: {
    color: colors.text,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  compactRankPill: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 9,
  },
  compactRankText: {
    color: colors.text,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  progressMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  progressMeta: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
  },
  rankMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: v2Spacing.xs,
  },
  streakMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: v2Spacing.xs,
  },
  focusNote: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  focusNoteLabel: {
    color: colors.primary,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.bold,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  focusNoteText: {
    color: colors.muted,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: v2Typography.body.lineHeight,
  },
  weeklyContextText: {
    color: colors.softText,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: 18,
    marginTop: 6,
  },
  progressTrack: {
    backgroundColor: colors.inputBackground,
    borderRadius: v2Radius.pill,
    height: 12,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: v2Radius.pill,
    height: "100%",
  },
  celebrationBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: v2Radius.medium,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  celebrationText: {
    color: colors.text,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.bold,
    lineHeight: 18,
  },
  completionPopup: {
    backgroundColor: colors.card,
    borderColor: colors.accent,
    borderRadius: v2Radius.feature,
    borderWidth: 1.5,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...v2Shadows.medium,
    shadowColor: colors.accent,
    shadowOpacity: 0.16,
  },
  completionPopupTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  completionPopupEyebrow: {
    color: colors.accent,
    fontSize: v2Typography.navigationLabel.fontSize,
    fontWeight: v2FontWeight.bold,
    textTransform: "uppercase",
  },
  completionPopupXp: {
    color: colors.primary,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  completionPopupTitle: {
    color: colors.text,
    fontSize: v2Typography.cardTitle.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  completionPopupMeta: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: 18,
    marginTop: 5,
  },
  badgeUnlockPopup: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.accent,
    borderRadius: v2Radius.feature,
    borderWidth: 1.5,
    gap: 14,
    marginBottom: 10,
    paddingHorizontal: 18,
    paddingVertical: 20,
    ...v2Shadows.medium,
    shadowColor: colors.accent,
    shadowOpacity: 0.18,
  },
  badgeUnlockContent: {
    alignItems: "center",
    gap: 7,
    width: "100%",
  },
  badgeUnlockEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: v2FontWeight.bold,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  badgeUnlockRarity: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: v2FontWeight.bold,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: "uppercase",
  },
  badgeUnlockTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: v2FontWeight.bold,
    textAlign: "center",
  },
  badgeUnlockDescription: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: 18,
    textAlign: "center",
  },
  badgeUnlockFooter: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    marginTop: 4,
  },
  badgeUnlockTier: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: v2FontWeight.bold,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: v2Radius.small,
    color: colors.danger,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  swipeHint: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    flexDirection: "row",
    gap: v2Spacing.md,
    marginBottom: 8,
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...v2Shadows.low,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
  },
  returnCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    flexDirection: "row",
    gap: v2Spacing.md,
    marginBottom: 8,
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...v2Shadows.low,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
  },
  returnIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: v2Radius.medium,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  returnText: {
    flex: 1,
    minWidth: 0,
  },
  returnTitle: {
    color: colors.text,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  returnBody: {
    color: colors.muted,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: v2Typography.caption.lineHeight,
    marginTop: 2,
  },
  returnDismiss: {
    color: colors.primary,
    flexShrink: 0,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  swipeHintIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: v2Radius.medium,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  swipeHintText: {
    flex: 1,
    minWidth: 0,
  },
  swipeHintTitle: {
    color: colors.text,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  swipeHintBody: {
    color: colors.muted,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: v2Typography.caption.lineHeight,
    marginTop: 2,
  },
  swipeHintDismiss: {
    color: colors.primary,
    flexShrink: 0,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  focusSection: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
    paddingBottom: 12,
    paddingTop: 8,
  },
  focusSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: v2Spacing.md,
    justifyContent: "space-between",
    width: "100%",
  },
  focusSectionText: {
    flex: 1,
    minWidth: 0,
  },
  focusSectionTitle: {
    color: colors.text,
    fontSize: v2Typography.sectionTitle.fontSize,
    fontWeight: v2FontWeight.bold,
    lineHeight: v2Typography.sectionTitle.lineHeight,
  },
  focusSectionSubtitle: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: 18,
    marginTop: 3,
  },
  focusStartButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: v2Radius.pill,
    flexDirection: "row",
    gap: v2Spacing.xs,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 92,
    paddingHorizontal: 14,
  },
  focusStartText: {
    color: colors.inverseText,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  dailyPlanMessage: {
    color: colors.primary,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.bold,
    lineHeight: v2Typography.caption.lineHeight,
  },
  priorityList: {
    gap: 12,
    width: "100%",
  },
  priorityAddRow: {
    gap: v2Spacing.xs,
    paddingTop: 2,
    width: "100%",
  },
  priorityAddLabel: {
    color: colors.muted,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.bold,
    lineHeight: v2Typography.caption.lineHeight,
  },
  priorityItem: {
    gap: v2Spacing.xs,
    width: "100%",
  },
  priorityControls: {
    alignItems: "center",
    flexDirection: "row",
    gap: v2Spacing.sm,
    justifyContent: "flex-end",
    paddingHorizontal: 2,
  },
  priorityControlButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  priorityControlDisabled: {
    opacity: 0.42,
  },
  priorityRemoveButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 12,
  },
  priorityRemoveText: {
    color: colors.muted,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  priorityPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: v2Spacing.sm,
    width: "100%",
  },
  priorityChip: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: v2Spacing.xs,
    maxWidth: "100%",
    minHeight: 40,
    paddingHorizontal: 12,
  },
  priorityChipEmoji: {
    color: colors.text,
    fontSize: 15,
  },
  priorityChipText: {
    color: colors.text,
    flexShrink: 1,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.bold,
    maxWidth: isSmallScreen ? 170 : 230,
  },
  noFocusText: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: 18,
  },
  listHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingTop: 10,
    width: "100%",
  },
  listHeaderText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  listTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  listTitle: {
    color: colors.text,
    fontSize: isSmallScreen ? v2Typography.cardTitle.fontSize : v2Typography.sectionTitle.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  listSubtitle: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: 18,
    marginTop: 4,
  },
  doneBadgeText: {
    color: colors.muted,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  inlineAddButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    flexDirection: "row",
    gap: v2Spacing.xs,
    justifyContent: "center",
    marginTop: 1,
    minHeight: 44,
    minWidth: 76,
    paddingHorizontal: 14,
  },
  inlineAddText: {
    color: colors.text,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  loadingState: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    gap: 10,
    marginTop: 24,
    padding: 28,
  },
  loadingText: {
    color: colors.muted,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.medium,
  },
  listContent: {
    paddingBottom: 32,
    paddingTop: 6,
    width: "100%",
  },
  list: {
    width: "100%",
  },
  listItem: {
    maxWidth: "100%",
    width: "100%",
  },
  emptyListContent: {
    flexGrow: 1,
  },
  remainingEmptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    marginTop: 8,
    padding: 18,
  },
  remainingEmptyTitle: {
    color: colors.text,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  remainingEmptyText: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: 18,
    marginTop: 4,
    textAlign: "center",
  },
  separator: {
    height: 10,
  },
  levelModalBackdrop: {
    alignItems: "center",
    backgroundColor: colors.modalBackdrop,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    alignItems: "stretch",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    maxHeight: "82%",
    maxWidth: 360,
    padding: 22,
    ...v2Shadows.floating,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    width: "100%",
  },
  focusModalContent: {
    alignItems: "stretch",
  },
  focusModalIcon: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    marginBottom: v2Spacing.md,
    width: 56,
  },
  focusModalTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: v2FontWeight.bold,
    lineHeight: 30,
  },
  focusModalBody: {
    color: colors.muted,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: v2Typography.body.lineHeight,
    marginTop: 8,
  },
  focusHabitPreview: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    flexDirection: "row",
    gap: v2Spacing.md,
    marginTop: 16,
    padding: 14,
  },
  focusHabitEmoji: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
  },
  focusHabitText: {
    flex: 1,
    minWidth: 0,
  },
  focusHabitName: {
    color: colors.text,
    fontSize: v2Typography.cardTitle.fontSize,
    fontWeight: v2FontWeight.bold,
    lineHeight: v2Typography.cardTitle.lineHeight,
  },
  focusHabitCategory: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    marginTop: 3,
  },
  focusModalActions: {
    gap: v2Spacing.sm,
    marginTop: 18,
  },
  focusPrimaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: v2Radius.large,
    justifyContent: "center",
    minHeight: 50,
  },
  focusPrimaryButtonText: {
    color: colors.inverseText,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  focusSecondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  focusSecondaryButtonText: {
    color: colors.text,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  focusExitButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
  focusExitButtonText: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  levelModalScrollContent: {
    alignItems: "stretch",
  },
  modalIconCircle: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    marginBottom: v2Spacing.md,
    width: 58,
  },
  levelModalEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: v2FontWeight.bold,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  levelModalTitle: {
    color: colors.text,
    fontSize: 34,
    fontWeight: v2FontWeight.bold,
  },
  levelModalRank: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: v2FontWeight.bold,
    marginTop: 4,
  },
  levelModalMessage: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: v2FontWeight.medium,
    lineHeight: 21,
    marginTop: 12,
  },
  levelModalUnlock: {
    backgroundColor: colors.primarySoft,
    borderRadius: v2Radius.small,
    color: colors.primary,
    fontSize: 14,
    fontWeight: v2FontWeight.bold,
    marginTop: 14,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "center",
  },
  levelModalTrack: {
    backgroundColor: colors.inputBackground,
    borderRadius: v2Radius.pill,
    height: 10,
    marginTop: 18,
    overflow: "hidden",
  },
  levelModalFill: {
    backgroundColor: colors.primary,
    borderRadius: v2Radius.pill,
    height: "100%",
  },
  levelModalButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: v2Radius.large,
    justifyContent: "center",
    marginTop: 20,
    minHeight: 50,
  },
  levelModalButtonText: {
    color: colors.inverseText,
    fontSize: 15,
    fontWeight: v2FontWeight.bold,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  });
}
