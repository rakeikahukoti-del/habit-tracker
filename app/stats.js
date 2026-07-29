import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AnalyticsScreen, {
  AnalyticsHeader,
} from "../components/analytics/AnalyticsScreen";
import { AppIcon, AppText } from "../components/ui";
import {
  v2FontWeight,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { getGamification } from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import { getProgressOverview } from "../utils/habitStats";
import {
  getLifetimeStats,
  getPersonalRecords,
} from "../utils/personalRecords";
import { getWeeklyReview } from "../utils/weeklyReview";

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
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const [period, setPeriod] = useState("month");
  const [habits, setHabits] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weeklyDetailsExpanded, setWeeklyDetailsExpanded] = useState(false);

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
  const weeklyReview = useMemo(() => getWeeklyReview(habits), [habits]);
  const lifetimeStats = useMemo(
    () => getLifetimeStats(habits, gamification),
    [gamification, habits]
  );
  const personalRecords = useMemo(
    () => getPersonalRecords(habits, gamification).slice(0, 4),
    [gamification, habits]
  );

  return (
    <AnalyticsScreen bottomNav>
      <AnalyticsHeader
        subtitle={`Consistency across ${getPeriodLabel(period).toLowerCase()}.`}
        title="Progress"
      />

      <PeriodControl period={period} setPeriod={setPeriod} styles={styles} />

      {error ? <AppText style={styles.errorBanner}>{error}</AppText> : null}

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
          <AppText style={styles.loadingText}>Loading progress...</AppText>
        </View>
      ) : null}

      {!loading && progress.habitCount === 0 ? (
        <EmptyProgress colors={colors} styles={styles} />
      ) : null}

      {!loading && progress.habitCount > 0 ? (
        <>
          <View
            accessibilityLabel={`${progress.completionRate}% completion rate for ${getPeriodLabel(period)}. ${progress.completedCount} of ${progress.possibleCount} possible completions.`}
            accessible
            style={styles.heroMetric}
          >
            <AppText style={styles.heroValue}>{progress.completionRate}%</AppText>
            <AppText style={styles.heroLabel}>Overall consistency</AppText>
            <View style={styles.heroTrack}>
              <View
                style={[
                  styles.heroFill,
                  { width: `${clampPercentage(progress.completionRate)}%` },
                ]}
              />
            </View>
            <AppText style={styles.heroContext}>
              {progress.completedCount} of {progress.possibleCount} possible
              completions
            </AppText>
          </View>

          <Section title="Weekly review" styles={styles}>
            <WeeklyReviewCard
              colors={colors}
              expanded={weeklyDetailsExpanded}
              onToggle={() => setWeeklyDetailsExpanded((value) => !value)}
              review={weeklyReview}
              styles={styles}
            />
          </Section>

          <Section title="This week" styles={styles}>
            <WeeklyVisual days={progress.weeklySummary} styles={styles} />
          </Section>

          <Section title="Long-term progress" styles={styles}>
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
                value={lifetimeStats.totalPerfectDays}
                styles={styles}
              />
              <MetricRow
                label="Lifetime completion"
                value={`${lifetimeStats.overallCompletionRate}%`}
                styles={styles}
              />
              <MetricRow
                label="XP earned"
                value={lifetimeStats.totalXpEarned}
                styles={styles}
              />
              <MetricRow
                label="Days tracked"
                value={lifetimeStats.daysUsingMomentum}
                styles={styles}
              />
            </View>
          </Section>

          <Section title="Personal records" styles={styles}>
            {personalRecords.length > 0 ? (
              <View style={styles.recordList}>
                {personalRecords.map((record) => (
                  <RecordCard key={record.id} record={record} styles={styles} />
                ))}
              </View>
            ) : (
              <AppText style={styles.emptyInlineText}>
                Records appear after a few valid completions.
              </AppText>
            )}
          </Section>

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
                <AppText style={styles.textActionLabel}>Analytics</AppText>
              </Pressable>
            }
            title="Recent history"
            styles={styles}
          >
            <HistoryGrid days={progress.historyDays} styles={styles} />
          </Section>
        </>
      ) : null}
    </AnalyticsScreen>
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

