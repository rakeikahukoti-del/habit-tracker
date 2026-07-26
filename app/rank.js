import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import BottomNav from "../components/BottomNav";
import { BadgeMedal, getBadgeTierAccent, LevelProgress } from "../components/progression";
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
  badges,
  getGamification,
  getGamificationLevelInfo,
  getRankForLevel,
  rankThemes,
} from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import { getBestStreak, getCurrentStreak } from "../utils/habitStats";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RankScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen, isTablet }),
    [colors, isSmallScreen, isTablet]
  );
  const [gamification, setGamification] = useState(null);
  const [habits, setHabits] = useState([]);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadRank() {
        try {
          const [storedGamification, storedHabits] = await Promise.all([
            getGamification(),
            getHabits(),
          ]);

          if (!isActive) {
            return;
          }

          setGamification(storedGamification);
          setHabits(storedHabits);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadRank();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const levelInfo = useMemo(
    () => getGamificationLevelInfo(gamification),
    [gamification]
  );
  const rank = useMemo(
    () => getRankForLevel(levelInfo.level),
    [levelInfo.level]
  );
  const nextRank = useMemo(
    () => rankThemes.find((theme) => theme.unlockLevel > levelInfo.level),
    [levelInfo.level]
  );
  const earnedBadgeIds = useMemo(
    () => new Set(gamification?.earnedBadges || []),
    [gamification]
  );
  const earnedBadges = useMemo(
    () => badges.filter((badge) => earnedBadgeIds.has(badge.id)),
    [earnedBadgeIds]
  );
  const badgePreview = showAllBadges ? badges : badges.slice(0, 8);
  const progressionSnapshot = useMemo(
    () => getProgressionSnapshot({ gamification, habits, level: levelInfo.level }),
    [gamification, habits, levelInfo.level]
  );

  function toggleBadges() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllBadges((value) => !value);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Rank</Text>
          <Text style={styles.subtitle}>
            Long-term progression through consistency.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading progression...</Text>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.rankEmblem}>
                <Text style={styles.rankEmblemText}>{getRankInitial(rank)}</Text>
              </View>
              <Text style={styles.rankLabel}>Current rank</Text>
              <Text style={styles.rankTitle}>{rank}</Text>
              <LevelProgress levelInfo={levelInfo} rank={rank} />
              <Text style={styles.rankContext}>
                {nextRank
                  ? `${nextRank.label} unlocks at level ${nextRank.unlockLevel}.`
                  : "Maximum rank reached."}
              </Text>
            </View>

            <Section title="Rank path" styles={styles}>
              <RankPath currentLevel={levelInfo.level} styles={styles} />
            </Section>

            <Section title="Rank rewards" styles={styles}>
              <View style={styles.themeGrid}>
                {rankThemes.map((theme) => (
                  <ThemeReward
                    key={theme.key}
                    locked={levelInfo.level < theme.unlockLevel}
                    styles={styles}
                    theme={theme}
                  />
                ))}
              </View>
            </Section>

            <Section
              subtitle={`${earnedBadges.length} of ${badges.length} earned`}
              title="Badges"
              styles={styles}
            >
              <View style={styles.badgeProgressTrack}>
                <View
                  style={[
                    styles.badgeProgressFill,
                    { width: `${(earnedBadges.length / badges.length) * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.badgeGrid}>
                {badgePreview.map((badge) => {
                  const earned = earnedBadgeIds.has(badge.id);
                  const progress = getBadgeProgress(badge, progressionSnapshot);

                  return (
                    <BadgeTile
                      badge={badge}
                      earned={earned}
                      key={badge.id}
                      onPress={() =>
                        setSelectedBadge({ badge, earned, progress })
                      }
                      progress={progress}
                      styles={styles}
                    />
                  );
                })}
              </View>
              {badges.length > 8 ? (
                <Pressable
                  accessibilityLabel={
                    showAllBadges ? "Show fewer badges" : "Show all badges"
                  }
                  accessibilityRole="button"
                  onPress={toggleBadges}
                  style={({ pressed }) => [
                    styles.showButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.showButtonText}>
                    {showAllBadges ? "Show fewer badges" : "Show all badges"}
                  </Text>
                </Pressable>
              ) : null}
            </Section>

            <Section title="Recent achievements" styles={styles}>
              {gamification?.recentAchievements?.length > 0 ? (
                gamification.recentAchievements.slice(0, 8).map((achievement) => (
                  <AchievementRow
                    achievement={achievement}
                    key={achievement.id}
                    onPress={() => setSelectedAchievement(achievement)}
                    styles={styles}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>
                  Achievements appear here after badges, levels, perfect days,
                  or theme unlocks.
                </Text>
              )}
            </Section>
          </>
        )}
      </ScrollView>

      <BadgeDetailModal
        badge={selectedBadge?.badge}
        earned={selectedBadge?.earned}
        onClose={() => setSelectedBadge(null)}
        progress={selectedBadge?.progress}
        styles={styles}
        visible={Boolean(selectedBadge)}
      />
      <AchievementDetailModal
        achievement={selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
        styles={styles}
        visible={Boolean(selectedAchievement)}
      />
      <BottomNav />
    </SafeAreaView>
  );
}

function Section({ children, styles, subtitle, title }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function RankPath({ currentLevel, styles }) {
  return (
    <View style={styles.rankPath}>
      {rankThemes.map((theme) => {
        const unlocked = currentLevel >= theme.unlockLevel;
        const current = getRankForLevel(currentLevel) === theme.label;

        return (
          <View
            accessibilityLabel={`${theme.label} rank, unlocks at level ${theme.unlockLevel}, ${unlocked ? "unlocked" : "locked"}`}
            accessible
            key={theme.key}
            style={[
              styles.rankStep,
              current && styles.rankStepCurrent,
            ]}
          >
            <View
              style={[
                styles.rankStepMarker,
                unlocked && styles.rankStepMarkerUnlocked,
                current && styles.rankStepMarkerCurrent,
              ]}
            />
            <View style={styles.rankStepText}>
              <Text style={styles.rankStepName}>{theme.label}</Text>
              <Text style={styles.rankStepMeta}>Level {theme.unlockLevel}</Text>
            </View>
            <Text style={styles.rankStepState}>
              {current ? "Current" : unlocked ? "Unlocked" : "Locked"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ThemeReward({ locked, styles, theme }) {
  const previewColors = themes[theme.key] || themes.dark;

  return (
    <View
      accessibilityLabel={`${theme.label} theme, ${locked ? `locked until level ${theme.unlockLevel}` : "unlocked"}`}
      accessible
      style={[styles.themeReward, locked && styles.themeRewardLocked]}
    >
      <View style={styles.themeSwatches}>
        <View
          style={[styles.themeSwatch, { backgroundColor: previewColors.background }]}
        />
        <View
          style={[styles.themeSwatch, { backgroundColor: previewColors.card }]}
        />
        <View
          style={[styles.themeSwatch, { backgroundColor: previewColors.primary }]}
        />
      </View>
      <Text style={styles.themeName}>{theme.label}</Text>
      <Text style={styles.themeMeta}>
        {locked ? `Unlocks at level ${theme.unlockLevel}` : "Unlocked"}
      </Text>
    </View>
  );
}

function BadgeTile({ badge, earned, onPress, progress, styles }) {
  const accent = getBadgeTierAccent(badge.tier);

  return (
    <Pressable
      accessibilityLabel={`View ${badge.label} badge details, ${earned ? "earned" : "locked"}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.badgeTile,
        earned && { borderColor: accent },
        pressed && styles.pressed,
      ]}
    >
      <BadgeMedal badge={badge} earned={earned} />
      <View style={styles.badgeText}>
        <View style={styles.badgeTopLine}>
          <Text numberOfLines={2} style={styles.badgeName}>
            {badge.label}
          </Text>
          <Text style={[styles.rarityPill, { borderColor: accent }]}>
            {badge.rarity}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.badgeMeta}>
          {earned ? badge.tier : getProgressLabel(progress)}
        </Text>
        {!earned && progress?.max ? (
          <View style={styles.badgeMiniTrack}>
            <View
              style={[
                styles.badgeMiniFill,
                { width: `${Math.min(100, (progress.value / progress.max) * 100)}%` },
              ]}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function AchievementRow({ achievement, onPress, styles }) {
  return (
    <Pressable
      accessibilityLabel={`View ${achievement.title} achievement details`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.achievementRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.achievementMark}>
        <Text style={styles.achievementMarkText}>
          {getAchievementMark(achievement.type)}
        </Text>
      </View>
      <View style={styles.achievementText}>
        <Text numberOfLines={1} style={styles.achievementTitle}>
          {achievement.title}
        </Text>
        <Text numberOfLines={2} style={styles.achievementDescription}>
          {achievement.description}
        </Text>
      </View>
      <Text style={styles.achievementDate}>
        {formatAchievementDate(achievement.unlockedAt)}
      </Text>
    </Pressable>
  );
}

function BadgeDetailModal({ badge, earned, onClose, progress, styles, visible }) {
  if (!badge) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={onClose}
      visible={visible}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <BadgeMedal badge={badge} earned={earned} large />
          <Text style={styles.modalEyebrow}>
            {earned ? "Badge earned" : "Locked badge"}
          </Text>
          <Text style={styles.modalTitle}>{badge.label}</Text>
          <Text style={styles.modalDescription}>{badge.description}</Text>
          <View style={styles.modalMetaRow}>
            <Text style={styles.modalMeta}>{badge.tier}</Text>
            <Text style={styles.modalMeta}>{badge.rarity}</Text>
          </View>
          {!earned ? (
            <View style={styles.requirementBox}>
              <Text style={styles.requirementLabel}>Requirement</Text>
              <Text style={styles.requirementText}>{badge.description}</Text>
              {progress?.max ? (
                <Text style={styles.requirementText}>
                  Progress: {progress.value} / {progress.max}
                </Text>
              ) : null}
            </View>
          ) : null}
          <Pressable
            accessibilityLabel="Close badge details"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.modalButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AchievementDetailModal({ achievement, onClose, styles, visible }) {
  if (!achievement) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={onClose}
      visible={visible}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.achievementModalMark}>
            <Text style={styles.achievementModalMarkText}>
              {getAchievementMark(achievement.type)}
            </Text>
          </View>
          <Text style={styles.modalEyebrow}>Recent achievement</Text>
          <Text style={styles.modalTitle}>{achievement.title}</Text>
          <Text style={styles.modalDescription}>{achievement.description}</Text>
          <View style={styles.modalMetaRow}>
            <Text style={styles.modalMeta}>
              {formatAchievementType(achievement.type)}
            </Text>
            <Text style={styles.modalMeta}>
              {formatAchievementDate(achievement.unlockedAt)}
            </Text>
          </View>
          {achievement.habitName ? (
            <Text style={styles.requirementText}>Habit: {achievement.habitName}</Text>
          ) : null}
          {achievement.xp ? (
            <Text style={styles.requirementText}>Reward: +{achievement.xp} XP</Text>
          ) : null}
          <Pressable
            accessibilityLabel="Close achievement details"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.modalButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getProgressionSnapshot({ gamification, habits, level }) {
  const completionCount = habits.reduce(
    (count, habit) => count + (habit.completedDates || []).length,
    0
  );
  const longestStreak = habits.reduce(
    (longest, habit) =>
      Math.max(
        longest,
        getCurrentStreak(habit.completedDates),
        getBestStreak(habit.completedDates)
      ),
    0
  );
  const highestDailyCompletionCount = getHighestDailyCompletionCount(habits);

  return {
    completionCount,
    hasCompletion: completionCount > 0,
    hasHabit: habits.length > 0,
    highestDailyCompletionCount,
    level,
    longestStreak,
    perfectDays: gamification?.perfectDayBonusDates?.length || 0,
  };
}

function getBadgeProgress(badge, snapshot) {
  const thresholds = {
    "three-day-streak": ["longestStreak", 3],
    "seven-day-streak": ["longestStreak", 7],
    "fourteen-day-streak": ["longestStreak", 14],
    "thirty-day-streak": ["longestStreak", 30],
    "sixty-day-streak": ["longestStreak", 60],
    "one-hundred-day-streak": ["longestStreak", 100],
    "three-habits-one-day": ["highestDailyCompletionCount", 3],
    "five-habits-one-day": ["highestDailyCompletionCount", 5],
    "ten-habits-one-day": ["highestDailyCompletionCount", 10],
    "ten-total-completions": ["completionCount", 10],
    "fifty-total-completions": ["completionCount", 50],
    "one-hundred-total-completions": ["completionCount", 100],
    "two-fifty-total-completions": ["completionCount", 250],
    "five-hundred-total-completions": ["completionCount", 500],
    "reach-level-five": ["level", 5],
    "reach-level-ten": ["level", 10],
    "reach-level-twenty-five": ["level", 25],
    "reach-level-forty": ["level", 40],
    "unlock-silver": ["level", 5],
    "unlock-gold": ["level", 10],
    "unlock-platinum": ["level", 15],
    "unlock-diamond": ["level", 25],
    "unlock-master": ["level", 40],
  };
  const mapped = thresholds[badge.id];

  if (badge.id === "first-habit-created") {
    return { max: 1, value: snapshot.hasHabit ? 1 : 0 };
  }

  if (badge.id === "first-completion") {
    return { max: 1, value: snapshot.hasCompletion ? 1 : 0 };
  }

  if (badge.id === "first-perfect-day") {
    return { max: 1, value: Math.min(1, snapshot.perfectDays) };
  }

  if (!mapped) {
    return null;
  }

  return {
    max: mapped[1],
    value: Math.min(snapshot[mapped[0]] || 0, mapped[1]),
  };
}

function getProgressLabel(progress) {
  if (!progress?.max) {
    return "Locked";
  }

  return `${progress.value} / ${progress.max}`;
}

function getHighestDailyCompletionCount(habits) {
  const counts = {};

  habits.forEach((habit) => {
    (habit.completedDates || []).forEach((dateKey) => {
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
  });

  return Math.max(0, ...Object.values(counts));
}

function getRankInitial(rank) {
  return rank === "Master" ? "M" : rank.slice(0, 1);
}

function getAchievementMark(type) {
  if (type === "badge") {
    return "B";
  }

  if (type === "perfect-day") {
    return "P";
  }

  if (type === "theme") {
    return "T";
  }

  if (type === "level") {
    return "L";
  }

  return "A";
}

function formatAchievementType(type) {
  return String(type || "milestone").replace("-", " ");
}

function formatAchievementDate(dateString) {
  if (!dateString) {
    return "Recent";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
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
      maxWidth: isTablet ? layout.maxContentWidth : "100%",
      padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
      paddingBottom: layout.screenBottomPadding + 88,
      width: "100%",
    },
    header: {
      paddingBottom: spacing.xl,
      paddingTop: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: fontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
    },
    subtitle: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
      marginTop: 4,
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: 10,
      padding: 28,
    },
    loadingText: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
    },
    hero: {
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: spacing.md,
      marginBottom: spacing.xl,
      paddingVertical: spacing.xl,
    },
    rankEmblem: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      height: 70,
      justifyContent: "center",
      transform: [{ rotate: "45deg" }],
      width: 70,
    },
    rankEmblemText: {
      color: colors.text,
      fontSize: 28,
      fontWeight: fontWeight.bold,
      transform: [{ rotate: "-45deg" }],
    },
    rankLabel: {
      color: colors.muted,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
    },
    rankTitle: {
      color: colors.text,
      fontSize: isSmallScreen ? 42 : 52,
      fontWeight: fontWeight.bold,
      lineHeight: isSmallScreen ? 48 : 58,
    },
    rankContext: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
    },
    section: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      gap: 3,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    sectionSubtitle: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
    },
    rankPath: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      paddingHorizontal: spacing.lg,
    },
    rankStep: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 58,
    },
    rankStepCurrent: {
      backgroundColor: colors.surface,
    },
    rankStepMarker: {
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 14,
      width: 14,
    },
    rankStepMarkerUnlocked: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    rankStepMarkerCurrent: {
      height: 18,
      width: 18,
    },
    rankStepText: {
      flex: 1,
      minWidth: 0,
    },
    rankStepName: {
      color: colors.text,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    rankStepMeta: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      marginTop: 2,
    },
    rankStepState: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
    },
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    themeReward: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      minHeight: 94,
      padding: spacing.lg,
    },
    themeRewardLocked: {
      opacity: 0.58,
    },
    themeSwatches: {
      flexDirection: "row",
      gap: 6,
      marginBottom: spacing.md,
    },
    themeSwatch: {
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 16,
      width: 16,
    },
    themeName: {
      color: colors.text,
      fontSize: fontSize.cardTitle,
      fontWeight: fontWeight.bold,
    },
    themeMeta: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      marginTop: 4,
    },
    badgeProgressTrack: {
      backgroundColor: colors.surface,
      borderRadius: 999,
      height: 7,
      overflow: "hidden",
    },
    badgeProgressFill: {
      backgroundColor: colors.text,
      borderRadius: 999,
      height: "100%",
    },
    badgeGrid: {
      gap: spacing.md,
    },
    badgeTile: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.lg,
      minHeight: 110,
      padding: spacing.lg,
    },
    badgeText: {
      flex: 1,
      gap: spacing.sm,
      minWidth: 0,
    },
    badgeTopLine: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
    },
    badgeName: {
      color: colors.text,
      flex: 1,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.bodyLarge,
    },
    badgeMeta: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
    },
    rarityPill: {
      borderRadius: 999,
      borderWidth: 1,
      color: colors.muted,
      fontSize: 9,
      fontWeight: fontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: 8,
      paddingVertical: 3,
      textTransform: "uppercase",
    },
    badgeMiniTrack: {
      backgroundColor: colors.surface,
      borderRadius: 999,
      height: 5,
      overflow: "hidden",
    },
    badgeMiniFill: {
      backgroundColor: colors.text,
      borderRadius: 999,
      height: "100%",
    },
    showButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 44,
    },
    showButtonText: {
      color: colors.text,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
    },
    achievementRow: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 78,
      padding: spacing.lg,
    },
    achievementMark: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    achievementMarkText: {
      color: colors.text,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
    },
    achievementText: {
      flex: 1,
      minWidth: 0,
    },
    achievementTitle: {
      color: colors.text,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    achievementDescription: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.caption,
      marginTop: 3,
    },
    achievementDate: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
    },
    modalBackdrop: {
      alignItems: "center",
      backgroundColor: colors.modalBackdrop,
      flex: 1,
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      maxWidth: 390,
      padding: spacing.xl,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 8,
      width: "100%",
    },
    modalEyebrow: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
      marginTop: spacing.lg,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: fontWeight.bold,
      marginTop: spacing.sm,
      textAlign: "center",
    },
    modalDescription: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
      marginTop: spacing.sm,
      textAlign: "center",
    },
    modalMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginTop: spacing.lg,
    },
    modalMeta: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      color: colors.text,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    requirementBox: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      marginTop: spacing.lg,
      padding: spacing.lg,
      width: "100%",
    },
    requirementLabel: {
      color: colors.text,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      marginBottom: 4,
    },
    requirementText: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
      marginTop: spacing.sm,
      textAlign: "center",
    },
    achievementModalMark: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      height: 74,
      justifyContent: "center",
      transform: [{ rotate: "45deg" }],
      width: 74,
    },
    achievementModalMarkText: {
      color: colors.text,
      fontSize: 24,
      fontWeight: fontWeight.bold,
      transform: [{ rotate: "-45deg" }],
    },
    modalButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      justifyContent: "center",
      marginTop: spacing.xl,
      minHeight: 48,
      width: "100%",
    },
    modalButtonText: {
      color: colors.inverseText,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    emptyText: {
      color: colors.muted,
      fontSize: fontSize.body,
      lineHeight: lineHeight.body,
    },
    pressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
  });
}
