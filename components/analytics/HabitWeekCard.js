import HabitStatCard from "./HabitStatCard";

// Merged HabitConsistencyCard + HabitWeekCard onto the shared HabitStatCard
// template (Phase 13 Initiative 2) - the two were near-identical (label /
// big bold value / top-right pill / two label-value rows), down to each
// file independently defining its own identically-named HabitWeekRow
// sub-component. Headline is pattern.summaryLabel ("5 of 7 scheduled
// completed") rather than the old Consistency card's 30-day completion
// rate, since that rate is already the very next section up on this
// screen (HabitHeroSection) - repeating it as this card's headline too
// would just be a second copy of the same number one section apart.
//
// Also resolves Phase 12 Finding E: HabitConsistencyCard's old pill read
// strength.trend, a *rolling* 7-vs-previous-7-day comparison
// (getTrendComparison); HabitWeekCard's "Compared with last week" row read
// pattern.comparison, a *calendar* week-to-date comparison
// (getWeekToDateDays) - same question, two different windows, with no
// guarantee they'd agree. Only the calendar version survives here, matching
// WeeklyReviewCard's convention on the Progress screen. getTrendComparison
// itself is untouched - utils/insightsDashboard.js's getInsightsDashboard
// still calls it directly for the aggregate "rollingTrend" InsightsDashboardSection
// relies on, and getHabitStrength (this screen's `strength` prop) still
// computes trend as part of its normal return shape for any other consumer;
// this card just stops reading that one field.
//
// "Last 7 days" (strength.weeklyRate, schedule-filtered) is kept as its own
// row - a rolling-window rate is a different data point from the
// week-to-date comparison above it, not a duplicate of it.
export default function HabitWeekCard({ isSmallScreen, pattern, strength }) {
  const comparisonValue = pattern.comparison.available
    ? pattern.comparison.label
    : "Needs more data";
  const rows = [
    { key: "comparison", label: "Compared with last week", value: comparisonValue },
  ];

  if (strength) {
    rows.push({
      key: "weekly-rate",
      label: "Last 7 days",
      value: `${strength.weeklyRate}%`,
    });
  }

  rows.push({
    key: "next-scheduled",
    label: "Next scheduled",
    value: pattern.nextScheduled.label,
  });

  if (strength) {
    rows.push({
      key: "ranking-data",
      label: "Ranking data",
      value: strength.hasSufficientData
        ? `${strength.possibleCount} scheduled days`
        : "Still building",
    });
  }

  const accessibilityLabel = strength
    ? `This week. ${pattern.summaryLabel} scheduled days completed. ${pattern.completionRateLabel}. ${comparisonValue}. Last 7 days ${strength.weeklyRate} percent. ${pattern.nextScheduled.label}.`
    : `This week. ${pattern.summaryLabel} scheduled days completed. ${pattern.completionRateLabel}. ${comparisonValue}. ${pattern.nextScheduled.label}.`;

  return (
    <HabitStatCard
      accessibilityLabel={accessibilityLabel}
      isSmallScreen={isSmallScreen}
      label="Scheduled completed"
      pill={pattern.completionRateLabel}
      rows={rows}
      value={pattern.summaryLabel}
    />
  );
}
