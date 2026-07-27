import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  BadgeMedal,
  GamificationHeader,
  GamificationScreen,
  getBadgeTierAccent,
  LevelProgress,
  RankMedal,
} from "../components/progression";
import { AppIcon, AppText } from "../components/ui";
import {
  v2FontWeight,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import {
  badges,
  getGamification,
  getGamificationLevelInfo,
  getRankForLevel,
  rankMilestones,
} from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import { sortBadgesByTier } from "../utils/gamification";
import { getBestStreak, getCurrentStreak } from "../utils/habitStats";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RankScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const [gamification, setGamification] = useState(null);
  const [habits, setHabits] = useState([]);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [badgeSortDirection, setBadgeSortDirection] = useState("asc");
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
    () => rankMilestones.find((rankItem) => rankItem.unlockLevel > levelInfo.level),
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
  const sortedBadges = useMemo(
    () => sortBadgesByTier(badges, badgeSortDirection),
    [badgeSortDirection]
  );
  const badgePreview = showAllBadges ? sortedBadges : sortedBadges.slice(0, 8);
  const progressionSnapshot = useMemo(
    () => getProgressionSnapshot({ gamification, habits, level: levelInfo.level }),
    [gamification, habits, levelInfo.level]
  );

  function toggleBadges() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllBadges((value) => !value);
  }

  return (
    <GamificationScreen
      overlay={
        <>
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
            colors={colors}
            onClose={() => setSelectedAchievement(null)}
            styles={styles}
            visible={Boolean(selectedAchievement)}
          />
        </>
      }
    >
        <GamificationHeader
          subtitle="Long-term progression through consistency."
          title="Rank"
        />

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <AppText style={styles.loadingText}>Loading progression...</AppText>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <RankMedal rank={rank} size="large" />
              <AppText style={styles.rankLabel}>Current rank</AppText>
              <AppText style={styles.rankTitle}>{rank}</AppText>
              <LevelProgress levelInfo={levelInfo} rank={rank} />
              <AppText style={styles.rankContext}>
                {nextRank
                  ? `${nextRank.label} unlocks at level ${nextRank.unlockLevel}.`
                  : "Maximum rank reached."}
              </AppText>
            </View>

            <Section title="Rank path" styles={styles}>
              <RankPath currentLevel={levelInfo.level} styles={styles} />
            </Section>

            <Section title="Rank medals" styles={styles}>
              <View style={styles.medalGrid}>
                {rankMilestones.map((rankItem) => (
                  <RankReward
                    key={rankItem.key}
                    locked={levelInfo.level < rankItem.unlockLevel}
                    styles={styles}
                    rankItem={rankItem}
                  />
                ))}
              </View>
            </Section>

            <Section
              subtitle={`${earnedBadges.length} of ${badges.length} earned`}
              title="Badges"
              styles={styles}
            >
              <View style={styles.badgeControls}>
                {["asc", "desc"].map((direction) => {
                  const selected = badgeSortDirection === direction;
                  const label =
                    direction === "asc"
                      ? "Sort badges Bronze to Master"
                      : "Sort badges Master to Bronze";

                  return (
                    <Pressable
                      accessibilityLabel={label}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={direction}
                      onPress={() => setBadgeSortDirection(direction)}
                      style={({ pressed }) => [
                        styles.sortButton,
                        selected && styles.sortButtonSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppIcon
                        color={selected ? colors.text : colors.muted}
                        name={direction === "asc" ? "sort-asc" : "sort-desc"}
                        size={20}
                        strokeWidth={2}
                      />
                      <AppText
                        style={[
                          styles.sortButtonText,
                          selected && styles.sortButtonTextSelected,
                        ]}
                      >
                        {direction === "asc" ? "Bronze first" : "Master first"}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
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
                  <AppText style={styles.showButtonText}>
                    {showAllBadges ? "Show fewer badges" : "Show all badges"}
                  </AppText>
                </Pressable>
              ) : null}
            </Section>

            <Section title="Recent achievements" styles={styles}>
              {gamification?.recentAchievements?.length > 0 ? (
                gamification.recentAchievements.slice(0, 8).map((achievement) => (
                  <AchievementRow
                    achievement={achievement}
                    colors={colors}
                    key={achievement.id}
                    onPress={() => setSelectedAchievement(achievement)}
                    styles={styles}
                  />
                ))
              ) : (
                <AppText style={styles.emptyText}>
                  Achievements appear here after badges, levels, perfect days,
                  or rank milestones.
                </AppText>
              )}
            </Section>
          </>
        )}

    </GamificationScreen>
  );
}

function Section({ children, styles, subtitle, title }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>{title}</AppText>
        {subtitle ? <AppText style={styles.sectionSubtitle}>{subtitle}</AppText> : null}
      </View>
      {children}
    </View>
  );
}

