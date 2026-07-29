import { useCallback, useMemo } from "react";
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
    dismissSwipeHint,
    dismissReturnMessage,
    returnExperience,
    setBadgeUnlock,
    setCelebration,
    setCompletionReward,
    setLevelUp,
    setPerfectDay,
    swipeHintVisible,
    toggleProgressExpanded,
    visibleHabits,
  } = useHomeController();

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
          <MomentumWolfMark
            color={colors.text}
            cutoutColor={colors.background}
            size={34}
          />
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
                <AppText style={styles.progressLabel}>Daily progression</AppText>
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
            <AppText style={styles.focusNoteLabel}>Next action</AppText>
            <AppText style={styles.focusNoteText}>{motivation}</AppText>
            <AppText style={styles.weeklyContextText}>{weeklyContext}</AppText>
          </View>
        ) : null}

        {celebration ? (
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

        {completionReward ? (
          <Pressable
            accessibilityLabel={`Dismiss completion reward for ${
              completionReward.habitName
            }`}
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
              {completionReward.rankProgress}/100 XP
            </AppText>
          </Pressable>
        ) : null}

        {badgeUnlock && !completionReward && !perfectDay && !levelUp ? (
          <Pressable
            accessibilityLabel={`Dismiss ${badgeUnlock.label} badge unlock`}
            accessibilityRole="button"
            onPress={() => setBadgeUnlock(null)}
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

        <View style={styles.listHeader}>
          <View style={styles.listHeaderText}>
            <View style={styles.listTitleRow}>
              <AppText style={styles.listTitle}>Habits</AppText>
              <AppText style={styles.doneBadgeText}>
                {todayCountLabel}
              </AppText>
            </View>
            <AppText style={styles.listSubtitle}>{habitsSectionMessage}</AppText>
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
          data={visibleHabits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            habits.length === 0 && styles.emptyListContent,
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
            ) : (
              <EmptyState />
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
        onRequestClose={() => setLevelUp(null)}
        visible={Boolean(levelUp) && !completionReward && !perfectDay}
      >
        <View style={styles.levelModalBackdrop}>
          <View style={styles.levelModalCard}>
            <ScrollView
              contentContainerStyle={styles.levelModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <RankMedal rank={levelUp?.rank} size="large" />
              <AppText style={styles.levelModalEyebrow}>Rank up</AppText>
              <AppText style={styles.levelModalTitle}>Level {levelUp?.level}</AppText>
              <AppText style={styles.levelModalRank}>{levelUp?.rank} Rank</AppText>
              <AppText style={styles.levelModalMessage}>
                Your consistency is turning into momentum.
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
                <AppText style={styles.levelModalButtonText}>Keep Going</AppText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        onRequestClose={() => setPerfectDay(null)}
        visible={Boolean(perfectDay) && !completionReward}
      >
        <View style={styles.levelModalBackdrop}>
          <View style={styles.levelModalCard}>
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
              <AppText style={styles.levelModalUnlock}>+25 bonus XP</AppText>
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
    paddingBottom: 14,
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
    gap: 10,
    marginBottom: 8,
    paddingVertical: 14,
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
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: v2FontWeight.bold,
    lineHeight: isSmallScreen ? 33 : 38,
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
    marginBottom: 8,
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
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingBottom: 10,
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
    marginTop: 5,
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
    borderRadius: v2Radius.feature,
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
    paddingTop: 8,
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
  separator: {
    height: 12,
  },
  levelModalBackdrop: {
    alignItems: "center",
    backgroundColor: colors.modalBackdrop,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  levelModalCard: {
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
