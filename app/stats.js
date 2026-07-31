import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  getActivityDayAccessibilityLabel,
  getAvailableActivityYears,
  getHeatmapIntensity,
  getMonthActivitySummary,
  getMonthLabel,
  getYearActivityDays,
} from "../utils/activityHistory";
import { getProgressOverview } from "../utils/habitStats";
import {
  getAnalyticsAggregates,
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
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDayKey, setSelectedDayKey] = useState("");

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
  const analyticsAggregates = useMemo(
    () => getAnalyticsAggregates(habits, gamification),
    [gamification, habits]
  );
  const lifetimeStats = analyticsAggregates.lifetime;
  const personalRecords = analyticsAggregates.personalRecords.slice(0, 4);
  const availableYears = useMemo(
    () => getAvailableActivityYears(habits),
    [habits]
  );
  const yearActivityDays = useMemo(
    () => getYearActivityDays(habits, selectedYear),
    [habits, selectedYear]
  );
  const selectedDay = useMemo(
    () =>
      yearActivityDays.find((day) => day.dateKey === selectedDayKey) ||
      null,
    [selectedDayKey, yearActivityDays]
  );
  const monthSummary = useMemo(
    () => getMonthActivitySummary(habits, selectedMonth),
    [habits, selectedMonth]
  );

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    setSelectedMonth((currentMonth) => {
      const today = new Date();
      const monthIndex =
        selectedYear === today.getFullYear()
          ? Math.min(currentMonth.getMonth(), today.getMonth())
          : currentMonth.getMonth();

      return new Date(selectedYear, monthIndex, 1);
    });
    setSelectedDayKey("");
  }, [selectedYear]);

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

          <Section title="Monthly summary" styles={styles}>
            <MonthlyActivityCard
              colors={colors}
              monthSummary={monthSummary}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              styles={styles}
            />
          </Section>

          <Section title="Year activity" styles={styles}>
            <YearActivityCard
              availableYears={availableYears}
              colors={colors}
              selectedDay={selectedDay}
              selectedDayKey={selectedDayKey}
              selectedYear={selectedYear}
              setSelectedDayKey={setSelectedDayKey}
              setSelectedYear={setSelectedYear}
              styles={styles}
              yearDays={yearActivityDays}
            />
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

          <View style={styles.analyticsLinkWrap}>
            <Pressable
              accessibilityLabel="Open Year in Review"
              accessibilityRole="button"
              onPress={() => router.push("/year-review")}
              style={({ pressed }) => [
                styles.analyticsLink,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.analyticsLinkText}>Year in Review</AppText>
              <AppIcon
                color={colors.primary}
                name="arrow-right"
                size={17}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="Open analytics"
              accessibilityRole="button"
              onPress={() => router.push("/analytics")}
              style={({ pressed }) => [
                styles.analyticsLink,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.analyticsLinkText}>
                View deeper analytics
              </AppText>
              <AppIcon
                color={colors.primary}
                name="arrow-right"
                size={17}
                strokeWidth={2}
              />
            </Pressable>
          </View>
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

function MonthlyActivityCard({
  colors,
  monthSummary,
  selectedMonth,
  setSelectedMonth,
  styles,
}) {
  const todayMonth = startOfMonth(new Date());
  const canGoNext = selectedMonth < todayMonth;

  function goToPreviousMonth() {
    setSelectedMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setSelectedMonth((currentMonth) => {
      const nextMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      );

      return nextMonth > todayMonth ? currentMonth : nextMonth;
    });
  }

  return (
    <View style={styles.monthCard}>
      <View style={styles.monthHeader}>
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          hitSlop={8}
          onPress={goToPreviousMonth}
          style={({ pressed }) => [
            styles.monthNavButton,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon
            color={colors.text}
            name="chevron-left"
            size={18}
            strokeWidth={2}
          />
        </Pressable>
        <View style={styles.monthHeaderText}>
          <AppText numberOfLines={1} style={styles.monthTitle}>
            {monthSummary.label}
          </AppText>
          <AppText style={styles.monthSubtitle}>
            {monthSummary.possibleCount === 0
              ? "No scheduled activity"
              : `${monthSummary.completionRate}% completion rate`}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canGoNext }}
          disabled={!canGoNext}
          hitSlop={8}
          onPress={goToNextMonth}
          style={({ pressed }) => [
            styles.monthNavButton,
            !canGoNext && styles.disabledButton,
            pressed && canGoNext && styles.pressed,
          ]}
        >
          <AppIcon
            color={canGoNext ? colors.text : colors.softText}
            name="chevron-right"
            size={18}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      <View style={styles.monthMetricGrid}>
        <CompactMetric
          label="Completed"
          styles={styles}
          value={`${monthSummary.completedCount}/${monthSummary.possibleCount}`}
        />
        <CompactMetric
          label="Perfect days"
          styles={styles}
          value={monthSummary.perfectDays}
        />
        <CompactMetric
          label="Active days"
          styles={styles}
          value={monthSummary.activeDays}
        />
        <CompactMetric
          label="Best run"
          styles={styles}
          value={monthSummary.bestStreak}
        />
      </View>

      {monthSummary.strongestHabit || monthSummary.mostImprovedHabit ? (
        <View style={styles.monthInsightList}>
          {monthSummary.strongestHabit ? (
            <AppText style={styles.monthInsightText}>
              Strongest: {monthSummary.strongestHabit.name} at{" "}
              {monthSummary.strongestHabit.completionRate}%
            </AppText>
          ) : null}
          {monthSummary.mostImprovedHabit ? (
            <AppText style={styles.monthInsightText}>
              Most improved: {monthSummary.mostImprovedHabit.name} +{monthSummary.mostImprovedHabit.improvement}%
            </AppText>
          ) : null}
        </View>
      ) : (
        <AppText style={styles.monthEmptyText}>
          Complete scheduled habits to build this month's summary.
        </AppText>
      )}
    </View>
  );
}

function YearActivityCard({
  availableYears,
  colors,
  selectedDay,
  selectedDayKey,
  selectedYear,
  setSelectedDayKey,
  setSelectedYear,
  styles,
  yearDays,
}) {
  const groupedMonths = useMemo(() => groupDaysByMonth(yearDays), [yearDays]);

  return (
    <View style={styles.activityCard}>
      {availableYears.length > 1 ? (
        <View accessibilityRole="tablist" style={styles.yearTabs}>
          {availableYears.map((year) => {
            const selected = year === selectedYear;

            return (
              <Pressable
                accessibilityLabel={`${year} activity year`}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={year}
                onPress={() => setSelectedYear(year)}
                style={({ pressed }) => [
                  styles.yearTab,
                  selected && styles.yearTabSelected,
                  pressed && styles.pressed,
                ]}
              >
                <AppText
                  style={[
                    styles.yearTabText,
                    selected && styles.yearTabTextSelected,
                  ]}
                >
                  {year}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.heatmapLegend}>
        <LegendItem label="No activity" styles={styles} variant="none" />
        <LegendItem label="Partial" styles={styles} variant="partial" />
        <LegendItem label="Complete" styles={styles} variant="complete" />
        <LegendItem label="Future" styles={styles} variant="future" />
      </View>

      {yearDays.length === 0 ? (
        <AppText style={styles.emptyInlineText}>
          Complete habits to build your activity history.
        </AppText>
      ) : (
        <View style={styles.yearGrid}>
          {groupedMonths.map((month) => (
            <View key={month.monthIndex} style={styles.monthHeatmap}>
              <AppText style={styles.monthHeatmapTitle}>
                {getMonthLabel(month.monthIndex)}
              </AppText>
              <View style={styles.monthHeatmapGrid}>
                {month.leadingBlanks.map((blank) => (
                  <View key={blank} style={styles.heatmapDaySlot} />
                ))}
                {month.days.map((day) => {
                  const selected = day.dateKey === selectedDayKey;
                  const intensity = getHeatmapIntensity(day);

                  return (
                    <View key={day.dateKey} style={styles.heatmapDaySlot}>
                      <Pressable
                        accessibilityLabel={getActivityDayAccessibilityLabel(day)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        hitSlop={4}
                        onPress={() =>
                          setSelectedDayKey((current) =>
                            current === day.dateKey ? "" : day.dateKey
                          )
                        }
                        style={({ pressed }) => [
                          styles.heatmapCell,
                          styles[`heatmapCell_${intensity}`],
                          selected && styles.heatmapCellSelected,
                          pressed && styles.pressed,
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      {selectedDay ? (
        <SelectedDayCard selectedDay={selectedDay} styles={styles} />
      ) : (
        <AppText style={styles.activityHint}>
          Tap any day to inspect scheduled and completed habits.
        </AppText>
      )}
    </View>
  );
}

function CompactMetric({ label, styles, value }) {
  return (
    <View style={styles.compactMetric}>
      <AppText style={styles.compactMetricValue}>{value}</AppText>
      <AppText style={styles.compactMetricLabel}>{label}</AppText>
    </View>
  );
}

function LegendItem({ label, styles, variant }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, styles[`heatmapCell_${variant}`]]} />
      <AppText style={styles.legendLabel}>{label}</AppText>
    </View>
  );
}

function SelectedDayCard({ selectedDay, styles }) {
  return (
    <View
      accessibilityLabel={getActivityDayAccessibilityLabel(selectedDay)}
      accessible
      style={styles.selectedDayCard}
    >
      <AppText style={styles.selectedDayTitle}>
        {formatSelectedDate(selectedDay.dateKey)}
      </AppText>
      <AppText style={styles.selectedDaySummary}>
        {getSelectedDaySummary(selectedDay)}
      </AppText>
      {selectedDay.habitNames.length > 0 ? (
        <AppText numberOfLines={3} style={styles.selectedDayHabits}>
          {selectedDay.habitNames.slice(0, 4).join(", ")}
          {selectedDay.habitNames.length > 4 ? "..." : ""}
        </AppText>
      ) : null}
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

function groupDaysByMonth(days) {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const monthDays = days.filter((day) => {
      const [, month] = day.dateKey.split("-").map(Number);

      return month === monthIndex + 1;
    });
    const firstDay = monthDays[0]
      ? dateKeyToLocalDate(monthDays[0].dateKey).getDay()
      : 0;

    return {
      days: monthDays,
      leadingBlanks: Array.from(
        { length: firstDay },
        (_, index) => `blank-${monthIndex}-${index}`
      ),
      monthIndex,
    };
  });
}

function getSelectedDaySummary(day) {
  if (day.state === "future") {
    return "Future date.";
  }

  if (day.state === "beforeTracking") {
    return "Before activity tracking started.";
  }

  if (day.state === "unscheduled") {
    return "No habits scheduled.";
  }

  if (day.isPerfectDay) {
    return `Perfect day: ${day.completedCount} of ${day.scheduledCount} complete.`;
  }

  return `${day.completedCount} of ${day.scheduledCount} scheduled habits complete (${day.completionRate}%).`;
}

function formatSelectedDate(dateKey) {
  return dateKeyToLocalDate(dateKey).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dateKeyToLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
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
    monthCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.lg,
    },
    monthHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.sm,
      marginBottom: v2Spacing.lg,
    },
    monthNavButton: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 42,
      minWidth: 42,
    },
    disabledButton: {
      opacity: 0.36,
    },
    monthHeaderText: {
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },
    monthTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
      textAlign: "center",
    },
    monthSubtitle: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
      textAlign: "center",
    },
    monthMetricGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    compactMetric: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexBasis: "47%",
      flexGrow: 1,
      minHeight: 70,
      minWidth: 120,
      padding: v2Spacing.md,
    },
    compactMetricValue: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.sectionTitle.lineHeight,
    },
    compactMetricLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: 3,
      textTransform: "uppercase",
    },
    monthInsightList: {
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: v2Spacing.xs,
      marginTop: v2Spacing.lg,
      paddingTop: v2Spacing.md,
    },
    monthInsightText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
    },
    monthEmptyText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: v2Spacing.lg,
    },
    activityCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: isSmallScreen ? v2Spacing.md : v2Spacing.lg,
    },
    yearTabs: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      marginBottom: v2Spacing.lg,
      padding: 4,
    },
    yearTab: {
      alignItems: "center",
      borderRadius: v2Radius.small,
      flexGrow: 1,
      justifyContent: "center",
      minHeight: 38,
      minWidth: 72,
      paddingHorizontal: v2Spacing.sm,
    },
    yearTabSelected: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
    },
    yearTabText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    yearTabTextSelected: {
      color: colors.text,
    },
    heatmapLegend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      marginBottom: v2Spacing.lg,
    },
    legendItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      minHeight: 24,
    },
    legendSwatch: {
      borderRadius: 5,
      height: 14,
      width: 14,
    },
    legendLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    yearGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.md,
    },
    monthHeatmap: {
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      minWidth: isSmallScreen ? "100%" : 150,
    },
    monthHeatmapTitle: {
      color: colors.text,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: v2Spacing.xs,
      textTransform: "uppercase",
    },
    monthHeatmapGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    heatmapDaySlot: {
      padding: 2,
      width: `${100 / 7}%`,
    },
    heatmapCell: {
      aspectRatio: 1,
      borderRadius: 5,
      borderWidth: 1,
      minHeight: isSmallScreen ? 18 : 20,
      width: "100%",
    },
    heatmapCell_none: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      opacity: 0.58,
    },
    heatmapCell_empty: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    heatmapCell_partial: {
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    },
    heatmapCell_mostly: {
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
      borderWidth: 2,
    },
    heatmapCell_complete: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    heatmapCell_future: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      opacity: 0.28,
    },
    heatmapCellSelected: {
      borderColor: colors.text,
      borderWidth: 2,
      transform: [{ scale: 1.08 }],
    },
    activityHint: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: v2Spacing.lg,
    },
    selectedDayCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      marginTop: v2Spacing.lg,
      padding: v2Spacing.md,
    },
    selectedDayTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
    },
    selectedDaySummary: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: 4,
    },
    selectedDayHabits: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: v2Spacing.xs,
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
    analyticsLinkWrap: {
      alignItems: "flex-start",
      marginBottom: v2Spacing.xl,
    },
    analyticsLink: {
      alignItems: "center",
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.xs,
      minHeight: 42,
      paddingHorizontal: v2Spacing.md,
    },
    analyticsLinkText: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
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