function RankPath({ currentLevel, styles }) {
  return (
    <View style={styles.rankPath}>
      {rankMilestones.map((theme) => {
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
              <AppText style={styles.rankStepName}>{theme.label}</AppText>
              <AppText style={styles.rankStepMeta}>Level {theme.unlockLevel}</AppText>
            </View>
            <AppText style={styles.rankStepState}>
              {current ? "Current" : unlocked ? "Unlocked" : "Locked"}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function RankReward({ locked, rankItem, styles }) {
  return (
    <View
      accessibilityLabel={`${rankItem.label} medal, ${locked ? `locked until level ${rankItem.unlockLevel}` : "unlocked"}`}
      accessible
      style={[styles.medalReward, locked && styles.medalRewardLocked]}
    >
      <RankMedal rank={rankItem.label} size="small" />
      <AppText style={styles.medalName}>{rankItem.label}</AppText>
      <AppText style={styles.medalMeta}>
        {locked ? `Unlocks at level ${rankItem.unlockLevel}` : "Unlocked"}
      </AppText>
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
          <AppText numberOfLines={2} style={styles.badgeName}>
            {badge.label}
          </AppText>
          <AppText style={[styles.rarityPill, { borderColor: accent }]}>
            {badge.rarity}
          </AppText>
        </View>
        <AppText numberOfLines={2} style={styles.badgeMeta}>
          {earned ? badge.tier : getProgressLabel(progress)}
        </AppText>
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

function AchievementRow({ achievement, colors, onPress, styles }) {
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
        <AppIcon
          color={colors.text}
          name={getAchievementIconName(achievement.type)}
          size={22}
          strokeWidth={2}
        />
      </View>
      <View style={styles.achievementText}>
        <AppText numberOfLines={2} style={styles.achievementTitle}>
          {achievement.title}
        </AppText>
        <AppText numberOfLines={2} style={styles.achievementDescription}>
          {achievement.description}
        </AppText>
      </View>
      <AppText style={styles.achievementDate}>
        {formatAchievementDate(achievement.unlockedAt)}
      </AppText>
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
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <BadgeMedal badge={badge} earned={earned} large />
            <AppText style={styles.modalEyebrow}>
              {earned ? "Badge earned" : "Locked badge"}
            </AppText>
            <AppText style={styles.modalTitle}>{badge.label}</AppText>
            <AppText style={styles.modalDescription}>{badge.description}</AppText>
            <View style={styles.modalMetaRow}>
              <AppText style={styles.modalMeta}>{badge.tier}</AppText>
              <AppText style={styles.modalMeta}>{badge.rarity}</AppText>
            </View>
            {!earned ? (
              <View style={styles.requirementBox}>
                <AppText style={styles.requirementLabel}>Requirement</AppText>
                <AppText style={styles.requirementText}>{badge.description}</AppText>
                {progress?.max ? (
                  <AppText style={styles.requirementText}>
                    Progress: {progress.value} / {progress.max}
                  </AppText>
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
              <AppText style={styles.modalButtonText}>Close</AppText>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AchievementDetailModal({ achievement, colors, onClose, styles, visible }) {
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
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.achievementModalMark}>
              <AppIcon
                color={colors.text}
                name={getAchievementIconName(achievement.type)}
                size={28}
                strokeWidth={2.2}
              />
            </View>
            <AppText style={styles.modalEyebrow}>Recent achievement</AppText>
            <AppText style={styles.modalTitle}>{achievement.title}</AppText>
            <AppText style={styles.modalDescription}>{achievement.description}</AppText>
            <View style={styles.modalMetaRow}>
              <AppText style={styles.modalMeta}>
                {formatAchievementType(achievement.type)}
              </AppText>
              <AppText style={styles.modalMeta}>
                {formatAchievementDate(achievement.unlockedAt)}
              </AppText>
            </View>
            {achievement.habitName ? (
              <AppText style={styles.requirementText}>Habit: {achievement.habitName}</AppText>
            ) : null}
            {achievement.xp ? (
              <AppText style={styles.requirementText}>Reward: +{achievement.xp} XP</AppText>
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
              <AppText style={styles.modalButtonText}>Close</AppText>
            </Pressable>
          </ScrollView>
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
        getCurrentStreak(habit.completedDates, habit),
        getBestStreak(habit.completedDates, habit)
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

function getAchievementIconName(type) {
  if (type === "badge") {
    return "trophy";
  }

  if (type === "perfect-day") {
    return "star";
  }

  if (type === "theme") {
    return "rank";
  }

  if (type === "level") {
    return "progress";
  }

  return "analytics";
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

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    loadingCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      gap: 10,
      padding: 28,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
    },
    loadingText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    hero: {
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
      paddingVertical: v2Spacing.xl,
    },
    rankLabel: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    rankTitle: {
      color: colors.text,
      fontSize: isSmallScreen ? 42 : 52,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 48 : 58,
    },
    rankContext: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
    },
    section: {
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
    },
    sectionHeader: {
      gap: 3,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    sectionSubtitle: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    rankPath: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      paddingHorizontal: v2Spacing.lg,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
    },
    rankStep: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 58,
    },
    rankStepCurrent: {
      backgroundColor: colors.surface,
    },
    rankStepMarker: {
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
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
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    rankStepMeta: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
    rankStepState: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    medalGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.md,
    },
    medalReward: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      minHeight: 94,
      padding: v2Spacing.lg,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
    },
    medalRewardLocked: {
      opacity: 0.58,
    },
    medalName: {
      color: colors.text,
      fontSize: v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.md,
      textAlign: "center",
    },
    medalMeta: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 4,
      textAlign: "center",
    },
    badgeProgressTrack: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      height: 7,
      overflow: "hidden",
    },
    badgeProgressFill: {
      backgroundColor: colors.text,
      borderRadius: v2Radius.pill,
      height: "100%",
    },
    badgeControls: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    sortButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      flexGrow: 1,
      gap: v2Spacing.sm,
      justifyContent: "center",
      minHeight: 46,
      minWidth: isSmallScreen ? "100%" : 0,
      paddingHorizontal: v2Spacing.md,
    },
    sortButtonSelected: {
      backgroundColor: colors.surface,
      borderColor: colors.text,
    },
    sortButtonText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    sortButtonTextSelected: {
      color: colors.text,
    },
    badgeGrid: {
      gap: v2Spacing.md,
    },
    badgeTile: {
      alignItems: isSmallScreen ? "flex-start" : "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: isSmallScreen ? "column" : "row",
      gap: isSmallScreen ? v2Spacing.md : v2Spacing.lg,
      minHeight: isSmallScreen ? 0 : 110,
      padding: isSmallScreen ? v2Spacing.md : v2Spacing.lg,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
    },
    badgeText: {
      flex: 1,
      gap: v2Spacing.sm,
      minWidth: 0,
    },
    badgeTopLine: {
      alignItems: "flex-start",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      justifyContent: "space-between",
      width: "100%",
    },
    badgeName: {
      color: colors.text,
      flex: 1,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
    },
    badgeMeta: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    rarityPill: {
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.muted,
      flexShrink: 0,
      fontSize: v2Typography.navigationLabel.fontSize,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: 8,
      paddingVertical: 3,
      textTransform: "uppercase",
    },
    badgeMiniTrack: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      height: 5,
      overflow: "hidden",
    },
    badgeMiniFill: {
      backgroundColor: colors.text,
      borderRadius: v2Radius.pill,
      height: "100%",
    },
    showButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 48,
    },
    showButtonText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    achievementRow: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 78,
      padding: v2Spacing.lg,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
    },
    achievementMark: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    achievementText: {
      flex: 1,
      minWidth: 0,
    },
    achievementTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    achievementDescription: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: 3,
    },
    achievementDate: {
      color: colors.muted,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: 82,
      textAlign: "right",
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
      borderRadius: v2Radius.large,
      borderWidth: 1,
      maxHeight: "82%",
      maxWidth: 390,
      padding: isSmallScreen ? v2Spacing.lg : v2Spacing.xl,
      ...v2Shadows.floating,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      width: "100%",
    },
    modalScrollContent: {
      alignItems: "center",
      width: "100%",
    },
    modalEyebrow: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.lg,
    },
    modalTitle: {
      color: colors.text,
      fontSize: isSmallScreen
        ? v2Typography.sectionTitle.fontSize
        : 24,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? v2Typography.sectionTitle.lineHeight : 30,
      marginTop: v2Spacing.sm,
      textAlign: "center",
    },
    modalDescription: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
      textAlign: "center",
    },
    modalMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginTop: v2Spacing.lg,
    },
    modalMeta: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.text,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    requirementBox: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      marginTop: v2Spacing.lg,
      padding: v2Spacing.lg,
      width: "100%",
    },
    requirementLabel: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
    },
    requirementText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
      textAlign: "center",
    },
    achievementModalMark: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      height: 74,
      justifyContent: "center",
      width: 74,
    },
    modalButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.medium,
      justifyContent: "center",
      marginTop: v2Spacing.xl,
      minHeight: 48,
      width: "100%",
    },
    modalButtonText: {
      color: colors.inverseText,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    emptyText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
    },
    pressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
  });
}
