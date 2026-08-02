import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function HeroMetric({
  completedCount,
  completionRate,
  isSmallScreen,
  periodLabel,
  possibleCount,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View
      accessibilityLabel={`${completionRate}% completion rate for ${periodLabel}. ${completedCount} of ${possibleCount} possible completions.`}
      accessible
      style={styles.heroMetric}
    >
      <AppText style={styles.heroValue}>{completionRate}%</AppText>
      <AppText style={styles.heroLabel}>Overall consistency</AppText>
      <View style={styles.heroTrack}>
        <View
          style={[
            styles.heroFill,
            { width: `${clampPercentage(completionRate)}%` },
          ]}
        />
      </View>
      <AppText style={styles.heroContext}>
        {completedCount} of {possibleCount} possible
        completions
      </AppText>
    </View>
  );
}

function clampPercentage(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
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
      fontSize: isSmallScreen ? 54 : v2Typography.heroMetric.fontSize,
      fontWeight: v2Typography.heroMetric.fontWeight,
      lineHeight: isSmallScreen ? 60 : v2Typography.heroMetric.lineHeight,
    },
    heroLabel: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: 4,
    },
    heroTrack: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      height: 8,
      marginTop: v2Spacing.lg,
      overflow: "hidden",
    },
    heroFill: {
      backgroundColor: colors.text,
      borderRadius: v2Radius.pill,
      height: "100%",
    },
    heroContext: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: v2Spacing.sm,
    },
  });
}
