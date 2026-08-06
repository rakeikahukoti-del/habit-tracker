import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BadgeMedal, getBadgeTierAccent } from "../progression";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { badges } from "../../storage/gamificationStorage";
import {
  getAchievementProgress,
  getAchievementProgressLabel,
  getAchievementUnlockDate,
} from "../../utils/achievementProgress";
import { getAchievementIconMeta } from "../../constants/achievements";
import { PRESSED_BUTTON_STYLE } from "../home/pressedStyles";

export default function AchievementsSection({
  badgePreview,
  badgeSortDirection,
  closestBadges,
  earnedBadgeIds,
  earnedBadges,
  isSmallScreen,
  onSelectBadge,
  onToggleBadges,
  progressionSnapshot,
  recentAchievements,
  setBadgeSortDirection,
  showAllBadges,
  summary,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <>
      <AchievementSummary summary={summary} styles={styles} />
      {closestBadges.length > 0 ? (
        <View style={styles.closestBlock}>
          <AppText style={styles.closestTitle}>Closest unlocks</AppText>
          {closestBadges.map(({ badge, progress }) => (
            <ClosestBadgeRow
              badge={badge}
              key={badge.id}
              onPress={() =>
                onSelectBadge({
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
                pressed && PRESSED_BUTTON_STYLE,
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
            recentAchievements
          );

          return (
            <BadgeTile
              badge={badge}
              earned={earned}
              key={badge.id}
              onPress={() =>
                onSelectBadge({ badge, earned, progress, unlockedAt })
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
          accessibilityState={{ expanded: showAllBadges }}
          onPress={onToggleBadges}
          style={({ pressed }) => [
            styles.showButton,
            pressed && PRESSED_BUTTON_STYLE,
          ]}
        >
          <AppText style={styles.showButtonText}>
            {showAllBadges ? "Show fewer badges" : "Show all badges"}
          </AppText>
        </Pressable>
      ) : null}
    </>
  );
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
  const accent = getBadgeTierAccent(badge.tier);

  return (
    <Pressable
      accessibilityLabel={`${badge.label}, ${getAchievementProgressLabel(progress)} toward unlock`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.closestRow,
        pressed && PRESSED_BUTTON_STYLE,
      ]}
    >
      <View
        style={[
          styles.closestMark,
          { borderColor: accent },
        ]}
      >
        <AppIcon
          color={accent}
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
        pressed && PRESSED_BUTTON_STYLE,
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
      borderRadius: v2Radius.large,
      flexBasis: isSmallScreen ? "100%" : 0,
      flexGrow: 1,
      gap: v2Spacing.xs,
      minHeight: 74,
      padding: v2Spacing.md,
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
      borderRadius: v2Radius.large,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 66,
      paddingHorizontal: v2Spacing.md,
      paddingVertical: v2Spacing.sm,
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
      borderRadius: v2Radius.large,
      flexDirection: isSmallScreen ? "column" : "row",
      gap: isSmallScreen ? v2Spacing.md : v2Spacing.lg,
      minHeight: isSmallScreen ? 0 : 110,
      padding: isSmallScreen ? v2Spacing.md : v2Spacing.lg,
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
  });
}
