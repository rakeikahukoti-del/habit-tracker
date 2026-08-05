import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LevelProgress, RankMedal } from "../progression";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function RankHero({
  isSmallScreen,
  levelInfo,
  nextMilestone,
  nextRank,
  rank,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
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
    </>
  );
}

function formatCompactNumber(value) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: safeValue >= 1000 ? 1 : 0,
    notation: safeValue >= 10000 ? "compact" : "standard",
  }).format(safeValue);
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
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
      borderRadius: v2Radius.large,
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
      minHeight: 68,
      padding: v2Spacing.lg,
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
  });
}