function Section({ action, children, styles, title }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>{title}</AppText>
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
            <AppText style={styles.weekLabel}>{day.label}</AppText>
            <View
              style={[
                styles.weekDot,
                partial && styles.weekDotPartial,
                complete && styles.weekDotComplete,
              ]}
            />
            <AppText style={styles.weekCount}>
              {day.completedCount}/{day.totalHabits}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function WeeklyReviewCard({ colors, expanded, onToggle, review, styles }) {
  return (
    <View style={styles.reviewCard}>
      <View
        accessibilityLabel={`Weekly review. ${review.dateRange}. ${review.weekStatus}. ${review.summaryLabel} scheduled opportunities completed. ${review.completionRateLabel}. ${review.activeDaysLabel}. ${review.comparison.label}`}
        accessible
        style={styles.reviewHeader}
      >
        <View style={styles.reviewMain}>
          <AppText style={styles.reviewLabel}>This week</AppText>
          <AppText style={styles.reviewValue}>{review.summaryLabel}</AppText>
          <AppText style={styles.reviewCaption}>scheduled completed</AppText>
        </View>
        <View style={styles.reviewRatePill}>
          <AppText style={styles.reviewRateText}>{review.completionRateLabel}</AppText>
        </View>
      </View>

      <View style={styles.reviewStats}>
        <ReviewStat label="Active days" value={review.activeDaysLabel} styles={styles} />
        <ReviewStat
          label="Open so far"
          value={review.missedCount}
          styles={styles}
        />
        <ReviewStat
          label="Compared with last week"
          value={
            review.comparison.available
              ? review.comparison.label
              : "Needs more data"
          }
          styles={styles}
        />
      </View>

      <Pressable
        accessibilityLabel={
          expanded ? "Hide weekly review details" : "Show weekly review details"
        }
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.reviewToggle,
          pressed && styles.pressed,
        ]}
      >
        <AppText style={styles.reviewToggleText}>
          {expanded ? "Hide details" : "Show details"}
        </AppText>
        <AppIcon
          color={colors.primary}
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          strokeWidth={2}
        />
      </Pressable>

      {expanded ? <WeeklyReviewDetails review={review} styles={styles} /> : null}
    </View>
  );
}

