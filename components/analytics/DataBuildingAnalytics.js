import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { getFirstWeekProgressMessage } from "../../utils/firstUseExperience";

export default function DataBuildingAnalytics({ readiness }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      accessibilityLabel={`Analytics data is building. ${readiness.habitCount} active habits, ${readiness.totalCompletions} completions, ${readiness.activeDays} active days.`}
      accessible
      style={styles.buildingCard}
    >
      <AppText style={styles.emptyTitle}>Analytics are building</AppText>
      <AppText style={styles.emptyText}>
        {getFirstWeekProgressMessage({
          habitCount: readiness.habitCount,
          readiness,
        })}
      </AppText>

      <View style={styles.buildingTrack}>
        <View
          style={[
            styles.buildingFill,
            { width: `${readiness.progress}%` },
          ]}
        />
      </View>
      <AppText style={styles.buildingProgressText}>
        {readiness.progress}% toward first trend
      </AppText>

      <View style={styles.buildingStats}>
        <BuildingStat
          label="Habits"
          styles={styles}
          value={readiness.habitCount}
        />
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
      </View>

      <AppText style={styles.buildingHint}>
        Next: {getBuildingHint(readiness)}
      </AppText>
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

function getBuildingHint(readiness) {
  if (readiness.remainingCompletions > 0 && readiness.remainingActiveDays > 0) {
    return `${readiness.remainingCompletions} more completions across ${readiness.remainingActiveDays} more active days.`;
  }

  if (readiness.remainingCompletions > 0) {
    return `${readiness.remainingCompletions} more completions.`;
  }

  if (readiness.remainingActiveDays > 0) {
    return `${readiness.remainingActiveDays} more active days.`;
  }

  return "Keep completing habits to strengthen the trend.";
}

function createStyles(colors) {
  return StyleSheet.create({
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
      marginBottom: v2Spacing.lg,
    },
    buildingCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.xl,
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
    buildingHint: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: v2Spacing.lg,
    },
  });
}
