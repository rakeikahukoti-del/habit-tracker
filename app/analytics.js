import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import AnalyticsScaffold, {
  AnalyticsHeader,
} from "../components/analytics/AnalyticsScreen";
import {
  AnalyticsError,
  DataBuildingAnalytics,
  HabitPerformanceList,
  InsightsDashboardSection,
  KeyMetricsGrid,
  MonthlyReviewCard,
  Section,
  TrendChart,
  TrendUnlockBanner,
} from "../components/analytics";
import { PeriodControl } from "../components/stats";
import { AppText, BackIcon, EmptyDataCard, IconButton } from "../components/ui";
import {
  v2FontWeight,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { getTrendAccessibilitySummary } from "../utils/analyticsPresentation";
import { useAnalyticsController } from "../hooks/useAnalyticsController";

const PERIODS = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "all", label: "All" },
];

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    analytics,
    error,
    insightsDashboard,
    loading,
    monthlyReview,
    period,
    readiness,
    setPeriod,
    setReloadRequest,
    setTrendUnlockVisible,
    trendUnlockVisible,
  } = useAnalyticsController();

  return (
    <AnalyticsScaffold bottomNav>
        <IconButton
          accessibilityLabel="Back to Progress"
          color={colors.text}
          onPress={goBackToStats}
          style={styles.backButton}
        >
          <BackIcon color={colors.text} />
        </IconButton>

        <AnalyticsHeader
          subtitle={`Trends and habit performance for ${getPeriodLabel(period).toLowerCase()}.`}
          title="Analytics"
        />

        <PeriodControl period={period} periods={PERIODS} setPeriod={setPeriod} />

        {!loading && error ? (
          <AnalyticsError
            message={error}
            onRetry={() => setReloadRequest((value) => value + 1)}
          />
        ) : null}

        {loading && !error ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <AppText style={styles.loadingText}>Preparing analytics...</AppText>
          </View>
        ) : null}

        {!loading && !error && analytics.habitCount === 0 ? (
          <EmptyDataCard
            ctaAccessibilityLabel="Create a habit from Analytics"
            ctaLabel="Add habit"
            ctaRoute="/add"
            icon="analytics"
            message="Add your first habit, then complete it for a few days to unlock trends and insights."
            title="No habits to analyse — add one to start spotting trends"
          />
        ) : null}

        {!loading && !error && readiness.isBuilding ? (
          <DataBuildingAnalytics readiness={readiness} />
        ) : null}

        {!loading && !error && analytics.habitCount > 0 && readiness.ready ? (
          <>
            {trendUnlockVisible ? (
              <TrendUnlockBanner
                onDismiss={() => setTrendUnlockVisible(false)}
              />
            ) : null}

            <Section title="Key metrics">
              <KeyMetricsGrid analytics={analytics} isSmallScreen={isSmallScreen} />
            </Section>

            <InsightsDashboardSection
              dashboard={insightsDashboard}
              isSmallScreen={isSmallScreen}
            />

            <Section title="Consistency trend">
              <TrendChart
                points={analytics.trendPoints}
                summary={getTrendAccessibilitySummary(
                  analytics.trendPoints,
                  getPeriodLabel(period)
                )}
              />
            </Section>

            {monthlyReview.hasMeaningfulData ? (
              <Section title="Monthly review">
                <MonthlyReviewCard isSmallScreen={isSmallScreen} review={monthlyReview} />
              </Section>
            ) : null}

            <Section title="Habit performance">
              <HabitPerformanceList items={analytics.habitPerformance} />
            </Section>

            <Section title="Insights">
              {analytics.insights.map((insight) => (
                <AppText key={insight} style={styles.insightText}>
                  {insight}
                </AppText>
              ))}
            </Section>
          </>
        ) : null}
    </AnalyticsScaffold>
  );
}

function getPeriodLabel(period) {
  return PERIODS.find((item) => item.key === period)?.label || "Month";
}

function goBackToStats() {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }

  router.replace("/stats");
}

function createStyles(colors) {
  return StyleSheet.create({
    backButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderColor: colors.border,
      marginBottom: v2Spacing.md,
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      gap: 10,
      padding: 28,
    },
    loadingText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    insightText: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      padding: v2Spacing.lg,
    },
  });
}
