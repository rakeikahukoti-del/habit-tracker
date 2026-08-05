import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function HabitHeroSection({
  completionRate,
  guidance,
  isSmallScreen,
  readiness,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  if (readiness.state === "ready") {
    return (
      <View
        accessibilityLabel={`${completionRate}% completion rate in the last 30 scheduled days`}
        accessible
        style={styles.heroMetric}
      >
        <AppText style={styles.heroValue}>{completionRate}%</AppText>
        <AppText style={styles.heroLabel}>Completion rate</AppText>
        <View style={styles.heroTrack}>
          <View style={[styles.heroFill, { width: `${completionRate}%` }]} />
        </View>
      </View>
    );
  }

  const title =
    readiness.state === "empty" ? "No completions yet" : "Insight is building";

  return (
    <View
      accessibilityLabel={`${title}. ${readiness.totalCompletions} completions, ${readiness.activeDays} active days, ${readiness.scheduledOpportunities} scheduled days. ${guidance}`}
      accessible
      style={styles.buildingCard}
    >
      <AppText style={styles.emptyTitle}>{title}</AppText>
      <AppText style={styles.emptyText}>
        {readiness.state === "empty"
          ? "Complete this habit on a scheduled day to begin its progress story."
          : "A few more real completions will make this habit's pattern clearer."}
      </AppText>

      <View style={styles.buildingTrack}>
        <View style={[styles.buildingFill, { width: `${readiness.progress}%` }]} />
      </View>
      <AppText style={styles.buildingProgressText}>
        {readiness.progress}% toward stronger insight
      </AppText>

      <View style={styles.buildingStats}>
        <BuildingStat
          label="Completions"
          styles={styles}
          value={`${readiness.totalCompletions}/${readiness.completionGoal}`}
        />
        <BuildingStat
          label="Active days"
          styles={styles}
          value={`${readiness.activeDays}/${readiness.activeDayGoal}`}
        />
        <BuildingStat
          label="Scheduled"
          styles={styles}
          value={readiness.scheduledOpportunities}
        />
      </View>
    </View>
  );
}

function BuildingStat({ label, styles, value }) {
  return (
    <View style={styles.buildingStat}>
      <AppText style={styles.buildingStatValue}>{value}</AppText>
      <AppText style={styles.buildingStatLabel}>{label}</AppText>
    </View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    heroMetric: {
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginBottom: v2Spacing.xl,
      paddingVertical: v2Spacing.xl,
    },
    heroValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 50 : 58,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 56 : 64,
    },
    heroLabel: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 4,
    },
    heroTrack: {
      backgroundColor: colors.surface,
      borderRadius: 999,
      height: 8,
      marginTop: v2Spacing.lg,
      overflow: "hidden",
    },
    heroFill: {
      backgroundColor: colors.text,
      borderRadius: 999,
      height: "100%",
    },
    buildingCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      marginBottom: v2Spacing.xl,
      padding: v2Spacing.xl,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    emptyText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
    },
    buildingTrack: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      height: 8,
      marginTop: v2Spacing.md,
      overflow: "hidden",
    },
    buildingFill: {
      backgroundColor: colors.primary,
      borderRadius: v2Radius.pill,
      height: "100%",
    },
    buildingProgressText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.sm,
    },
    buildingStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
    },
    buildingStat: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexBasis: "30%",
      flexGrow: 1,
      minWidth: 92,
      padding: v2Spacing.md,
    },
    buildingStatValue: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    buildingStatLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
  });
}
