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
import {
  getAchievementProgress,
  getAchievementProgressLabel,
  getAchievementSnapshot,
  getAchievementSummary,
  getAchievementUnlockDate,
  getClosestAchievements,
} from "../utils/achievementProgress";
import { sortBadgesByTier } from "../utils/gamification";
import { getNextRankMilestone } from "../utils/progressionMilestones";
import {
  getNextVisibleRankMilestone,
  getVisibleRank,
  getVisibleRankMilestones,
} from "../utils/rankDisplay";
import {
  getAchievementIconMeta,
  getRecentAchievementIconName,
} from "../constants/achievements";

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
  const calculatedRank = useMemo(
    () => getRankForLevel(levelInfo.level),
    [levelInfo.level]
  );
  const rank = useMemo(() => getVisibleRank(calculatedRank), [calculatedRank]);
  const visibleRankMilestones = useMemo(
    () => getVisibleRankMilestones(rankMilestones),
    []
  );
  const nextRank = useMemo(
    () => getNextVisibleRankMilestone(levelInfo, rankMilestones),
    [levelInfo]
  );
  const nextMilestone = useMemo(
    () => getNextRankMilestone(levelInfo, rankMilestones),
    [levelInfo]
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
    () => getAchievementSnapshot({ gamification, habits, level: levelInfo.level }),
    [gamification, habits, levelInfo.level]
  );
  const achievementSummary = useMemo(
    () =>
      getAchievementSummary({
        badges,
        earnedBadgeIds,
        recentAchievements: gamification?.recentAchievements,
        snapshot: progressionSnapshot,
      }),
    [earnedBadgeIds, gamification, progressionSnapshot]
  );
  const closestBadges = useMemo(
    () =>
      getClosestAchievements({
        badges,
        earnedBadgeIds,
        limit: 3,
        snapshot: progressionSnapshot,
      }),
    [earnedBadgeIds, progressionSnapshot]
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
            unlockedAt={selectedBadge?.unlockedAt}
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

            {nextMilestone ? (
              <View
                accessibilityLabel={
                  nextMilestone.type === "complete"
                    ? `${nextMilestone.label} rank complete. Maximum rank reached.`
                    : `Next milestone. ${nextMilestone.label} unlocks at level ${nextMilestone.level}. ${nextMilestone.xpRemaining} XP remaining.`
                }
                accessible
                style={styles.nextMilestone}
              >
                <View style={styles.nextMilestoneIcon}>
                  <AppIcon
                    color={colors.primary}
                    name={nextMilestone.type === "complete" ? "check" : "trophy"}
                    size={22}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.nextMilestoneText}>
                  <AppText style={styles.nextMilestoneLabel}>
                    {nextMilestone.type === "complete"
                      ? "Rank path complete"
                      : "Next milestone"}
                  </AppText>
                  <AppText style={styles.nextMilestoneTitle}>
                    {nextMilestone.type === "complete"
                      ? "Master reached"
                      : nextMilestone.label}
                  </AppText>
                </View>
                <AppText style={styles.nextMilestoneMeta}>
                  {nextMilestone.type === "complete"
                    ? "Complete"
                    : `${formatCompactNumber(nextMilestone.xpRemaining)} XP`}
                </AppText>
              </View>
            ) : null}

            <Section title="Rank path" styles={styles}>
              <RankPath currentLevel={levelInfo.level} styles={styles} />
            </Section>

            <Section title="Rank medals" styles={styles}>
              <View style={styles.medalGrid}>
                {visibleRankMilestones.map((rankItem) => (
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
              subtitle={`${achievementSummary.earnedCount} of ${achievementSummary.totalCount} unlocked`}
              title="Achievements"
              styles={styles}
            >
              <AchievementSummary
                summary={achievementSummary}
                styles={styles}
              />
              {closestBadges.length > 0 ? (
                <View style={styles.closestBlock}>
                  <AppText style={styles.closestTitle}>Closest unlocks</AppText>
                  {closestBadges.map(({ badge, progress }) => (
                    <ClosestBadgeRow
                      badge={badge}
                      key={badge.id}
                      onPress={() =>
                        setSelectedBadge({
                          badge,
                          earned: false,
                          progress,
                          unlockedAt: null,
                        })
                      }
                      progress={progress}
                      styles={styles}
                    />
                  ))}
                </View>
              ) : null}
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
                  const progress = getAchievementProgress(
                    badge,
                    progressionSnapshot,
                    earned
                  );
                  const unlockedAt = getAchievementUnlockDate(
                    badge.id,
                    gamification?.recentAchievements
                  );

                  return (
                    <BadgeTile
                      badge={badge}
                      earned={earned}
                      key={badge.id}
                      onPress={() =>
                        setSelectedBadge({ badge, earned, progress, unlockedAt })
                      }
                      progress={progress}
                      styles={styles}
                      unlockedAt={unlockedAt}
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
      {getVisibleRankMilestones(rankMilestones).map((rankItem) => {
        const unlocked = currentLevel >= rankItem.unlockLevel;
        const current = getVisibleRank(getRankForLevel(currentLevel)) === rankItem.label;

        return (
          <View
            accessibilityLabel={`${rankItem.label} rank, unlocks at level ${rankItem.unlockLevel}, ${unlocked ? "unlocked" : "locked"}`}
            accessible
            key={rankItem.key}
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
              <AppText style={styles.rankStepName}>{rankItem.label}</AppText>
              <AppText style={styles.rankStepMeta}>
                Level {rankItem.unlockLevel}
              </AppText>
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
      <RankMedal locked={locked} rank={rankItem.label} size="small" />
      <AppText style={styles.medalName}>{rankItem.label}</AppText>
      <AppText style={styles.medalMeta}>
        {locked ? `Unlocks at level ${rankItem.unlockLevel}` : "Unlocked"}
      </AppText>
    </View>
  );
}

function formatCompactNumber(value) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: safeValue >= 1000 ? 1 : 0,
    notation: safeValue >= 10000 ? "compact" : "standard",
  }).format(safeValue);
}

function AchievementSummary({ summary, styles }) {
  const closestBadge = summary.closest?.badge;

  return (
    <View style={styles.achievementSummary}>
      <SummaryMetric
        label="Unlocked"
        styles={styles}
        value={`${summary.earnedCount}/${summary.totalCount}`}
      />
      <SummaryMetric
        label="Complete"
        styles={styles}
        value={`${summary.percent}%`}
      />
      <SummaryMetric
        label="Next"
        styles={styles}
        value={closestBadge ? closestBadge.label : "All done"}
      />
    </View>
  );
}

function SummaryMetric({ label, styles, value }) {
  return (
    <View style={styles.summaryMetric}>
      <AppText numberOfLines={2} style={styles.summaryValue}>
        {value}
      </AppText>
      <AppText style={styles.summaryLabel}>{label}</AppText>
    </View>
  );
}

function ClosestBadgeRow({ badge, onPress, progress, styles }) {
  const meta = getAchievementIconMeta(badge.id);

  return (
    <Pressable
      accessibilityLabel={`${badge.label}, ${getAchievementProgressLabel(progress)} toward unlock`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.closestRow,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.closestMark,
          { borderColor: meta.accent },
        ]}
      >
        <AppIcon
          color={meta.accent}
          name={meta.iconName}
          size={20}
          strokeWidth={2}
        />
      </View>
      <View style={styles.closestText}>
        <AppText numberOfLines={1} style={styles.closestName}>
          {badge.label}
        </AppText>
        <AppText style={styles.closestMeta}>
          {progress?.remaining === 1
            ? "1 step remaining"
            : `${progress?.remaining ?? 0} steps remaining`}
        </AppText>
      </View>
      <AppText style={styles.closestProgress}>
        {getAchievementProgressLabel(progress)}
      </AppText>
    </Pressable>
  );
}

function BadgeTile({ badge, earned, onPress, progress, styles, unlockedAt }) {
  const accent = getBadgeTierAccent(badge.tier);
  const progressLabel = getAchievementProgressLabel(progress, earned);

  return (
    <Pressable
      accessibilityLabel={`View ${badge.label} achievement details, ${earned ? "unlocked" : `locked, ${progressLabel}`}`}
      accessibilityRole="button"
      accessibilityState={{ selected: earned }}
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
          {earned
            ? unlockedAt
              ? `Unlocked ${formatAchievementDate(unlockedAt)}`
              : "Unlocked"
            : progressLabel}
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
          name={getRecentAchievementIconName(achievement.type)}
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

function BadgeDetailModal({
  badge,
  earned,
  onClose,
  progress,
  styles,
  unlockedAt,
  visible,
}) {
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
        <View
          accessibilityViewIsModal
          importantForAccessibility="yes"
          style={styles.modalCard}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <BadgeMedal badge={badge} earned={earned} large />
            <AppText style={styles.modalEyebrow}>
              {earned ? "Achievement unlocked" : "Locked achievement"}
            </AppText>
            <AppText style={styles.modalTitle}>{badge.label}</AppText>
            <AppText style={styles.modalDescription}>{badge.description}</AppText>
            <View style={styles.modalMetaRow}>
              <AppText style={styles.modalMeta}>{badge.tier}</AppText>
              <AppText style={styles.modalMeta}>{badge.rarity}</AppText>
              <AppText style={styles.modalMeta}>
                {getAchievementProgressLabel(progress, earned)}
              </AppText>
              {earned && unlockedAt ? (
                <AppText style={styles.modalMeta}>
                  {formatAchievementDate(unlockedAt)}
                </AppText>
              ) : null}
            </View>
            <View style={styles.requirementBox}>
              <AppText style={styles.requirementLabel}>Requirement</AppText>
              <AppText style={styles.requirementText}>{badge.description}</AppText>
              {progress?.measurable ? (
                <AppText style={styles.requirementText}>
                  Current progress: {progress.value} / {progress.max}
                </AppText>
              ) : null}
            </View>
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
        <View
          accessibilityViewIsModal
          importantForAccessibility="yes"
          style={styles.modalCard}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.achievementModalMark}>
              <AppIcon
                color={colors.text}
                name={getRecentAchievementIconName(achievement.type)}
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
    nextMilestone: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
      minHeight: 68,
      padding: v2Spacing.lg,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
    },
    nextMilestoneIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: v2Radius.pill,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    nextMilestoneText: {
      flex: 1,
      minWidth: 0,
    },
    nextMilestoneLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      textTransform: "uppercase",
    },
    nextMilestoneTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: 2,
    },
    nextMilestoneMeta: {
      color: colors.primary,
      flexShrink: 0,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: "32%",
      textAlign: "right",
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
    achievementSummary: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    summaryMetric: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexBasis: isSmallScreen ? "100%" : 0,
      flexGrow: 1,
      gap: 4,
      minHeight: 74,
      padding: v2Spacing.md,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.07,
    },
    summaryValue: {
      color: colors.text,
      fontSize: v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.cardTitle.lineHeight,
    },
    summaryLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      textTransform: "uppercase",
    },
    closestBlock: {
      gap: v2Spacing.sm,
    },
    closestTitle: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    closestRow: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 66,
      paddingHorizontal: v2Spacing.md,
      paddingVertical: v2Spacing.sm,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.07,
    },
    closestMark: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    closestText: {
      flex: 1,
      minWidth: 0,
    },
    closestName: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    closestMeta: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
    closestProgress: {
      color: colors.primary,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: 74,
      textAlign: "right",
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
