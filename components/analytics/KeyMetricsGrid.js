import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
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
        colors={colors}
        label="Completion"
        value={`${analytics.completionRate}%`}
        // The full "+12% vs previous period" sentence still reaches
        // screen readers via accessibilityLabel below - only the visible
        // rendering shrank to an icon + short delta (Phase 13 text-density
        // pass).
        helper={formatTrendDeltaForAccessibility(analytics.trendDelta)}
        indicator={getTrendIndicator(analytics.trendDelta)}
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

function MetricBlock({ colors, helper, indicator, label, styles, value }) {
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
      {indicator ? (
        <View style={styles.metricIndicator}>
          {indicator.icon ? (
            <AppIcon
              color={colors.muted}
              name={indicator.icon}
              size={12}
              strokeWidth={2.4}
            />
          ) : null}
          <AppText style={styles.metricHelper}>{indicator.text}</AppText>
        </View>
      ) : null}
    </View>
  );
}

// Full sentence, kept only for the accessibility label - the visible UI
// uses getTrendIndicator's short text + icon instead.
function formatTrendDeltaForAccessibility(delta) {
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

// Compact visual: a chevron (reusing the same up/down glyph AppIcon
// already uses for expand/collapse elsewhere) plus a short delta, instead
// of a full sentence. No icon for the stable/insufficient-data cases -
// there's no meaningful direction to point.
function getTrendIndicator(delta) {
  if (!Number.isFinite(delta)) {
    return { icon: null, text: "No comparison yet" };
  }

  if (Math.abs(delta) < 5) {
    return { icon: null, text: "Stable" };
  }

  if (delta > 0) {
    return { icon: "chevron-up", text: `+${delta}%` };
  }

  return { icon: "chevron-down", text: `${delta}%` };
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
      borderRadius: v2Radius.large,
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
    metricIndicator: {
      alignItems: "center",
      flexDirection: "row",
      gap: 3,
      marginTop: 3,
    },
    metricHelper: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
    },
  });
}
