import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function HabitMiniTrend({ points }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      accessibilityLabel="Habit trend for the selected period"
      accessible
      style={styles.trendCard}
    >
      {points.map((point, index) => {
        const percentage = clampPercentage(point.percentage);

        return (
          <View key={`${point.label}-${index}`} style={styles.trendColumn}>
            <View style={styles.trendTrack}>
              <View
                style={[
                  styles.trendFill,
                  { height: `${Math.max(4, percentage)}%` },
                ]}
              />
            </View>
            <AppText style={styles.trendLabel}>{point.label}</AppText>
          </View>
        );
      })}
    </View>
  );
}

function clampPercentage(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function createStyles(colors) {
  return StyleSheet.create({
    trendCard: {
      alignItems: "flex-end",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.sm,
      height: 138,
      padding: v2Spacing.lg,
    },
    trendColumn: {
      alignItems: "center",
      flex: 1,
      gap: v2Spacing.sm,
      height: "100%",
      justifyContent: "flex-end",
    },
    trendTrack: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.small,
      flex: 1,
      justifyContent: "flex-end",
      overflow: "hidden",
      width: "100%",
    },
    trendFill: {
      backgroundColor: colors.text,
      minHeight: 4,
      width: "100%",
    },
    trendLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
    },
  });
}
