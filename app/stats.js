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
import { getProgressOverview } from "../utils/habitStats";

const PERIODS = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "all", label: "All" },
];

export default function StatsScreen() {
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

      async function loadProgress() {
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
            setError("Could not load progress. Try again.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadProgress();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const progress = useMemo(
    () => getProgressOverview(habits, period, gamification),
    [gamification, habits, period]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>
            Consistency across {getPeriodLabel(period).toLowerCase()}.
          </Text>
        </View>

        <PeriodControl period={period} setPeriod={setPeriod} styles={styles} />

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading progress...</Text>
          </View>
        ) : null}

        {!loading && progress.habitCount === 0 ? (
          <EmptyProgress styles={styles} />
        ) : null}

        {!loading && progress.habitCount > 0 ? (
          <>
            <View
              accessibilityLabel={`${progress.completionRate}% completion rate for ${getPeriodLabel(period)}`}
              accessible
              style={styles.heroMetric}
            >
              <Text style={styles.heroValue}>{progress.completionRate}%</Text>
              <Text style={styles.heroLabel}>Overall consistency</Text>
              <View style={styles.heroTrack}>
                <View
                  style={[
                    styles.heroFill,
                    { width: `${clampPercentage(progress.completionRate)}%` },
                  ]}
                />
              </View>
              <Text style={styles.heroContext}>
                {progress.completedCount} of {progress.possibleCount} possible
                completions
              </Text>
            </View>

            <Section title="This week" styles={styles}>
              <WeeklyVisual days={progress.weeklySummary} styles={styles} />
            </Section>

            <View style={styles.metricList}>
              <MetricRow
                label="Current streak"
                value={`${progress.currentLongestStreak} days`}
                styles={styles}
              />
              <MetricRow
                label="Best streak"
                value={`${progress.bestAllTimeStreak} days`}
                styles={styles}
              />
              <MetricRow
                label="Perfect days"
                value={progress.perfectDays}
                styles={styles}
              />
              <MetricRow
                label="Average per day"
                value={progress.averagePerDay}
                styles={styles}
              />
              <MetricRow
                label="XP earned"
                value={progress.totalXpEarned}
                styles={styles}
              />
            </View>

            <Section
              action={
                <Pressable
                  accessibilityLabel="Open analytics"
                  accessibilityRole="button"
                  onPress={() => router.push("/analytics")}
                  style={({ pressed }) => [
                    styles.textAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.textActionLabel}>Analytics</Text>
                </Pressable>
              }
              title="Recent history"
              styles={styles}
            >
              <HistoryGrid days={progress.historyDays} styles={styles} />
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

function Section({ action, children, styles, title }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function WeeklyVisual({ days, styles }) {
  return (
    <View style={styles.weekVisual}>
      {days.map((day) => {
        const complete = day.totalHabits > 0 && day.completedCount === day.totalHabits;
        const partial = day.completedCount > 0 && !complete;

        return (
          <View
            accessibilityLabel={`${day.label}: ${day.completedCount} of ${day.totalHabits} completed`}
            accessible
            key={day.dateKey}
            style={styles.weekDay}
          >
            <Text style={styles.weekLabel}>{day.label}</Text>
            <View
              style={[
                styles.weekDot,
                partial && styles.weekDotPartial,
                complete && styles.weekDotComplete,
              ]}
            />
            <Text style={styles.weekCount}>
              {day.completedCount}/{day.totalHabits}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function MetricRow({ label, styles, value }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metricValue}>
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
          accessibilityLabel={`${day.dateKey}: ${day.percentage}% complete`}
          accessible
          key={day.dateKey}
          style={[
            styles.historyCell,
            day.percentage > 0 && styles.historyCellPartial,
            day.percentage === 100 && styles.historyCellComplete,
          ]}
        />
      ))}
    </View>
  );
}

function EmptyProgress({ styles }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>Not enough data yet</Text>
      <Text style={styles.emptyText}>
        Create a habit and complete it for a few days to begin seeing progress.
      </Text>
    </View>
  );
}

function getPeriodLabel(period) {
  return PERIODS.find((item) => item.key === period)?.label || "Month";
}

function clampPercentage(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? layout.maxContentWidth : "100%",
      padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
      paddingBottom: layout.screenBottomPadding + 88,
      width: "100%",
    },
    header: {
      paddingBottom: spacing.lg,
      paddingTop: spacing.md,
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
      minHeight: 40,
      justifyContent: "center",
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
      fontSize: isSmallScreen ? 54 : 64,
      fontWeight: fontWeight.bold,
      lineHeight: isSmallScreen ? 60 : 70,
    },
    heroLabel: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
      marginTop: 4,
    },
    heroTrack: {
      backgroundColor: colors.surface,
      borderRadius: radius.pill || 999,
      height: 8,
      marginTop: spacing.lg,
      overflow: "hidden",
    },
    heroFill: {
      backgroundColor: colors.text,
      borderRadius: 999,
      height: "100%",
    },
    heroContext: {
      color: colors.muted,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
      marginTop: spacing.sm,
    },
    section: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    weekVisual: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: isSmallScreen ? spacing.md : spacing.lg,
    },
    weekDay: {
      alignItems: "center",
      flex: 1,
      gap: 7,
      minWidth: 0,
    },
    weekLabel: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
    },
    weekDot: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 16,
      width: 16,
    },
    weekDotPartial: {
      borderColor: colors.text,
    },
    weekDotComplete: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    weekCount: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: fontWeight.medium,
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
      gap: spacing.md,
      justifyContent: "space-between",
      minHeight: 54,
    },
    metricLabel: {
      color: colors.muted,
      flex: 1,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
    },
    metricValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.bold,
      maxWidth: "45%",
      textAlign: "right",
    },
    textAction: {
      minHeight: 36,
      justifyContent: "center",
      paddingLeft: spacing.md,
    },
    textActionLabel: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
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
    historyCellPartial: {
      borderColor: colors.text,
    },
    historyCellComplete: {
      backgroundColor: colors.text,
      borderColor: colors.text,
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
