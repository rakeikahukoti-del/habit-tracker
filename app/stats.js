import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  AnalyticsLinks,
  HeroMetric,
  LongTermProgressSection,
  MonthlyActivityCard,
  PeriodControl,
  PersonalRecordsSection,
  WeeklyReviewCard,
  YearActivityCard,
} from "../components/stats";
import {
  AppText,
  EmptyDataCard,
  ScreenHeader,
  ScreenShell,
  Section,
} from "../components/ui";
import { v2Breakpoints, v2CompactSpacing, v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { useStatsController } from "../hooks/useStatsController";

const PERIODS = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "all", label: "All" },
];

export default function StatsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < v2Breakpoints.smallScreenMaxWidth;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    availableYears,
    error,
    lifetimeStats,
    loading,
    monthSummary,
    period,
    personalRecords,
    progress,
    selectedDay,
    selectedDayKey,
    selectedMonth,
    selectedYear,
    setPeriod,
    setSelectedDayKey,
    setSelectedMonth,
    setSelectedYear,
    setWeeklyDetailsExpanded,
    weeklyDetailsExpanded,
    weeklyReview,
    yearActivityDays,
  } = useStatsController();

  return (
    <ScreenShell bottomNav>
      <ScreenHeader
        subtitle={`Consistency across ${getPeriodLabel(period).toLowerCase()}.`}
        title="Progress"
      />

      <PeriodControl period={period} periods={PERIODS} setPeriod={setPeriod} />

      {error ? <AppText style={styles.errorBanner}>{error}</AppText> : null}

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
          <AppText style={styles.loadingText}>Loading progress...</AppText>
        </View>
      ) : null}

      {!loading && progress.habitCount === 0 ? (
        <EmptyDataCard
          ctaAccessibilityLabel="Create a habit from Progress"
          ctaLabel="Add habit"
          ctaRoute="/add"
          icon="progress"
          message="Create one habit and complete it for a few days to start seeing your consistency."
          title="Not enough data yet — a few completions will fill this in"
        />
      ) : null}

      {!loading && progress.habitCount > 0 ? (
        <>
          <HeroMetric
            completedCount={progress.completedCount}
            completionRate={progress.completionRate}
            isSmallScreen={isSmallScreen}
            periodLabel={getPeriodLabel(period)}
            possibleCount={progress.possibleCount}
          />

          <Section title="Weekly review">
            <WeeklyReviewCard
              days={progress.weeklySummary}
              expanded={weeklyDetailsExpanded}
              isSmallScreen={isSmallScreen}
              onToggle={() => setWeeklyDetailsExpanded((value) => !value)}
              review={weeklyReview}
            />
          </Section>

          <Section title="Monthly summary">
            <MonthlyActivityCard
              monthSummary={monthSummary}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          </Section>

          <Section title="Year activity">
            <YearActivityCard
              availableYears={availableYears}
              isSmallScreen={isSmallScreen}
              selectedDay={selectedDay}
              selectedDayKey={selectedDayKey}
              selectedYear={selectedYear}
              setSelectedDayKey={setSelectedDayKey}
              setSelectedYear={setSelectedYear}
              yearDays={yearActivityDays}
            />
          </Section>

          <Section title="Long-term progress">
            <LongTermProgressSection lifetimeStats={lifetimeStats} progress={progress} />
          </Section>

          <Section title="Personal records">
            <PersonalRecordsSection records={personalRecords} />
          </Section>

          <AnalyticsLinks />
        </>
      ) : null}
    </ScreenShell>
  );
}

function getPeriodLabel(period) {
  return PERIODS.find((item) => item.key === period)?.label || "Month";
}

function createStyles(colors) {
  return StyleSheet.create({
    errorBanner: {
      backgroundColor: colors.dangerSoft,
      borderRadius: v2Radius.small,
      color: colors.danger,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      marginBottom: v2Spacing.md,
      paddingHorizontal: v2CompactSpacing.md,
      paddingVertical: v2CompactSpacing.sm,
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
  });
}
