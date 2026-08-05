import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from "react-native";
import AnalyticsScreen, {
  AnalyticsHeader,
} from "../components/analytics/AnalyticsScreen";
import {
  AnalyticsLinks,
  EmptyProgress,
  HeroMetric,
  LongTermProgressSection,
  MonthlyActivityCard,
  PeriodControl,
  PersonalRecordsSection,
  Section,
  WeeklyReviewCard,
  WeeklyVisual,
  YearActivityCard,
} from "../components/stats";
import { AppText } from "../components/ui";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../src/design";
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
  const isSmallScreen = width < 380;
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
    <AnalyticsScreen bottomNav>
      <AnalyticsHeader
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

      {!loading && progress.habitCount === 0 ? <EmptyProgress /> : null}

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
              expanded={weeklyDetailsExpanded}
              isSmallScreen={isSmallScreen}
              onToggle={() => setWeeklyDetailsExpanded((value) => !value)}
              review={weeklyReview}
            />
          </Section>

          <Section title="This week">
            <WeeklyVisual days={progress.weeklySummary} isSmallScreen={isSmallScreen} />
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
    </AnalyticsScreen>
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
      paddingHorizontal: 14,
      paddingVertical: 10,
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
