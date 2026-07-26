import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import ProgressDots from "../../components/ProgressDots";
import { BackIcon, IconButton } from "../../components/ui";
import {
  DEFAULT_HABIT_EMOJI,
} from "../../constants/habitOptions";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  radius,
  spacing,
} from "../../constants/typography";
import { useTheme } from "../../context/ThemeContext";
import { getHabits } from "../../storage/habitsStorage";
import { getHabitPerformance, getTodayKey, toDateKey } from "../../utils/habitStats";

export default function IndividualAnalyticsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen, isTablet }),
    [colors, isSmallScreen, isTablet]
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <IconButton
          accessibilityLabel="Back to Analytics"
          onPress={goBackToAnalytics}
          style={styles.backButton}
        >
          <BackIcon />
        </IconButton>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading habit analytics...</Text>
          </View>
        ) : null}

        {!loading && !habit ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Habit not found</Text>
            <Text style={styles.emptyText}>
              This habit may have been deleted.
            </Text>
          </View>
        ) : null}

        {!loading && habit && analytics ? (
          <>
            <View style={styles.header}>
              <View style={styles.iconBadge}>
                <Text style={styles.icon}>{habit.emoji || DEFAULT_HABIT_EMOJI}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.category}>{analytics.category}</Text>
                <Text style={styles.title} numberOfLines={3}>
                  {habit.name}
                </Text>
              </View>
            </View>

            <View
              accessibilityLabel={`${analytics.completionRate}% completion rate in the last 30 days`}
              accessible
              style={styles.heroMetric}
            >
              <Text style={styles.heroValue}>{analytics.completionRate}%</Text>
              <Text style={styles.heroLabel}>Completion rate</Text>
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
      </ScrollView>
    </SafeAreaView>
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

function MetricRow({ label, styles, value }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        numberOfLines={1}
        style={styles.metricValue}
      >
        {value}
      </Text>
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
            <Text style={styles.trendLabel}>{point.label}</Text>
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

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? layout.formMaxWidth : "100%",
      padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
      paddingBottom: layout.screenBottomPadding,
      width: "100%",
    },
    backButton: {
      alignSelf: "flex-start",
      marginBottom: spacing.md,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    iconBadge: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
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
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      marginBottom: 4,
    },
    title: {
      color: colors.text,
      fontSize: isSmallScreen ? 24 : 28,
      fontWeight: fontWeight.bold,
      lineHeight: isSmallScreen ? 30 : 34,
    },
    heroMetric: {
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginBottom: spacing.xl,
      paddingVertical: spacing.xl,
    },
    heroValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 50 : 58,
      fontWeight: fontWeight.bold,
      lineHeight: isSmallScreen ? 56 : 64,
    },
    heroLabel: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      marginTop: 4,
    },
    heroTrack: {
      backgroundColor: colors.surface,
      borderRadius: 999,
      height: 8,
      marginTop: spacing.lg,
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
      borderRadius: radius.lg,
      borderWidth: 1,
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
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
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      minWidth: 0,
    },
    metricValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.bold,
      maxWidth: "52%",
      textAlign: "right",
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
    weekCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.lg,
    },
    historyGrid: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
      padding: spacing.lg,
    },
    historyCell: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.sm,
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
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      height: 138,
      padding: spacing.lg,
    },
    trendColumn: {
      alignItems: "center",
      flex: 1,
      gap: spacing.sm,
      height: "100%",
      justifyContent: "flex-end",
    },
    trendTrack: {
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
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
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
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
  });
}
