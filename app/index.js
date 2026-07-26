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
import { BadgeMedal } from "../components/progression";
import { AppText } from "../components/ui";
import { themes } from "../constants/colors";
import {
  v2FontWeight,
  v2Layout,
  v2Radius,
  v2Shadows,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { useHomeController } from "../hooks/useHomeController";
import { rankThemes } from "../utils/gamification";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { colors, setThemePreference } = useTheme();
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
    setBadgeUnlock,
    setCelebration,
    setCompletionReward,
    setLevelUp,
    setPerfectDay,
    setThemeUnlock,
    themeUnlock,
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
    todayXp,
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
            <AppText style={styles.todayTitle}>Today</AppText>
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
            <View style={styles.progressHeader}>
              <View>
                <AppText style={styles.progressLabel}>Daily progress</AppText>
                <AppText style={styles.progressValue}>{completionLabel}</AppText>
              </View>
              <AppText style={styles.progressCount}>
                {completedTodayCount}/{habits.length}
              </AppText>
            </View>

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
                  <AppText style={styles.progressMeta}>{todayXp} XP today</AppText>
                </>
              ) : null}
              <AppText style={styles.progressMeta}>🔥 {longestCurrentStreak}</AppText>
            </View>
          </View>
        ) : null}

        {progressExpanded && preferences.showProgressCard ? (
          <View style={styles.focusNote}>
            <AppText style={styles.focusNoteText}>{motivation}</AppText>
          </View>
        ) : null}

        {preferences.showProgressCard ? (
          <Pressable
            accessibilityLabel={
              progressExpanded ? "Hide progress detail" : "Show progress detail"
            }
            accessibilityRole="button"
            onPress={toggleProgressExpanded}
            style={({ pressed }) => [
              styles.progressTextButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <AppText style={styles.progressTextButtonLabel}>
              {progressExpanded ? "Hide focus note" : "Show focus note"}
            </AppText>
          </Pressable>
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

        {badgeUnlock && !completionReward && !perfectDay && !levelUp && !themeUnlock ? (
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

        <View style={styles.listHeader}>
          <View style={styles.listHeaderText}>
            <View style={styles.listTitleRow}>
              <AppText style={styles.listTitle}>Habits</AppText>
              <AppText style={styles.doneBadgeText}>
                {completedTodayCount}/{habits.length} done
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
            <AppText style={styles.inlineAddText}>+ Add</AppText>
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
              <AppText style={styles.rankIcon}>{getRankIcon(levelUp?.rank)}</AppText>
              <AppText style={styles.levelModalEyebrow}>Rank up</AppText>
              <AppText style={styles.levelModalTitle}>Level {levelUp?.level}</AppText>
              <AppText style={styles.levelModalRank}>{levelUp?.rank} Rank</AppText>
              <AppText style={styles.levelModalMessage}>
                Your consistency is turning into momentum.
              </AppText>
              {levelUp?.themeUnlock ? (
                <AppText style={styles.levelModalUnlock}>
                  Theme unlocked: {levelUp.themeUnlock.label}
                </AppText>
              ) : null}
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
        onRequestClose={() => setThemeUnlock(null)}
        visible={Boolean(themeUnlock) && !completionReward && !perfectDay && !levelUp}
      >
        <View style={styles.levelModalBackdrop}>
          <View style={styles.levelModalCard}>
            <ScrollView
              contentContainerStyle={styles.levelModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <AppText style={styles.levelModalEyebrow}>Theme unlocked</AppText>
              <AppText style={styles.levelModalTitle}>
                {getThemeUnlockLabel(themeUnlock)} Theme
              </AppText>
              <ThemePreview achievement={themeUnlock} styles={styles} />
              <AppText style={styles.levelModalMessage}>
                Preview your new rank theme and equip it instantly.
              </AppText>
              <View style={styles.modalButtonRow}>
                <Pressable
                  accessibilityLabel="Equip unlocked theme later"
                  accessibilityRole="button"
                  onPress={() => setThemeUnlock(null)}
                  style={({ pressed }) => [
                    styles.levelModalSecondaryButton,
                    styles.modalButtonFlex,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <AppText style={styles.levelModalSecondaryText}>Later</AppText>
                </Pressable>
                <Pressable
                  accessibilityLabel="Equip unlocked theme"
                  accessibilityRole="button"
                  onPress={() => {
                    if (themeUnlock?.themeKey) {
                      setThemePreference(themeUnlock.themeKey);
                    }
                    setThemeUnlock(null);
                  }}
                  style={({ pressed }) => [
                    styles.levelModalButton,
                    styles.modalButtonFlex,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <AppText style={styles.levelModalButtonText}>Equip</AppText>
                </Pressable>
              </View>
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
              <AppText style={styles.rankIcon}>★</AppText>
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

function getRankIcon(rank) {
  if (rank === "Master") {
    return "◆";
  }

  if (rank === "Diamond") {
    return "◇";
  }

  if (rank === "Platinum") {
    return "✦";
  }

  if (rank === "Gold") {
    return "★";
  }

  if (rank === "Silver") {
    return "●";
  }

  return "◉";
}

function getThemeUnlockLabel(achievement) {
  const theme = rankThemes.find((item) => item.key === achievement?.themeKey);

  return theme?.label || achievement?.title?.replace(" Theme", "") || "New";
}

function ThemePreview({ achievement, styles }) {
  const previewColors = themes[achievement?.themeKey] || themes.light;

  return (
    <View
      style={[
        styles.themeUnlockPreview,
        {
          backgroundColor: previewColors.card,
          borderColor: previewColors.border,
        },
      ]}
    >
      <View style={styles.themeUnlockDots}>
        <View
          style={[
            styles.themeUnlockDot,
            { backgroundColor: previewColors.primary },
          ]}
        />
        <View
          style={[
            styles.themeUnlockDot,
            { backgroundColor: previewColors.accent },
          ]}
        />
        <View
          style={[
            styles.themeUnlockDot,
            { backgroundColor: previewColors.background },
          ]}
        />
      </View>
      <AppText style={[styles.themeUnlockName, { color: previewColors.text }]}>
        {getThemeUnlockLabel(achievement)}
      </AppText>
      <AppText style={[styles.themeUnlockMeta, { color: previewColors.muted }]}>
        Newly unlocked rank theme
      </AppText>
    </View>
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
  todayHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 18,
    paddingTop: isSmallScreen ? 8 : 14,
  },
  todayTitle: {
    color: colors.text,
    fontSize: isSmallScreen ? 26 : 30,
    fontWeight: v2FontWeight.bold,
    lineHeight: isSmallScreen ? 31 : 36,
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
    gap: 12,
    marginBottom: 10,
    paddingVertical: 16,
  },
  progressHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: colors.muted,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.medium,
    marginBottom: 4,
  },
  progressValue: {
    color: colors.text,
    fontSize: isSmallScreen ? 30 : 36,
    fontWeight: v2FontWeight.bold,
    lineHeight: isSmallScreen ? 35 : 42,
  },
  progressCount: {
    color: colors.text,
    fontSize: v2Typography.sectionTitle.fontSize,
    fontWeight: v2FontWeight.bold,
    paddingBottom: 5,
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
  focusNote: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  focusNoteText: {
    color: colors.muted,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: v2Typography.body.lineHeight,
  },
  progressTextButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
    minHeight: 34,
    paddingRight: 12,
    paddingVertical: 6,
  },
  progressTextButtonLabel: {
    color: colors.primary,
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.bold,
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
  rankIcon: {
    color: colors.accent,
    fontSize: 56,
    fontWeight: v2FontWeight.bold,
    marginBottom: 8,
    textAlign: "center",
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
  levelModalSecondaryButton: {
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 20,
    minHeight: 50,
  },
  levelModalSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: v2FontWeight.bold,
  },
  modalButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modalButtonFlex: {
    flex: 1,
    minWidth: 120,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  themeUnlockPreview: {
    borderRadius: v2Radius.large,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  themeUnlockDots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  themeUnlockDot: {
    borderColor: colors.border,
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  themeUnlockName: {
    fontSize: 20,
    fontWeight: v2FontWeight.bold,
  },
  themeUnlockMeta: {
    fontSize: 12,
    fontWeight: v2FontWeight.medium,
    marginTop: 4,
  },
  });
}
