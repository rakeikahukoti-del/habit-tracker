import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import AnalyticsScaffold from "../../components/analytics/AnalyticsScreen";
import ProgressDots from "../../components/ProgressDots";
import { AppText, BackIcon, IconButton } from "../../components/ui";
import { DEFAULT_HABIT_EMOJI } from "../../constants/habitOptions";
import {
  v2FontWeight,
  v2Layout,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../../src/design";
import { useTheme } from "../../context/ThemeContext";
import { getHabits } from "../../storage/habitsStorage";
import {
  getHabitPerformance,
  getTodayKey,
  toDateKey,
} from "../../utils/habitStats";

export default function IndividualAnalyticsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const [habit, setHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadHabit() {
        try {
          setError("");
          const habits = await getHabits();
          const foundHabit = habits.find((item) => item.id === id);

          if (!isActive) {
            return;
          }

          setHabit(foundHabit || null);
        } catch {
          if (isActive) {
            setError("Could not load habit analytics. Try again.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadHabit();

      return () => {
        isActive = false;
      };
    }, [id])
  );

  const analytics = useMemo(
    () => (habit ? getHabitPerformance(habit, "month") : null),
    [habit]
  );
  const historyDays = useMemo(
    () => (habit ? getLastThirtyDays(habit) : []),
    [habit]
  );

  return (
    <AnalyticsScaffold maxWidth={v2Layout.formMaxWidth}>
        <IconButton
          accessibilityLabel="Back to Analytics"
          color={colors.text}
          onPress={goBackToAnalytics}
          style={styles.backButton}
        >
          <BackIcon color={colors.text} />
        </IconButton>

        {error ? <AppText style={styles.errorBanner}>{error}</AppText> : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <AppText style={styles.loadingText}>Loading habit analytics...</AppText>
          </View>
        ) : null}

        {!loading && !habit ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Habit not found</AppText>
            <AppText style={styles.emptyText}>
              This habit may have been deleted.
            </AppText>
          </View>
        ) : null}

        {!loading && habit && analytics ? (
          <>
            <View style={styles.header}>
              <View style={styles.iconBadge}>
                <AppText style={styles.icon}>{habit.emoji || DEFAULT_HABIT_EMOJI}</AppText>
              </View>
              <View style={styles.headerText}>
                <AppText style={styles.category}>{analytics.category}</AppText>
                <AppText style={styles.title} numberOfLines={3}>
                  {habit.name}
                </AppText>
              </View>
            </View>

            <View
              accessibilityLabel={`${analytics.completionRate}% completion rate in the last 30 days`}
              accessible
              style={styles.heroMetric}
            >
              <AppText style={styles.heroValue}>{analytics.completionRate}%</AppText>
              <AppText style={styles.heroLabel}>Completion rate</AppText>
              <View style={styles.heroTrack}>
                <View
                  style={[
                    styles.heroFill,
                    { width: `${analytics.completionRate}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.metricList}>
              <MetricRow
                label="Current streak"
                value={analytics.currentStreak}
                styles={styles}
              />
              <MetricRow
                label="Best streak"
                value={analytics.bestStreak}
                styles={styles}
              />
              <MetricRow
                label="Total completions"
                value={analytics.completedCount}
                styles={styles}
              />
            </View>

            <Section title="Last 7 days" styles={styles}>
              <View style={styles.weekCard}>
                <ProgressDots days={analytics.weeklyProgress} compact />
              </View>
            </Section>

            <Section title="Last 30 days" styles={styles}>
              <HistoryGrid days={historyDays} styles={styles} />
            </Section>

            <Section title="Trend" styles={styles}>
              <MiniTrend points={analytics.trend} styles={styles} />
            </Section>
          </>
        ) : null}
    </AnalyticsScaffold>
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

function MetricRow({ label, styles, value }) {
  return (
    <View style={styles.metricRow}>
      <AppText style={styles.metricLabel}>{label}</AppText>
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        numberOfLines={1}
        style={styles.metricValue}
      >
        {value}
      </AppText>
    </View>
  );
}

function HistoryGrid({ days, styles }) {
  return (
    <View style={styles.historyGrid}>
      {days.map((day) => (
        <View
          accessibilityLabel={`${day.dateKey}: ${day.completed ? "completed" : "not completed"}`}
          accessible
          key={day.dateKey}
          style={[
            styles.historyCell,
            day.completed && styles.historyCellComplete,
            day.isToday && styles.historyCellToday,
          ]}
        />
      ))}
    </View>
  );
}

function MiniTrend({ points, styles }) {
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

function getLastThirtyDays(habit) {
  const completedSet = new Set(habit.completedDates || []);
  const today = startOfDay(new Date());
  const todayKey = getTodayKey();

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    const dateKey = toDateKey(date);

    return {
      completed: completedSet.has(dateKey),
      dateKey,
      isToday: dateKey === todayKey,
    };
  });
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function goBackToAnalytics() {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }

  router.replace("/analytics");
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    backButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderColor: colors.border,
      marginBottom: v2Spacing.md,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
    },
    iconBadge: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      height: 52,
      justifyContent: "center",
      width: 52,
    },
    icon: {
      fontSize: 26,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    category: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
    },
    title: {
      color: colors.text,
      fontSize: isSmallScreen ? 24 : 28,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 30 : 34,
    },
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
      fontSize: isSmallScreen ? 50 : 58,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 56 : 64,
    },
    heroLabel: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 4,
    },
    heroTrack: {
      backgroundColor: colors.surface,
      borderRadius: 999,
      height: 8,
      marginTop: v2Spacing.lg,
      overflow: "hidden",
    },
    heroFill: {
      backgroundColor: colors.text,
      borderRadius: 999,
      height: "100%",
    },
    metricList: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      marginBottom: v2Spacing.xl,
      paddingHorizontal: v2Spacing.lg,
    },
    metricRow: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: 54,
    },
    metricLabel: {
      color: colors.muted,
      flex: 1,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      minWidth: 0,
    },
    metricValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: "52%",
      textAlign: "right",
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
    weekCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.lg,
    },
    historyGrid: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
      padding: v2Spacing.lg,
    },
    historyCell: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.small,
      borderWidth: 1,
      height: isSmallScreen ? 22 : 25,
      width: isSmallScreen ? 22 : 25,
    },
    historyCellComplete: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    historyCellToday: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
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
    },
  });
}
