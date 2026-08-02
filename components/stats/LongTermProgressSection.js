import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function LongTermProgressSection({ lifetimeStats, progress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.metricList}>
      <MetricRow
        label="Current streak"
        value={`${progress.currentLongestStreak} days`}
        styles={styles}
      />
      <MetricRow
        label="Best streak"
        value={`${progress.bestAllTimeStreak} days`}
        styles={styles}
      />
      <MetricRow
        label="Perfect days"
        value={lifetimeStats.totalPerfectDays}
        styles={styles}
      />
      <MetricRow
        label="Lifetime completion"
        value={`${lifetimeStats.overallCompletionRate}%`}
        styles={styles}
      />
      <MetricRow
        label="XP earned"
        value={lifetimeStats.totalXpEarned}
        styles={styles}
      />
      <MetricRow
        label="Days tracked"
        value={lifetimeStats.daysUsingMomentum}
        styles={styles}
      />
    </View>
  );
}

function MetricRow({ label, styles, value }) {
  return (
    <View style={styles.metricRow}>
      <AppText style={styles.metricLabel}>{label}</AppText>
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={2}
        style={styles.metricValue}
      >
        {value}
      </AppText>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    metricList: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      paddingHorizontal: v2Spacing.lg,
    },
    metricRow: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
      minHeight: 54,
      paddingVertical: v2Spacing.sm,
    },
    metricLabel: {
      color: colors.muted,
      flex: 1,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      minWidth: 0,
    },
    metricValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
      maxWidth: "48%",
      textAlign: "right",
    },
  });
}
