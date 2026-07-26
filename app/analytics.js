import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import BottomNav from "../components/BottomNav";
import ProgressDots from "../components/ProgressDots";
import { BackIcon, IconButton } from "../components/ui";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  radius,
  spacing,
} from "../constants/typography";
import { useTheme } from "../context/ThemeContext";
import { getGamification } from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
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
  const isTablet = width >= 768;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen, isTablet }),
    [colors, isSmallScreen, isTablet]
  );
  const [period, setPeriod] = useState("month");
  const [habits, setHabits] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadAnalytics() {
        try {
          setError("");
          const [storedHabits, storedGamification] = await Promise.all([
            getHabits(),
            getGamification(),
          ]);

          if (!isActive) {
            return;
          }

          setHabits(storedHabits);
          setGamification(storedGamification);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <IconButton
          accessibilityLabel="Back to Progress"
          onPress={goBackToStats}
          style={styles.backButton}
        >
          <BackIcon />
        </IconButton>

        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>
            Trends and habit performance for {getPeriodLabel(period).toLowerCase()}.
          </Text>
        </View>

        <PeriodControl period={period} setPeriod={setPeriod} styles={styles} />

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : null}

        {!loading && analytics.habitCount === 0 ? (
          <EmptyAnalytics styles={styles} />
        ) : null}

        {!loading && analytics.habitCount > 0 ? (
          <>
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
                <Text style={styles.emptyText}>
                  Complete habits to compare performance.
                </Text>
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
                <Text key={insight} style={styles.insightText}>
                  {insight}
                </Text>
              ))}
            </Section>
          </>
        ) : null}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
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
            <Text
              style={[
                styles.periodLabel,
                selected && styles.periodLabelSelected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Section({ children, styles, title }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
              <Text numberOfLines={1} style={styles.chartLabel}>
                {point.label}
              </Text>
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
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {helper ? <Text style={styles.metricHelper}>{helper}</Text> : null}
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
      <View style={styles.habitMain}>
        <Text numberOfLines={1} style={styles.habitName}>
          {item.habit.name}
        </Text>
        <Text numberOfLines={1} style={styles.habitMeta}>
          {item.category} · {item.currentStreak} day streak · {trendLabel}
        </Text>
        <View style={styles.habitTrack}>
          <View
            style={[
              styles.habitFill,
              { width: `${clampPercentage(item.completionRate)}%` },
            ]}
          />
        </View>
      </View>
      <View style={styles.habitRate}>
        <Text style={styles.habitRateValue}>{item.completionRate}%</Text>
        <ProgressDots days={item.weeklyProgress} compact />
      </View>
    </Pressable>
  );
}

function EmptyAnalytics({ styles }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>Not enough data yet</Text>
      <Text style={styles.emptyText}>
        Complete habits for a few days to begin seeing useful trends.
      </Text>
    </View>
  );
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

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? 860 : "100%",
      padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
      paddingBottom: layout.screenBottomPadding + 88,
      width: "100%",
    },
    backButton: {
      alignSelf: "flex-start",
      marginBottom: spacing.md,
    },
    header: {
      paddingBottom: spacing.lg,
    },
    title: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: fontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
    },
    subtitle: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
      marginTop: 4,
    },
    periodControl: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      marginBottom: spacing.lg,
      padding: 4,
    },
    periodItem: {
      alignItems: "center",
      borderRadius: radius.md,
      flex: 1,
      justifyContent: "center",
      minHeight: 40,
    },
    periodItemSelected: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    periodLabel: {
      color: colors.muted,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
    },
    periodLabelSelected: {
      color: colors.text,
    },
    errorBanner: {
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.sm,
      color: colors.danger,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: 10,
      padding: 28,
    },
    loadingText: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
    },
    section: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    chart: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.lg,
    },
    chartBars: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.sm,
      height: 150,
    },
    chartColumn: {
      alignItems: "center",
      flex: 1,
      gap: spacing.sm,
      height: "100%",
      justifyContent: "flex-end",
      minWidth: 0,
    },
    chartTrack: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.sm,
      borderWidth: 1,
      flex: 1,
      justifyContent: "flex-end",
      overflow: "hidden",
      width: "100%",
    },
    chartFill: {
      backgroundColor: colors.text,
      borderRadius: radius.sm,
      minHeight: 4,
      width: "100%",
    },
    chartLabel: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      maxWidth: "100%",
    },
    metricGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    metricBlock: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      padding: spacing.lg,
    },
    metricValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 26 : 30,
      fontWeight: fontWeight.bold,
    },
    metricLabel: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      marginTop: spacing.sm,
    },
    metricHelper: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      marginTop: 3,
    },
    habitRow: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 92,
      padding: spacing.lg,
    },
    habitMain: {
      flex: 1,
      minWidth: 0,
    },
    habitName: {
      color: colors.text,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.bold,
    },
    habitMeta: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      marginTop: 4,
    },
    habitTrack: {
      backgroundColor: colors.surface,
      borderRadius: radius.pill || 999,
      height: 6,
      marginTop: spacing.md,
      overflow: "hidden",
    },
    habitFill: {
      backgroundColor: colors.text,
      borderRadius: 999,
      height: "100%",
    },
    habitRate: {
      alignItems: "flex-end",
      flexShrink: 0,
      gap: spacing.sm,
      justifyContent: "space-between",
      maxWidth: 96,
    },
    habitRateValue: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    insightText: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      color: colors.text,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
      padding: spacing.lg,
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.xl,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    emptyText: {
      color: colors.muted,
      fontSize: fontSize.body,
      lineHeight: lineHeight.body,
      marginTop: spacing.sm,
    },
    pressed: {
      opacity: 0.74,
      transform: [{ scale: 0.98 }],
    },
  });
}
