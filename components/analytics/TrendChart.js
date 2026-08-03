import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function TrendChart({ points, summary }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const safePoints =
    points.length > 0 ? points : [{ label: "Now", percentage: 0 }];

  return (
    <View accessibilityLabel={summary} accessible style={styles.chart}>
      <View style={styles.chartBars}>
        {safePoints.map((point, index) => {
          const percentage = clampPercentage(point.percentage);

          return (
            <View key={`${point.label}-${index}`} style={styles.chartColumn}>
              <View style={styles.chartTrack}>
                <View
                  style={[
                    styles.chartFill,
                    { height: `${Math.max(4, percentage)}%` },
                  ]}
                />
              </View>
              <AppText numberOfLines={1} style={styles.chartLabel}>
                {point.label}
              </AppText>
            </View>
          );
        })}
      </View>
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
    chart: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.lg,
    },
    chartBars: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: v2Spacing.sm,
      height: 150,
    },
    chartColumn: {
      alignItems: "center",
      flex: 1,
      gap: v2Spacing.sm,
      height: "100%",
      justifyContent: "flex-end",
      minWidth: 0,
    },
    chartTrack: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.small,
      borderWidth: 1,
      flex: 1,
      justifyContent: "flex-end",
      overflow: "hidden",
      width: "100%",
    },
    chartFill: {
      backgroundColor: colors.text,
      borderRadius: v2Radius.small,
      minHeight: 4,
      width: "100%",
    },
    chartLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      maxWidth: "100%",
    },
  });
}
