import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function HabitConsistencyCard({ isSmallScreen, strength }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View
      accessibilityLabel={`Habit consistency. Last 30 days ${strength.completionRate} percent. Last 7 days ${strength.weeklyRate} percent. Trend ${getHabitTrendLabel(strength.trend)}.`}
      accessible
      style={styles.consistencyCard}
    >
      <View style={styles.consistencyHeader}>
        <View style={styles.consistencyMain}>
          <AppText style={styles.consistencyLabel}>Consistency</AppText>
          <AppText style={styles.consistencyValue}>
            {strength.completionRate}%
          </AppText>
        </View>
        <AppText style={styles.consistencyPill}>
          {getHabitTrendLabel(strength.trend)}
        </AppText>
      </View>
      <View style={styles.consistencyRows}>
        <HabitWeekRow
          label="Last 7 days"
          styles={styles}
          value={`${strength.weeklyRate}%`}
        />
        <HabitWeekRow
          label="Ranking data"
          styles={styles}
          value={
            strength.hasSufficientData
              ? `${strength.possibleCount} scheduled days`
              : "Still building"
          }
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

function getHabitTrendLabel(trend) {
  if (trend?.direction === "improving") {
    return "Improving";
  }

  if (trend?.direction === "declining") {
    return "Declining";
  }

  if (trend?.direction === "insufficient") {
    return "Building";
  }

  return "Stable";
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    consistencyCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      marginBottom: v2Spacing.xl,
      padding: v2Spacing.lg,
    },
    consistencyHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    consistencyMain: {
      flex: 1,
      minWidth: 0,
    },
    consistencyLabel: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    consistencyValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
      marginTop: 2,
    },
    consistencyPill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: v2Spacing.md,
      paddingVertical: 7,
    },
    consistencyRows: {
      gap: v2Spacing.sm,
      marginTop: v2Spacing.md,
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
