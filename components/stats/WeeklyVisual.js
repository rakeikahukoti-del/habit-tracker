import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function WeeklyVisual({ days, isSmallScreen }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View style={styles.weekVisual}>
      {days.map((day) => {
        const complete = day.totalHabits > 0 && day.completedCount === day.totalHabits;
        const partial = day.completedCount > 0 && !complete;

        return (
          <View
            accessibilityLabel={`${day.label}: ${day.completedCount} of ${day.totalHabits} completed`}
            accessible
            key={day.dateKey}
            style={styles.weekDay}
          >
            <AppText style={styles.weekLabel}>{day.label}</AppText>
            <View
              style={[
                styles.weekDot,
                partial && styles.weekDotPartial,
                complete && styles.weekDotComplete,
              ]}
            />
            <AppText style={styles.weekCount}>
              {day.completedCount}/{day.totalHabits}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    weekVisual: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: isSmallScreen ? v2Spacing.md : v2Spacing.lg,
    },
    weekDay: {
      alignItems: "center",
      flex: 1,
      gap: 7,
      minWidth: 0,
    },
    weekLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    weekDot: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      height: 16,
      width: 16,
    },
    weekDotPartial: {
      borderColor: colors.text,
    },
    weekDotComplete: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    weekCount: {
      color: colors.muted,
      fontSize: v2Typography.navigationLabel.fontSize,
      fontWeight: v2FontWeight.medium,
    },
  });
}