function WeeklyReviewDetails({ review, styles }) {
  return (
    <View
      accessibilityLabel={`Weekly review details for ${review.dateRange}.`}
      accessible
      style={styles.reviewDetails}
    >
      <View style={styles.reviewDetailGrid}>
        <ReviewStat label="Date range" value={review.dateRange} styles={styles} />
        <ReviewStat
          label="Week status"
          value={review.weekStatus}
          styles={styles}
        />
        <ReviewStat
          label="Scheduled"
          value={review.possibleCount}
          styles={styles}
        />
        <ReviewStat
          label="Completed"
          value={review.completedCount}
          styles={styles}
        />
      </View>

      {review.bestHabit || review.focusHabit ? (
        <View style={styles.reviewHabitRows}>
          {review.bestHabit ? (
            <ReviewHabit
              label="Strongest"
              habit={review.bestHabit}
              styles={styles}
            />
          ) : null}
          {review.focusHabit ? (
            <ReviewHabit
              label="Focus"
              habit={review.focusHabit}
              styles={styles}
            />
          ) : null}
        </View>
      ) : (
        <AppText style={styles.reviewEmptyText}>{review.context}</AppText>
      )}

      {review.breakdown.length > 0 ? (
        <View style={styles.breakdownList}>
          <AppText style={styles.breakdownTitle}>Habit breakdown</AppText>
          {review.breakdown.map((habit) => (
            <WeeklyHabitBreakdownRow
              habit={habit}
              key={habit.id || habit.name}
              styles={styles}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function WeeklyHabitBreakdownRow({ habit, styles }) {
  return (
    <View
      accessibilityLabel={`${habit.name}. ${habit.completedCount} of ${habit.possibleCount} scheduled opportunities completed. ${habit.completionRate}%. ${habit.status}.`}
      accessible
      style={styles.breakdownRow}
    >
      <View style={styles.breakdownText}>
        <AppText numberOfLines={2} style={styles.breakdownName}>
          {habit.name}
        </AppText>
        <AppText style={styles.breakdownStatus}>{habit.status}</AppText>
      </View>
      <View style={styles.breakdownMetric}>
        <AppText style={styles.breakdownRate}>{habit.completionRate}%</AppText>
        <AppText style={styles.breakdownCount}>
          {habit.completedCount}/{habit.possibleCount}
        </AppText>
      </View>
    </View>
  );
}

function ReviewStat({ label, styles, value }) {
  return (
    <View style={styles.reviewStat}>
      <AppText style={styles.reviewStatLabel}>{label}</AppText>
      <AppText style={styles.reviewStatValue}>{value}</AppText>
    </View>
  );
}

function ReviewHabit({ habit, label, styles }) {
  return (
    <View style={styles.reviewHabitRow}>
      <AppText style={styles.reviewHabitLabel}>{label}</AppText>
      <AppText numberOfLines={1} style={styles.reviewHabitName}>
        {habit.name}
      </AppText>
      <AppText style={styles.reviewHabitMeta}>
        {habit.completedCount}/{habit.possibleCount} • {habit.completionRate}%
      </AppText>
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

function RecordCard({ record, styles }) {
  return (
    <View
      accessibilityLabel={`${record.title}. ${record.value}. ${record.description}${
        record.achievedAt ? ` Achieved on ${record.achievedAt}.` : ""
      }`}
      accessible
      style={styles.recordCard}
    >
      <View style={styles.recordHeader}>
        <AppText numberOfLines={2} style={styles.recordTitle}>
          {record.title}
        </AppText>
        <AppText style={styles.recordValue}>{record.value}</AppText>
      </View>
      <AppText style={styles.recordDescription}>{record.description}</AppText>
      {record.achievedAt ? (
        <AppText style={styles.recordDate}>{record.achievedAt}</AppText>
      ) : null}
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

function EmptyProgress({ colors, styles }) {
  return (
    <View style={styles.emptyCard}>
      <AppText style={styles.emptyTitle}>Not enough data yet</AppText>
      <AppText style={styles.emptyText}>
        Create one habit and complete it for a few days to start seeing your
        consistency.
      </AppText>
      <Pressable
        accessibilityLabel="Create a habit from Progress"
        accessibilityRole="button"
        onPress={() => router.push("/add")}
        style={({ pressed }) => [
          styles.emptyAction,
          pressed && styles.pressed,
        ]}
      >
        <AppIcon name="plus" color={colors.inverseText} size={16} />
        <AppText style={styles.emptyActionText}>Add habit</AppText>
      </Pressable>
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

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
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
      minHeight: 44,
      justifyContent: "center",
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
      fontSize: isSmallScreen ? 54 : 64,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 60 : 70,
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
      borderRadius: 999,
      height: "100%",
    },
    heroContext: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: v2Spacing.sm,
    },
    reviewCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.lg,
    },
    reviewHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    reviewMain: {
      flex: 1,
      minWidth: 0,
    },
    reviewLabel: {
      color: colors.primary,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    reviewValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
    },
    reviewCaption: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
    reviewRatePill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexShrink: 0,
      minHeight: 36,
      justifyContent: "center",
      paddingHorizontal: v2Spacing.md,
    },
    reviewRateText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    reviewStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
    },
    reviewStat: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexBasis: "48%",
      flexGrow: 1,
      minWidth: 130,
      padding: v2Spacing.md,
    },
    reviewStatLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    reviewStatValue: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: 18,
    },
    reviewToggle: {
      alignItems: "center",
      alignSelf: "flex-start",
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.xs,
      marginTop: v2Spacing.lg,
      minHeight: 40,
      paddingHorizontal: v2Spacing.md,
    },
    reviewToggleText: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    reviewDetails: {
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: v2Spacing.lg,
      paddingTop: v2Spacing.lg,
    },
    reviewDetailGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    reviewHabitRows: {
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
    },
    reviewHabitRow: {
      alignItems: "center",
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.sm,
      minHeight: 42,
      paddingTop: v2Spacing.sm,
    },
    reviewHabitLabel: {
      color: colors.muted,
      flexBasis: 92,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      textTransform: "uppercase",
    },
    reviewHabitName: {
      color: colors.text,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      minWidth: 0,
    },
    reviewHabitMeta: {
      color: colors.muted,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    reviewEmptyText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.lg,
    },
    breakdownList: {
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
    },
    breakdownTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 2,
    },
    breakdownRow: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 62,
      padding: v2Spacing.md,
    },
    breakdownText: {
      flex: 1,
      minWidth: 0,
    },
    breakdownName: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: 18,
    },
    breakdownStatus: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 16,
      marginTop: 3,
    },
    breakdownMetric: {
      alignItems: "flex-end",
      flexShrink: 0,
      minWidth: 56,
    },
    breakdownRate: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    breakdownCount: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
    section: {
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    weekVisual: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: isSmallScreen ? v2Spacing.md : v2Spacing.lg,
    },
    weekDay: {
      alignItems: "center",
      flex: 1,
      gap: 7,
      minWidth: 0,
    },
    weekLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
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
      fontWeight: v2FontWeight.medium,
    },
    metricList: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      paddingHorizontal: v2Spacing.lg,
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
    recordList: {
      gap: v2Spacing.sm,
    },
    recordCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.lg,
    },
    recordHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    recordTitle: {
      color: colors.text,
      flex: 1,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
      minWidth: 0,
    },
    recordValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: "42%",
      textAlign: "right",
    },
    recordDescription: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: v2Spacing.xs,
    },
    recordDate: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.sm,
    },
    emptyInlineText: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      padding: v2Spacing.lg,
    },
    textAction: {
      minHeight: 36,
      justifyContent: "center",
      paddingLeft: v2Spacing.md,
    },
    textActionLabel: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
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
    pressed: {
      opacity: 0.74,
      transform: [{ scale: 0.98 }],
    },
  });
}
