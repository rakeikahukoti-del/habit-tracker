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
  getHabitAnalyticsGuidance,
  getHabitAnalyticsReadiness,
} from "../../utils/analyticsReadiness";
import {
  getHabitPerformance,
  getTodayKey,
  toDateKey,
} from "../../utils/habitStats";
import { getHabitStrength } from "../../utils/insightsDashboard";
import { getHabitMilestones } from "../../utils/personalRecords";
import { getHabitWeeklyPattern } from "../../utils/weeklyReview";

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
  const readiness = useMemo(
    () => (habit ? getHabitAnalyticsReadiness(habit) : null),
    [habit]
  );
  const guidance = useMemo(
    () => getHabitAnalyticsGuidance(readiness),
    [readiness]
  );
  const weeklyPattern = useMemo(
    () => (habit ? getHabitWeeklyPattern(habit) : null),
    [habit]
  );
  const focusGuidance = useMemo(
    () => getHabitFocusGuidance(guidance, weeklyPattern),
    [guidance, weeklyPattern]
  );
  const milestones = useMemo(
    () => (habit ? getHabitMilestones(habit) : null),
    [habit]
  );
  const habitStrength = useMemo(
    () => (habit ? getHabitStrength(habit) : null),
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

        {!loading && habit && analytics && readiness && weeklyPattern ? (
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

            {readiness.state === "ready" ? (
              <View
                accessibilityLabel={`${analytics.completionRate}% completion rate in the last 30 scheduled days`}
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
            ) : (
              <HabitInsightBuildingCard
                guidance={guidance}
                readiness={readiness}
                styles={styles}
              />
            )}

            {habitStrength ? (
              <HabitConsistencyCard strength={habitStrength} styles={styles} />
            ) : null}

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

            <View
              accessibilityLabel={`Focus guidance. ${focusGuidance}`}
              accessible
              style={styles.guidanceCard}
            >
              <AppText style={styles.guidanceLabel}>Focus</AppText>
              <AppText style={styles.guidanceText}>{focusGuidance}</AppText>
            </View>

            <Section title="This week" styles={styles}>
              <HabitWeekCard pattern={weeklyPattern} styles={styles} />
            </Section>

            {milestones ? (
              <Section title="Milestones" styles={styles}>
                <MilestoneCard milestones={milestones} styles={styles} />
              </Section>
            ) : null}

            <Section title="Last 7 days" styles={styles}>
              <View style={styles.weekCard}>
                <ProgressDots days={analytics.weeklyProgress} compact />
              </View>
            </Section>

            <Section title="Last 30 days" styles={styles}>
              <HistoryGrid days={historyDays} styles={styles} />
            </Section>

            {readiness.state === "ready" ? (
              <Section title="Trend" styles={styles}>
                <MiniTrend points={analytics.trend} styles={styles} />
              </Section>
            ) : null}
          </>
        ) : null}
    </AnalyticsScaffold>
  );
}

