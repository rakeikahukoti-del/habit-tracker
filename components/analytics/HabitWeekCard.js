import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function HabitWeekCard({ isSmallScreen, pattern }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View
      accessibilityLabel={`This week. ${pattern.summaryLabel} scheduled days completed. ${pattern.completionRateLabel}. ${pattern.comparison.label}. ${pattern.nextScheduled.label}.`}
      accessible
      style={styles.habitWeekCard}
    >
      <View style={styles.habitWeekHeader}>
        <View style={styles.habitWeekMain}>
          <AppText style={styles.habitWeekLabel}>Scheduled completed</AppText>
          <AppText style={styles.habitWeekValue}>{pattern.summaryLabel}</AppText>
        </View>
        <View style={styles.habitWeekRatePill}>
          <AppText style={styles.habitWeekRateText}>
            {pattern.completionRateLabel}
          </AppText>
        </View>
      </View>
      <View style={styles.habitWeekRows}>
        <HabitWeekRow
          label="Compared with last week"
          styles={styles}
          value={
            pattern.comparison.available
              ? pattern.comparison.label
              : "Needs more data"
          }
        />
        <HabitWeekRow
          label="Next scheduled"
          styles={styles}
          value={pattern.nextScheduled.label}
        />
      </View>
    </View>
  );
}

function HabitWeekRow({ label, styles, value }) {
  return (
    <View style={styles.habitWeekRow}>
      <AppText style={styles.habitWeekRowLabel}>{label}</AppText>
      <AppText style={styles.habitWeekRowValue}>{value}</AppText>
    </View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    habitWeekCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.lg,
    },
    habitWeekHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    habitWeekMain: {
      flex: 1,
      minWidth: 0,
    },
    habitWeekLabel: {
      color: colors.primary,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    habitWeekValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
    },
    habitWeekRatePill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexShrink: 0,
      minHeight: 34,
      justifyContent: "center",
      paddingHorizontal: v2Spacing.md,
    },
    habitWeekRateText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    habitWeekRows: {
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
      paddingTop: v2Spacing.md,
    },
    habitWeekRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.xs,
      justifyContent: "space-between",
    },
    habitWeekRowLabel: {
      color: colors.muted,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      minWidth: 130,
    },
    habitWeekRowValue: {
      color: colors.text,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: 18,
      minWidth: 130,
      textAlign: "right",
    },
  });
}
