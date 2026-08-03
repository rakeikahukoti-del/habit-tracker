import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { getMetricAccessibilityLabel } from "../../utils/analyticsPresentation";

export default function KeyMetricsGrid({ analytics, isSmallScreen }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View style={styles.metricGrid}>
      <MetricBlock
        label="Completion"
        value={`${analytics.completionRate}%`}
        helper={formatTrendDelta(analytics.trendDelta)}
        styles={styles}
      />
      <MetricBlock
        label="Total completed"
        value={analytics.completedCount}
        styles={styles}
      />
      <MetricBlock
        label="Average per day"
        value={analytics.averagePerDay}
        styles={styles}
      />
      <MetricBlock
        label="XP earned"
        value={analytics.totalXpEarned}
        styles={styles}
      />
    </View>
  );
}

function MetricBlock({ helper, label, styles, value }) {
  return (
    <View
      accessibilityLabel={getMetricAccessibilityLabel(label, value, helper)}
      accessible
      style={styles.metricBlock}
    >
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={2}
        style={styles.metricValue}
      >
        {value}
      </AppText>
      <AppText style={styles.metricLabel}>{label}</AppText>
      {helper ? <AppText style={styles.metricHelper}>{helper}</AppText> : null}
    </View>
  );
}

function formatTrendDelta(delta) {
  if (!Number.isFinite(delta)) {
    return "Not enough data to compare";
  }

  if (Math.abs(delta) < 5) {
    return "Stable vs previous period";
  }

  if (delta > 0) {
    return `+${delta}% vs previous period`;
  }

  return `${delta}% vs previous period`;
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    metricGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.md,
    },
    metricBlock: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      minWidth: 0,
      padding: v2Spacing.lg,
    },
    metricValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 26 : 30,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 31 : 36,
    },
    metricLabel: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: v2Spacing.sm,
    },
    metricHelper: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 3,
    },
  });
}