function HabitInsightBuildingCard({ guidance, readiness, styles }) {
  const title =
    readiness.state === "empty" ? "No completions yet" : "Insight is building";

  return (
    <View
      accessibilityLabel={`${title}. ${readiness.totalCompletions} completions, ${readiness.activeDays} active days, ${readiness.scheduledOpportunities} scheduled days. ${guidance}`}
      accessible
      style={styles.buildingCard}
    >
      <AppText style={styles.emptyTitle}>{title}</AppText>
      <AppText style={styles.emptyText}>
        {readiness.state === "empty"
          ? "Complete this habit on a scheduled day to begin its progress story."
          : "A few more real completions will make this habit's pattern clearer."}
      </AppText>

      <View style={styles.buildingTrack}>
        <View style={[styles.buildingFill, { width: `${readiness.progress}%` }]} />
      </View>
      <AppText style={styles.buildingProgressText}>
        {readiness.progress}% toward stronger insight
      </AppText>

      <View style={styles.buildingStats}>
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
        <BuildingStat
          label="Scheduled"
          styles={styles}
          value={readiness.scheduledOpportunities}
        />
      </View>
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

function HabitConsistencyCard({ strength, styles }) {
  return (
    <View
      accessibilityLabel={`Habit consistency. Last 30 days ${strength.completionRate} percent. Last 7 days ${strength.weeklyRate} percent. Trend ${getHabitTrendLabel(strength.trend)}.`}
      accessible
      style={styles.consistencyCard}
    >
      <View style={styles.consistencyHeader}>
        <View style={styles.consistencyMain}>
          <AppText style={styles.consistencyLabel}>Consistency</AppText>
          <AppText style={styles.consistencyValue}>
            {strength.completionRate}%
          </AppText>
        </View>
        <AppText style={styles.consistencyPill}>
          {getHabitTrendLabel(strength.trend)}
        </AppText>
      </View>
      <View style={styles.consistencyRows}>
        <HabitWeekRow
          label="Last 7 days"
          styles={styles}
          value={`${strength.weeklyRate}%`}
        />
        <HabitWeekRow
          label="Ranking data"
          styles={styles}
          value={
            strength.hasSufficientData
              ? `${strength.possibleCount} scheduled days`
              : "Still building"
          }
        />
      </View>
    </View>
  );
}

function HabitWeekCard({ pattern, styles }) {
  return (
    <View
      accessibilityLabel={`This week. ${pattern.summaryLabel} scheduled days completed. ${pattern.completionRateLabel}. ${pattern.comparison.label}. ${pattern.nextScheduled.label}.`}
      accessible
      style={styles.habitWeekCard}
    >
      <View style={styles.habitWeekHeader}>
        <View style={styles.habitWeekMain}>
          <AppText style={styles.habitWeekLabel}>Scheduled completed</AppText>
          <AppText style={styles.habitWeekValue}>{pattern.summaryLabel}</AppText>
        </View>
        <View style={styles.habitWeekRatePill}>
          <AppText style={styles.habitWeekRateText}>
            {pattern.completionRateLabel}
          </AppText>
        </View>
      </View>
      <View style={styles.habitWeekRows}>
        <HabitWeekRow
          label="Compared with last week"
          styles={styles}
          value={
            pattern.comparison.available
              ? pattern.comparison.label
              : "Needs more data"
          }
        />
        <HabitWeekRow
          label="Next scheduled"
          styles={styles}
          value={pattern.nextScheduled.label}
        />
      </View>
    </View>
  );
}

function HabitWeekRow({ label, styles, value }) {
  return (
    <View style={styles.habitWeekRow}>
      <AppText style={styles.habitWeekRowLabel}>{label}</AppText>
      <AppText style={styles.habitWeekRowValue}>{value}</AppText>
    </View>
  );
}

function MilestoneCard({ milestones, styles }) {
  const nextLabel = milestones.nextMilestone
    ? `${milestones.completionCount}/${milestones.nextMilestone}`
    : `${milestones.completionCount}`;

  return (
    <View
      accessibilityLabel={`Habit milestones. ${milestones.completionCount} completions. ${
        milestones.nextMilestone
          ? `${milestones.nextMilestone - milestones.completionCount} more to reach ${milestones.nextMilestone}.`
          : "All tracked milestones reached."
      }`}
      accessible
      style={styles.milestoneCard}
    >
      <View style={styles.milestoneHeader}>
        <View style={styles.milestoneMain}>
          <AppText style={styles.milestoneLabel}>Total completions</AppText>
          <AppText style={styles.milestoneValue}>{nextLabel}</AppText>
        </View>
        <AppText style={styles.milestonePill}>
          {milestones.nextMilestone ? "Next" : "Complete"}
        </AppText>
      </View>
      <View style={styles.milestoneTrack}>
        <View
          style={[
            styles.milestoneFill,
            { width: `${milestones.progressToNext}%` },
          ]}
        />
      </View>
      <View style={styles.milestoneChips}>
        {milestones.milestones.map((milestone) => (
          <View
            key={milestone.target}
            style={[
              styles.milestoneChip,
              milestone.completed && styles.milestoneChipComplete,
            ]}
          >
            <AppText
              style={[
                styles.milestoneChipText,
                milestone.completed && styles.milestoneChipTextComplete,
              ]}
            >
              {milestone.target}
            </AppText>
          </View>
        ))}
      </View>
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

function MetricRow({ label, styles, value }) {
  return (
    <View style={styles.metricRow}>
      <AppText style={styles.metricLabel}>{label}</AppText>
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={2}
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

function getHabitFocusGuidance(guidance, weeklyPattern) {
  if (!weeklyPattern?.nextScheduled?.available) {
    return guidance;
  }

  if (weeklyPattern.nextScheduled.timing === "today") {
    return "This habit is scheduled today.";
  }

  if (weeklyPattern.hasScheduledData && weeklyPattern.completionRate === 100) {
    return `${weeklyPattern.nextScheduled.label}. This week is complete so far.`;
  }

  return weeklyPattern.nextScheduled.label;
}

function getHabitTrendLabel(trend) {
  if (trend?.direction === "improving") {
    return "Improving";
  }

  if (trend?.direction === "declining") {
    return "Declining";
  }

  if (trend?.direction === "insufficient") {
    return "Building";
  }

  return "Stable";
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
    consistencyCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      marginBottom: v2Spacing.xl,
      padding: v2Spacing.lg,
    },
    consistencyHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    consistencyMain: {
      flex: 1,
      minWidth: 0,
    },
    consistencyLabel: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    consistencyValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
      marginTop: 2,
    },
    consistencyPill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: v2Spacing.md,
      paddingVertical: 7,
    },
    consistencyRows: {
      gap: v2Spacing.sm,
      marginTop: v2Spacing.md,
    },
    buildingCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      marginBottom: v2Spacing.xl,
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
    metricRow: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
      minHeight: 54,
      paddingVertical: v2Spacing.sm,
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
      lineHeight: v2Typography.body.lineHeight,
      maxWidth: "48%",
      textAlign: "right",
    },
    section: {
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
    },
    habitWeekCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.lg,
    },
    milestoneCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.lg,
    },
    milestoneHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    milestoneMain: {
      flex: 1,
      minWidth: 0,
    },
    milestoneLabel: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    milestoneValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
      marginTop: 2,
    },
    milestonePill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: v2Spacing.md,
      paddingVertical: 7,
    },
    milestoneTrack: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      height: 8,
      marginTop: v2Spacing.md,
      overflow: "hidden",
    },
    milestoneFill: {
      backgroundColor: colors.primary,
      borderRadius: v2Radius.pill,
      height: "100%",
    },
    milestoneChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.xs,
      marginTop: v2Spacing.md,
    },
    milestoneChip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      minHeight: 30,
      justifyContent: "center",
      paddingHorizontal: v2Spacing.md,
    },
    milestoneChipComplete: {
      borderColor: colors.primary,
    },
    milestoneChipText: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    milestoneChipTextComplete: {
      color: colors.text,
    },
    habitWeekHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    habitWeekMain: {
      flex: 1,
      minWidth: 0,
    },
    habitWeekLabel: {
      color: colors.primary,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    habitWeekValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
    },
    habitWeekRatePill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexShrink: 0,
      minHeight: 34,
      justifyContent: "center",
      paddingHorizontal: v2Spacing.md,
    },
    habitWeekRateText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    habitWeekRows: {
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
      paddingTop: v2Spacing.md,
    },
    habitWeekRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.xs,
      justifyContent: "space-between",
    },
    habitWeekRowLabel: {
      color: colors.muted,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      minWidth: 130,
    },
    habitWeekRowValue: {
      color: colors.text,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: 18,
      minWidth: 130,
      textAlign: "right",
    },
    guidanceCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      marginBottom: v2Spacing.xl,
      padding: v2Spacing.lg,
    },
    guidanceLabel: {
      color: colors.primary,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    guidanceText: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
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
