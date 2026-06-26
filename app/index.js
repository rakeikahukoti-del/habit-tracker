import { useCallback, useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import BottomNav from "../components/BottomNav";
import ConfettiBurst from "../components/ConfettiBurst";
import EmptyState from "../components/EmptyState";
import HabitCard from "../components/HabitCard";
import { themes } from "../constants/colors";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  radius,
  spacing,
} from "../constants/typography";
import { useTheme } from "../context/ThemeContext";
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
  getBadgeById,
  getGamification,
  getGamificationLevelInfo,
  getRankForLevel,
  rankThemes,
  rebuildGamificationFromHabits,
} from "../storage/gamificationStorage";
import {
  completeHabitForToday,
  getHabits,
  uncompleteHabitForToday,
} from "../storage/habitsStorage";
import {
  getCurrentStreak,
  wasCompletedToday,
} from "../utils/habitStats";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { colors, setThemePreference } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
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

  const loadHabits = useCallback(async () => {
    try {
      setError("");
      const completedOnboarding = await hasCompletedOnboarding();

      if (!completedOnboarding) {
        router.replace("/onboarding");
        return;
      }

      const storedHabits = await getHabits();
      const storedPreferences = await getAppPreferences();
      const messages = await consumeGamificationMessages();
      const storedGamification = await getGamification();

      setHabits(storedHabits);
      setMoveCompletedToBottom(storedPreferences.moveCompletedToBottom);
      setPreferences(storedPreferences);
      setGamification(storedGamification);

      if (progressExpanded === null) {
        setProgressExpanded(storedHabits.length <= 3);
      }

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
      setError("Could not load habits. Pull to refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [progressExpanded]);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

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

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadHabits();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleToggleComplete(habit, options = {}) {
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
        streak: getCurrentStreak(savedHabit.completedDates),
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
    }
  }

  function handleReorderPress() {
    router.push("/reorder-habits");
  }

  function toggleProgressExpanded() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setProgressExpanded((value) => !value);
  }

  const homeSummary = useMemo(() => {
    const completedTodayCount = habits.filter((habit) =>
      wasCompletedToday(habit)
    ).length;
    const completionPercentage =
      habits.length === 0
        ? 0
        : Math.round((completedTodayCount / habits.length) * 100);
    const levelInfo = getGamificationLevelInfo(gamification);

    return {
      completedTodayCount,
      completionLabel:
        habits.length === 0 ? "0%" : `${completionPercentage}%`,
      completionPercentage,
      habitsSectionMessage: getTodayHabitsMessage(completionPercentage),
      levelInfo,
      longestCurrentStreak: habits.reduce(
        (longest, habit) =>
          Math.max(longest, getCurrentStreak(habit.completedDates)),
        0
      ),
      motivation: getProgressMessage(completionPercentage, habits.length),
      rank: getRankForLevel(levelInfo.level),
      todayXp: getTodayXp(habits),
    };
  }, [gamification, habits]);
  const visibleHabits = useMemo(() => {
    const orderedHabits = [...habits].sort(
      (firstHabit, secondHabit) => firstHabit.order - secondHabit.order
    );

    if (!moveCompletedToBottom) {
      return orderedHabits;
    }

    return orderedHabits.sort((firstHabit, secondHabit) => {
      const firstCompleted = wasCompletedToday(firstHabit);
      const secondCompleted = wasCompletedToday(secondHabit);

      if (firstCompleted === secondCompleted) {
        return firstHabit.order - secondHabit.order;
      }

      return firstCompleted ? 1 : -1;
    });
  }, [habits, moveCompletedToBottom]);
  const {
    completedTodayCount,
    completionLabel,
    completionPercentage,
    habitsSectionMessage,
    levelInfo,
    longestCurrentStreak,
    motivation,
    rank,
    todayXp,
  } = homeSummary;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ConfettiBurst trigger={confettiKey} />
      <View style={styles.container}>
        {preferences.showProgressCard ? (
          <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Today's progress</Text>
              <Text style={styles.summaryValue}>
                {completedTodayCount}/{habits.length} complete
              </Text>
            </View>

            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{completionLabel}</Text>
            </View>
          </View>

          <View style={styles.compactSummary}>
            {preferences.showXpRankOnHome ? (
              <>
                <Text style={styles.compactSummaryText}>
                  Level {levelInfo.level} • {rank}
                </Text>
                <Text style={styles.compactSummaryText}>{todayXp} XP today</Text>
              </>
            ) : null}
          </View>

          {progressExpanded ? (
            <View style={styles.progressDetails}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${completionPercentage}%` },
                  ]}
                />
              </View>

              <Text style={styles.motivationText}>{motivation}</Text>

              <View style={styles.summaryStats}>
                {preferences.showXpRankOnHome ? (
                  <>
                    <View style={styles.summaryStat}>
                      <Text style={styles.summaryStatValue}>{todayXp}</Text>
                      <Text style={styles.summaryStatLabel}>XP today</Text>
                    </View>
                    <View style={styles.summaryStat}>
                      <Text style={styles.summaryStatValue}>{rank}</Text>
                      <Text style={styles.summaryStatLabel}>Rank</Text>
                    </View>
                  </>
                ) : null}
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>
                    {longestCurrentStreak}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Streak</Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.summaryFooter}>
            <Pressable
              onPress={toggleProgressExpanded}
              style={({ pressed }) => [
                styles.progressToggle,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.progressToggleText}>
                {progressExpanded ? "Hide progress" : "Show progress"}
              </Text>
            </Pressable>
          </View>
          </View>
        ) : null}

        {celebration ? (
          <Pressable
            onPress={() => setCelebration("")}
            style={({ pressed }) => [
              styles.celebrationBanner,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.celebrationText}>{celebration}</Text>
          </Pressable>
        ) : null}

        {completionReward ? (
          <Pressable
            onPress={() => setCompletionReward(null)}
            style={({ pressed }) => [
              styles.completionPopup,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.completionPopupTop}>
              <Text style={styles.completionPopupEyebrow}>Completed</Text>
              <Text style={styles.completionPopupXp}>
                +{completionReward.xpEarned} XP
              </Text>
            </View>
            <Text style={styles.completionPopupTitle} numberOfLines={1}>
              {completionReward.habitName}
            </Text>
            <Text style={styles.completionPopupMeta}>
              {completionReward.streak} day streak • {completionReward.rank} •{" "}
              {completionReward.rankProgress}/100 XP
            </Text>
          </Pressable>
        ) : null}

        {badgeUnlock && !completionReward && !perfectDay && !levelUp && !themeUnlock ? (
          <Pressable
            onPress={() => setBadgeUnlock(null)}
            style={({ pressed }) => [
              styles.badgeUnlockPopup,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.badgeUnlockTop}>
              <Text style={styles.badgeUnlockEyebrow}>Badge unlocked</Text>
              <Text style={styles.badgeUnlockRarity}>
                {badgeUnlock.rarity}
              </Text>
            </View>
            <Text style={styles.badgeUnlockTitle}>{badgeUnlock.label}</Text>
            <Text style={styles.badgeUnlockDescription}>
              {badgeUnlock.description}
            </Text>
            <View style={styles.badgeUnlockFooter}>
              <Text style={styles.badgeUnlockTier}>{badgeUnlock.tier}</Text>
              <Text style={styles.badgeUnlockHint}>Tap to dismiss</Text>
            </View>
          </Pressable>
        ) : null}

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <View style={styles.listHeader}>
          <View style={styles.listHeaderText}>
            <View style={styles.listTitleRow}>
              <Text style={styles.listTitle}>Today's Habits</Text>
              <View style={styles.doneBadge}>
                <Text style={styles.doneBadgeText}>
                  {completedTodayCount}/{habits.length} done
                </Text>
              </View>
            </View>
            <Text style={styles.listSubtitle}>{habitsSectionMessage}</Text>
          </View>
          <Pressable
            accessibilityLabel="Add a new habit"
            hitSlop={8}
            onPress={() => router.push("/add")}
            style={({ pressed }) => [
              styles.inlineAddButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.inlineAddText}>Add</Text>
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
                <Text style={styles.loadingText}>Loading habits...</Text>
              </View>
            ) : (
              <EmptyState />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <HabitCard
                habit={item}
                enableLongPressReorder={preferences.enableLongPressReorder}
                enableSwipeToComplete={preferences.enableSwipeToComplete}
                onReorderPress={handleReorderPress}
                onToggleComplete={handleToggleComplete}
              />
            </View>
          )}
          initialNumToRender={8}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          maxToRenderPerBatch={8}
          showsVerticalScrollIndicator={false}
          windowSize={7}
        />
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(levelUp) && !completionReward && !perfectDay}
      >
        <View style={styles.levelModalBackdrop}>
          <View style={styles.levelModalCard}>
            <Text style={styles.rankIcon}>{getRankIcon(levelUp?.rank)}</Text>
            <Text style={styles.levelModalEyebrow}>Rank up</Text>
            <Text style={styles.levelModalTitle}>Level {levelUp?.level}</Text>
            <Text style={styles.levelModalRank}>{levelUp?.rank} Rank</Text>
            <Text style={styles.levelModalMessage}>
              Your consistency is turning into momentum.
            </Text>
            {levelUp?.themeUnlock ? (
              <Text style={styles.levelModalUnlock}>
                Theme unlocked: {levelUp.themeUnlock.label}
              </Text>
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
              onPress={() => setLevelUp(null)}
              style={({ pressed }) => [
                styles.levelModalButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.levelModalButtonText}>Keep Going</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(themeUnlock) && !completionReward && !perfectDay && !levelUp}
      >
        <View style={styles.levelModalBackdrop}>
          <View style={styles.levelModalCard}>
            <Text style={styles.levelModalEyebrow}>Theme unlocked</Text>
            <Text style={styles.levelModalTitle}>
              {getThemeUnlockLabel(themeUnlock)} Theme
            </Text>
            <ThemePreview achievement={themeUnlock} styles={styles} />
            <Text style={styles.levelModalMessage}>
              Preview your new rank theme and equip it instantly.
            </Text>
            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => setThemeUnlock(null)}
                style={({ pressed }) => [
                  styles.levelModalSecondaryButton,
                  styles.modalButtonFlex,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.levelModalSecondaryText}>Later</Text>
              </Pressable>
              <Pressable
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
                <Text style={styles.levelModalButtonText}>Equip</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(perfectDay) && !completionReward}
      >
        <View style={styles.levelModalBackdrop}>
          <View style={styles.levelModalCard}>
            <Text style={styles.rankIcon}>★</Text>
            <Text style={styles.levelModalEyebrow}>Perfect day</Text>
            <Text style={styles.levelModalTitle}>All habits complete</Text>
            <Text style={styles.levelModalMessage}>
              You cleared every habit today and earned the perfect day bonus.
            </Text>
            <Text style={styles.levelModalUnlock}>+25 bonus XP</Text>
            <Pressable
              onPress={() => setPerfectDay(null)}
              style={({ pressed }) => [
                styles.levelModalButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.levelModalButtonText}>Nice</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <BottomNav />
    </SafeAreaView>
  );
}

function shouldShowConfetti(messages, preferences) {
  const hasLevelUp = messages.some((message) => message.includes("Level up"));
  const hasMajorBadge = messages.some(
    (message) =>
      message.includes("7-Day Streak") ||
      message.includes("14-Day Streak") ||
      message.includes("30-Day Streak") ||
      message.includes("Perfect Day")
  );

  return (
    (preferences.showLevelUpPopup && hasLevelUp) ||
    (preferences.showBadgePopups && hasMajorBadge)
  );
}

function getTodayXp(habits) {
  const completedToday = habits.filter(wasCompletedToday).length;
  const hasPerfectDay =
    habits.length > 0 && habits.every((habit) => wasCompletedToday(habit));

  return completedToday * 10 + (hasPerfectDay ? 25 : 0);
}

function getProgressMessage(percentage, habitCount) {
  if (habitCount === 0) {
    return "Add one habit to start today with momentum.";
  }

  if (percentage === 100) {
    return "Perfect day. You cleared every habit.";
  }

  if (percentage >= 70) {
    return "Strong progress. Keep the streak alive.";
  }

  if (percentage >= 35) {
    return "You are moving. One more check-in helps.";
  }

  return "Start small. Complete the easiest habit first.";
}

function getTodayHabitsMessage(percentage) {
  if (percentage === 0) {
    return "Start strong today.";
  }

  if (percentage < 50) {
    return "Keep building momentum.";
  }

  if (percentage < 100) {
    return "Almost there.";
  }

  return "Perfect day complete.";
}

function getQueuedRewardsFromMessages(messages, gamification, preferences) {
  const levelInfo = getGamificationLevelInfo(gamification);
  const levelMessage = messages.find((message) => message.type === "level");
  const themeMessage = messages.find((message) => message.type === "theme");
  const perfectDayMessage = messages.find(
    (message) => message.type === "perfect-day"
  );
  const badgeMessage = messages.find((message) => message.type === "badge");
  const textMessages = messages.filter((message) => message.type === "message");
  const queuedLevel = levelMessage?.level || levelInfo.level;

  return {
    badgeUnlock:
      preferences.showBadgePopups && badgeMessage?.badgeId
        ? getBadgeById(badgeMessage.badgeId)
        : null,
    celebration: textMessages.map((message) => message.text).join(" "),
    levelUp:
      preferences.showLevelUpPopup && levelMessage
        ? {
            level: queuedLevel,
            progress: (levelInfo.currentLevelXp / 100) * 100,
            rank: getRankForLevel(queuedLevel),
            themeUnlock: getThemeUnlockForLevel(queuedLevel),
          }
        : null,
    perfectDay:
      preferences.showBadgePopups && perfectDayMessage
        ? {
            description: perfectDayMessage.text,
            title: "Perfect Day",
            type: "perfect-day",
          }
        : null,
    themeUnlock:
      preferences.showLevelUpPopup && themeMessage
        ? {
            themeKey: themeMessage.themeKey,
            title: `${getThemeUnlockLabel(themeMessage)} Theme`,
            type: "theme",
          }
        : null,
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

function getThemeUnlockForLevel(level) {
  return rankThemes.find((theme) => theme.unlockLevel === level);
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
      <Text style={[styles.themeUnlockName, { color: previewColors.text }]}>
        {getThemeUnlockLabel(achievement)}
      </Text>
      <Text style={[styles.themeUnlockMeta, { color: previewColors.muted }]}>
        Newly unlocked rank theme
      </Text>
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
    maxWidth: isTablet ? layout.formMaxWidth : "100%",
    paddingHorizontal: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
    overflow: "hidden",
    width: "100%",
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    gap: 10,
    marginBottom: 10,
    marginTop: 8,
    padding: isSmallScreen ? 14 : spacing.lg,
    width: "100%",
  },
  summaryTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    marginBottom: 5,
  },
  summaryValue: {
    color: colors.text,
    fontSize: isSmallScreen ? 18 : 21,
    fontWeight: fontWeight.bold,
  },
  percentBadge: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 22,
    justifyContent: "center",
    minHeight: 46,
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  percentText: {
    color: colors.primary,
    fontSize: fontSize.section,
    fontWeight: fontWeight.bold,
  },
  compactSummary: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  compactSummaryText: {
    color: colors.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
  progressDetails: {
    gap: spacing.md,
  },
  progressTrack: {
    backgroundColor: colors.inputBackground,
    borderRadius: 999,
    height: 12,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: "100%",
  },
  motivationText: {
    color: colors.muted,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.bodyLarge,
  },
  summaryStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryStat: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.lg,
    flexBasis: isSmallScreen ? "100%" : "30%",
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  summaryStatValue: {
    color: colors.text,
    fontSize: fontSize.section,
    fontWeight: fontWeight.bold,
  },
  summaryStatLabel: {
    color: colors.muted,
    fontSize: fontSize.tiny,
    fontWeight: fontWeight.bold,
    marginTop: 3,
    textTransform: "uppercase",
  },
  summaryFooter: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  progressToggle: {
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.round,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  progressToggleText: {
    color: colors.primary,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
  celebrationBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  celebrationText: {
    color: colors.text,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
    lineHeight: 18,
  },
  completionPopup: {
    backgroundColor: colors.card,
    borderColor: colors.accent,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  completionPopupTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  completionPopupEyebrow: {
    color: colors.accent,
    fontSize: fontSize.tiny,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  completionPopupXp: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  completionPopupTitle: {
    color: colors.text,
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.bold,
  },
  completionPopupMeta: {
    color: colors.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
    marginTop: 5,
  },
  badgeUnlockPopup: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.accent,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    gap: 7,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 7,
  },
  badgeUnlockTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badgeUnlockEyebrow: {
    color: colors.heroMuted,
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  badgeUnlockRarity: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  badgeUnlockTitle: {
    color: colors.inverseText,
    fontSize: 18,
    fontWeight: fontWeight.bold,
  },
  badgeUnlockDescription: {
    color: colors.heroSoftText,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },
  badgeUnlockFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  badgeUnlockTier: {
    color: colors.inverseText,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  badgeUnlockHint: {
    color: colors.heroMuted,
    fontSize: 11,
    fontWeight: fontWeight.medium,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    color: colors.danger,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingTop: 4,
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
    fontSize: fontSize.section,
    fontWeight: fontWeight.bold,
  },
  listSubtitle: {
    color: colors.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
    marginTop: 5,
  },
  doneBadge: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  doneBadgeText: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  inlineAddButton: {
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 64,
    paddingHorizontal: 14,
  },
  inlineAddText: {
    color: colors.primary,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
  loadingState: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 10,
    marginTop: 24,
    padding: 28,
  },
  loadingText: {
    color: colors.muted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 26,
    borderWidth: 1,
    maxWidth: 360,
    alignItems: "stretch",
    padding: 22,
    width: "100%",
  },
  rankIcon: {
    color: colors.accent,
    fontSize: 56,
    fontWeight: fontWeight.bold,
    marginBottom: 8,
    textAlign: "center",
  },
  levelModalEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: fontWeight.bold,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  levelModalTitle: {
    color: colors.text,
    fontSize: 34,
    fontWeight: fontWeight.bold,
  },
  levelModalRank: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: fontWeight.bold,
    marginTop: 4,
  },
  levelModalMessage: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: fontWeight.medium,
    lineHeight: 21,
    marginTop: 12,
  },
  levelModalUnlock: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    color: colors.primary,
    fontSize: 14,
    fontWeight: fontWeight.bold,
    marginTop: 14,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "center",
  },
  levelModalTrack: {
    backgroundColor: colors.inputBackground,
    borderRadius: 999,
    height: 10,
    marginTop: 18,
    overflow: "hidden",
  },
  levelModalFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%",
  },
  levelModalButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: "center",
    marginTop: 20,
    minHeight: 50,
  },
  levelModalButtonText: {
    color: colors.inverseText,
    fontSize: 15,
    fontWeight: fontWeight.bold,
  },
  levelModalSecondaryButton: {
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 20,
    minHeight: 50,
  },
  levelModalSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: fontWeight.bold,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalButtonFlex: {
    flex: 1,
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
    borderRadius: 18,
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
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  themeUnlockName: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
  },
  themeUnlockMeta: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    marginTop: 4,
  },
  });
}
