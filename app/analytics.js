import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AnalyticsScaffold, {
  AnalyticsHeader,
} from "../components/analytics/AnalyticsScreen";
import ProgressDots from "../components/ProgressDots";
import { AppIcon, AppText, BackIcon, IconButton } from "../components/ui";
import {
  v2FontWeight,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import {
  hasShownFirstTrendUnlock,
  setFirstTrendUnlockShown,
} from "../storage/appPreferences";
import { getGamification } from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import {
  getAnalyticsReadiness,
  shouldShowFirstTrendUnlock,
} from "../utils/analyticsReadiness";
import { getFirstWeekProgressMessage } from "../utils/firstUseExperience";
import { getDeepAnalytics } from "../utils/habitStats";

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
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const [period, setPeriod] = useState("month");
  const [habits, setHabits] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [firstTrendUnlockShown, setFirstTrendUnlockShownState] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendUnlockVisible, setTrendUnlockVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadAnalytics() {
        try {
          setError("");
          const [
            storedHabits,
            storedGamification,
            storedFirstTrendUnlockShown,
          ] = await Promise.all([
            getHabits(),
            getGamification(),
            hasShownFirstTrendUnlock(),
          ]);

          if (!isActive) {
            return;
          }

          setHabits(storedHabits);
          setGamification(storedGamification);
          setFirstTrendUnlockShownState(storedFirstTrendUnlockShown);
        } catch {
          if (isActive) {
            setError("Could not load analytics. Try again.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadAnalytics();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const analytics = useMemo(
    () => getDeepAnalytics(habits, period, gamification),
    [gamification, habits, period]
  );
  const readiness = useMemo(() => getAnalyticsReadiness(habits), [habits]);

  useEffect(() => {
    if (!shouldShowFirstTrendUnlock(readiness, firstTrendUnlockShown)) {
      return;
    }

    setTrendUnlockVisible(true);
    setFirstTrendUnlockShownState(true);
    setFirstTrendUnlockShown().catch(() => {
      // The banner is non-critical; persistence can recover on a future visit.
    });
  }, [firstTrendUnlockShown, readiness]);

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

        <PeriodControl period={period} setPeriod={setPeriod} styles={styles} />

        {error ? <AppText style={styles.errorBanner}>{error}</AppText> : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <AppText style={styles.loadingText}>Loading analytics...</AppText>
          </View>
        ) : null}

        {!loading && analytics.habitCount === 0 ? (
          <EmptyAnalytics colors={colors} styles={styles} />
        ) : null}

        {!loading && readiness.isBuilding ? (
          <DataBuildingAnalytics
            readiness={readiness}
            styles={styles}
          />
        ) : null}

        {!loading && analytics.habitCount > 0 && readiness.ready ? (
          <>
            {trendUnlockVisible ? (
              <TrendUnlockBanner
                colors={colors}
                onDismiss={() => setTrendUnlockVisible(false)}
                styles={styles}
              />
            ) : null}

            <Section title="Consistency trend" styles={styles}>
              <TrendChart
                points={analytics.trendPoints}
                styles={styles}
                summary={getTrendSummary(analytics.trendPoints, period)}
              />
            </Section>

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

            <Section title="Habit performance" styles={styles}>
              {analytics.habitPerformance.length === 0 ? (
                <AppText style={styles.emptyText}>
                  Complete habits to compare performance.
                </AppText>
              ) : (
                analytics.habitPerformance.map((item) => (
                  <HabitPerformanceRow
                    item={item}
                    key={item.habit.id}
                    styles={styles}
                  />
                ))
              )}
            </Section>

            <Section title="Insights" styles={styles}>
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

function PeriodControl({ period, setPeriod, styles }) {
  return (
    <View accessibilityRole="tablist" style={styles.periodControl}>
      {PERIODS.map((item) => {
        const selected = period === item.key;

        return (
          <Pressable
            accessibilityLabel={`${item.label} period`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={item.key}
            onPress={() => setPeriod(item.key)}
            style={({ pressed }) => [
              styles.periodItem,
              selected && styles.periodItemSelected,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              style={[
                styles.periodLabel,
                selected && styles.periodLabelSelected,
              ]}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Section({ children, styles, title }) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {children}
    </View>
  );
}

function TrendChart({ points, styles, summary }) {
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

function MetricBlock({ helper, label, styles, value }) {
  return (
    <View style={styles.metricBlock}>
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

function HabitPerformanceRow({ item, styles }) {
  const trendLabel =
    item.trendDelta > 5
      ? `+${item.trendDelta}%`
      : item.trendDelta < -5
        ? `${item.trendDelta}%`
        : "Stable";

  return (
    <Pressable
      accessibilityLabel={`Open analytics for ${item.habit.name}`}
      accessibilityRole="button"
      onPress={() => router.push(`/analytics/${item.habit.id}`)}
      style={({ pressed }) => [
        styles.habitRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.habitTopRow}>
        <View style={styles.habitMain}>
          <AppText numberOfLines={2} style={styles.habitName}>
            {item.habit.name}
          </AppText>
          <AppText numberOfLines={3} style={styles.habitMeta}>
            {item.category} · {item.currentStreak} day streak · {trendLabel}
          </AppText>
        </View>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          style={styles.habitRateValue}
        >
          {item.completionRate}%
        </AppText>
      </View>
      <View style={styles.habitTrack}>
        <View
          style={[
            styles.habitFill,
            { width: `${clampPercentage(item.completionRate)}%` },
          ]}
        />
      </View>
      <ProgressDots days={item.weeklyProgress} compact />
    </Pressable>
  );
}

function EmptyAnalytics({ colors, styles }) {
  return (
    <View style={styles.emptyCard}>
      <AppText style={styles.emptyTitle}>Not enough data yet</AppText>
      <AppText style={styles.emptyText}>
        Complete habits for a few days and Momentum will start showing patterns,
        streak changes, and stronger habits.
      </AppText>
      <Pressable
        accessibilityLabel="Create a habit from Analytics"
        accessibilityRole="button"
        onPress={() => router.push("/add")}
        style={({ pressed }) => [
          styles.emptyAction,
          pressed && styles.pressed,
        ]}
      >
        <AppIcon color={colors.inverseText} name="plus" size={16} />
        <AppText style={styles.emptyActionText}>Add habit</AppText>
      </Pressable>
    </View>
  );
}

function DataBuildingAnalytics({ readiness, styles }) {
  return (
    <View
      accessibilityLabel={`Analytics data is building. ${readiness.habitCount} active habits, ${readiness.totalCompletions} completions, ${readiness.activeDays} active days.`}
      accessible
      style={styles.buildingCard}
    >
      <AppText style={styles.emptyTitle}>Analytics are building</AppText>
      <AppText style={styles.emptyText}>
        {getFirstWeekProgressMessage({
          habitCount: readiness.habitCount,
          readiness,
        })}
      </AppText>

      <View style={styles.buildingTrack}>
        <View
          style={[
            styles.buildingFill,
            { width: `${readiness.progress}%` },
          ]}
        />
      </View>
      <AppText style={styles.buildingProgressText}>
        {readiness.progress}% toward first trend
      </AppText>

      <View style={styles.buildingStats}>
        <BuildingStat
          label="Habits"
          styles={styles}
          value={readiness.habitCount}
        />
        <BuildingStat
          label="Completions"
          styles={styles}
          value={`${readiness.totalCompletions}/${readiness.completionGoal}`}
        />
        <BuildingStat
          label="Active days"
          styles={styles}
          value={`${readiness.activeDays}/${readiness.activeDayGoal}`}
        />
      </View>

      <AppText style={styles.buildingHint}>
        Next: {getBuildingHint(readiness)}
      </AppText>
    </View>
  );
}

function BuildingStat({ label, styles, value }) {
  return (
    <View style={styles.buildingStat}>
      <AppText style={styles.buildingStatValue}>{value}</AppText>
      <AppText style={styles.buildingStatLabel}>{label}</AppText>
    </View>
  );
}

function TrendUnlockBanner({ colors, onDismiss, styles }) {
  return (
    <Pressable
      accessibilityLabel="First trend unlocked. Analytics can now show useful patterns."
      accessibilityRole="button"
      accessibilityHint="Double tap to dismiss this message."
      onPress={onDismiss}
      style={({ pressed }) => [
        styles.unlockBanner,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.unlockIcon}>
        <AppIcon name="analytics" color={colors.primary} size={18} />
      </View>
      <View style={styles.unlockText}>
        <AppText style={styles.unlockTitle}>First trend unlocked</AppText>
        <AppText style={styles.unlockMessage}>
          You have enough history for Momentum to show useful patterns.
        </AppText>
      </View>
      <AppText style={styles.unlockDismiss}>Got it</AppText>
    </Pressable>
  );
}

function getBuildingHint(readiness) {
  if (readiness.remainingCompletions > 0 && readiness.remainingActiveDays > 0) {
    return `${readiness.remainingCompletions} more completions across ${readiness.remainingActiveDays} more active days.`;
  }

  if (readiness.remainingCompletions > 0) {
    return `${readiness.remainingCompletions} more completions.`;
  }

  if (readiness.remainingActiveDays > 0) {
    return `${readiness.remainingActiveDays} more active days.`;
  }

  return "keep completing habits to strengthen the trend.";
}

function formatTrendDelta(delta) {
  if (!Number.isFinite(delta)) {
    return "Not enough data to compare";
  }

  if (delta > 0) {
    return `+${delta}% vs previous period`;
  }

  if (delta < 0) {
    return `${delta}% vs previous period`;
  }

  return "No change vs previous period";
}

function getTrendSummary(points, period) {
  const percentages = points.map((point) => clampPercentage(point.percentage));

  if (percentages.length === 0) {
    return "No trend data available yet.";
  }

  return `Completion trend ranges from ${Math.min(
    ...percentages
  )}% to ${Math.max(...percentages)}% over ${getPeriodLabel(
    period
  ).toLowerCase()}.`;
}

function clampPercentage(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
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

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    backButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderColor: colors.border,
      marginBottom: v2Spacing.md,
    },
    periodControl: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      marginBottom: v2Spacing.lg,
      padding: 4,
    },
    periodItem: {
      alignItems: "center",
      borderRadius: v2Radius.medium,
      flex: 1,
      justifyContent: "center",
      minHeight: 44,
    },
    periodItemSelected: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    periodLabel: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    periodLabelSelected: {
      color: colors.text,
    },
    errorBanner: {
      backgroundColor: colors.dangerSoft,
      borderRadius: v2Radius.small,
      color: colors.danger,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      gap: 10,
      padding: 28,
    },
    loadingText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    section: {
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
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
    metricGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
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
    habitRow: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      gap: v2Spacing.md,
      padding: v2Spacing.lg,
    },
    habitTopRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
      maxWidth: "100%",
    },
    habitMain: {
      flex: 1,
      minWidth: 0,
    },
    habitName: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
    },
    habitMeta: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 4,
    },
    habitTrack: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      height: 6,
      marginTop: v2Spacing.md,
      overflow: "hidden",
    },
    habitFill: {
      backgroundColor: colors.text,
      borderRadius: 999,
      height: "100%",
    },
    habitRateValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: "32%",
      textAlign: "right",
    },
    insightText: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      padding: v2Spacing.lg,
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.xl,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    emptyText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
      marginBottom: v2Spacing.lg,
    },
    emptyAction: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.large,
      flexDirection: "row",
      gap: v2Spacing.xs,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: v2Spacing.lg,
    },
    emptyActionText: {
      color: colors.inverseText,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    buildingCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.xl,
    },
    buildingTrack: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      height: 8,
      marginTop: v2Spacing.md,
      overflow: "hidden",
    },
    buildingFill: {
      backgroundColor: colors.primary,
      borderRadius: v2Radius.pill,
      height: "100%",
    },
    buildingProgressText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.sm,
    },
    buildingStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
    },
    buildingStat: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexBasis: "30%",
      flexGrow: 1,
      minWidth: 92,
      padding: v2Spacing.md,
    },
    buildingStatValue: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    buildingStatLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
    buildingHint: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: v2Spacing.lg,
    },
    unlockBanner: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.primary,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: v2Spacing.lg,
      minHeight: 64,
      padding: v2Spacing.md,
    },
    unlockIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: v2Radius.pill,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    unlockText: {
      flex: 1,
      minWidth: 0,
    },
    unlockTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    unlockMessage: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: 2,
    },
    unlockDismiss: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    pressed: {
      opacity: 0.74,
      transform: [{ scale: 0.98 }],
    },
  });
}
