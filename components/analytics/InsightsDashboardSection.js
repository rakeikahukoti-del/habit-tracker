import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Section from "./Section";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { PRESSED_STATS_STYLE } from "../home/pressedStyles";

export default function InsightsDashboardSection({ dashboard, isSmallScreen }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const sections = new Set(dashboard.dashboardSections);

  return (
    <Section title="Progress signals">
      <OverviewInsightsCard dashboard={dashboard} styles={styles} />

      {sections.has("insights") ? (
        <View style={styles.insightCardStack}>
          {dashboard.insightCards.map((card) => (
            <InsightCard card={card} key={card.id} styles={styles} />
          ))}
        </View>
      ) : null}

      {sections.has("weekly-comparison") || sections.has("trends") ? (
        <View style={styles.comparisonGrid}>
          <ComparisonCard
            comparison={dashboard.weeklyComparison}
            label="This week"
            styles={styles}
          />
          <ComparisonCard
            comparison={dashboard.monthlyComparison}
            label="This month"
            styles={styles}
          />
        </View>
      ) : null}

      {sections.has("habit-rankings") ? (
        <View style={styles.rankingGrid}>
          <HabitRankingCard
            emptyText="Complete more scheduled days to rank habits."
            habits={dashboard.habitRankings.strongest}
            label="Strongest"
            styles={styles}
          />
          <HabitRankingCard
            emptyText="No habit needs extra attention right now."
            habits={dashboard.habitRankings.needsAttention}
            label="Needs attention"
            styles={styles}
          />
        </View>
      ) : null}

      {sections.has("personal-bests") ? (
        <PersonalBestStrip records={dashboard.personalBests} styles={styles} />
      ) : null}

      {sections.has("empty-state") ? (
        <AppText style={styles.dashboardEmptyText}>
          {dashboard.readiness.message}
        </AppText>
      ) : null}
    </Section>
  );
}

function OverviewInsightsCard({ dashboard, styles }) {
  return (
    <View
      accessibilityLabel={`Insights overview. Overall consistency ${dashboard.consistency.overall.rate} percent. Last 30 days ${dashboard.consistency.last30Days.rate} percent. ${dashboard.readiness.message}`}
      accessible
      style={styles.dashboardCard}
    >
      <View style={styles.dashboardHeaderRow}>
        <View style={styles.dashboardHeaderText}>
          <AppText style={styles.dashboardEyebrow}>Consistency</AppText>
          <AppText style={styles.dashboardTitle}>
            {dashboard.consistency.last30Days.rate}% consistency
          </AppText>
          <AppText style={styles.dashboardSubtitle}>
            Last 30 scheduled days
          </AppText>
        </View>
        <View style={styles.dashboardPill}>
          <AppText style={styles.dashboardPillText}>
            {dashboard.totals.totalCompletions} done
          </AppText>
        </View>
      </View>
      <View style={styles.dashboardMetricRow}>
        <SmallDashboardMetric
          label="Overall"
          styles={styles}
          value={`${dashboard.consistency.overall.rate}%`}
        />
        <SmallDashboardMetric
          label="90 days"
          styles={styles}
          value={`${dashboard.consistency.last90Days.rate}%`}
        />
        <SmallDashboardMetric
          label="Streak days"
          styles={styles}
          value={`${dashboard.totals.totalStreakDaysAccumulated}`}
        />
      </View>
    </View>
  );
}

function SmallDashboardMetric({ label, styles, value }) {
  return (
    <View
      accessibilityLabel={`${label}: ${value}`}
      accessible
      style={styles.smallDashboardMetric}
    >
      <AppText style={styles.smallDashboardValue}>{value}</AppText>
      <AppText style={styles.smallDashboardLabel}>{label}</AppText>
    </View>
  );
}

function InsightCard({ card, styles }) {
  return (
    <View
      accessibilityLabel={`${card.label}. ${card.body}`}
      accessible
      style={styles.dashboardInsightCard}
    >
      <View style={styles.dashboardInsightHeader}>
        <AppText style={styles.dashboardInsightLabel}>{card.label}</AppText>
        <AppText style={styles.dashboardInsightTone}>
          {getToneLabel(card.tone)}
        </AppText>
      </View>
      <AppText style={styles.dashboardInsightBody}>{card.body}</AppText>
    </View>
  );
}

function ComparisonCard({ comparison, label, styles }) {
  const summary = comparison.available
    ? comparison.summary
    : "Needs more scheduled data";

  return (
    <View
      accessibilityLabel={`${label}. ${comparison.rate} percent. ${summary}.`}
      accessible
      style={styles.comparisonCard}
    >
      <View style={styles.comparisonTopRow}>
        <AppText style={styles.comparisonLabel}>{label}</AppText>
        <AppText style={styles.comparisonDirection}>
          {getDirectionLabel(comparison.direction)}
        </AppText>
      </View>
      <AppText style={styles.comparisonValue}>{comparison.rate}%</AppText>
      <AppText style={styles.comparisonSummary}>{summary}</AppText>
    </View>
  );
}

function HabitRankingCard({ emptyText, habits, label, styles }) {
  return (
    <View style={styles.rankingCard}>
      <AppText style={styles.rankingTitle}>{label}</AppText>
      {habits.length === 0 ? (
        <AppText style={styles.rankingEmpty}>{emptyText}</AppText>
      ) : (
        habits.map((habit, index) => (
          <Pressable
            accessibilityLabel={`${habit.name}. ${habit.completionRate} percent completion over the last 30 days. Rank ${index + 1}.`}
            accessibilityRole="button"
            key={habit.id}
            onPress={() => router.push(`/analytics/${habit.id}`)}
            style={({ pressed }) => [
              styles.rankingRow,
              pressed && PRESSED_STATS_STYLE,
            ]}
          >
            <AppText style={styles.rankingIndex}>{index + 1}</AppText>
            <View style={styles.rankingMain}>
              <AppText numberOfLines={1} style={styles.rankingName}>
                {habit.name}
              </AppText>
              <AppText numberOfLines={1} style={styles.rankingMeta}>
                {habit.completionRate}% · {habit.currentStreak} streak
              </AppText>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

function PersonalBestStrip({ records, styles }) {
  if (records.length === 0) {
    return null;
  }

  return (
    <View style={styles.personalBestStrip}>
      <AppText style={styles.personalBestTitle}>Personal bests</AppText>
      {records.map((record) => (
        <View
          accessibilityLabel={`${record.title}. ${record.value}. ${record.description}`}
          accessible
          key={record.id}
          style={styles.personalBestRow}
        >
          <AppText numberOfLines={1} style={styles.personalBestName}>
            {record.title}
          </AppText>
          <AppText numberOfLines={1} style={styles.personalBestValue}>
            {record.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function getDirectionLabel(direction) {
  if (direction === "improving") {
    return "Improving";
  }

  if (direction === "declining") {
    return "Declining";
  }

  if (direction === "insufficient") {
    return "Building";
  }

  return "Stable";
}

function getToneLabel(tone) {
  if (tone === "positive" || tone === "improving") {
    return "Good";
  }

  if (tone === "attention" || tone === "declining") {
    return "Watch";
  }

  return "Info";
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    dashboardCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.lg,
    },
    dashboardHeaderRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    dashboardHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    dashboardEyebrow: {
      color: colors.primary,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      textTransform: "uppercase",
    },
    dashboardTitle: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
      marginTop: v2Spacing.xs,
    },
    dashboardSubtitle: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
    dashboardPill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexShrink: 0,
      justifyContent: "center",
      minHeight: 34,
      paddingHorizontal: v2Spacing.md,
    },
    dashboardPillText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    dashboardMetricRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
    },
    smallDashboardMetric: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexBasis: "30%",
      flexGrow: 1,
      minWidth: 88,
      padding: v2Spacing.md,
    },
    smallDashboardValue: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    smallDashboardLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
    insightCardStack: {
      gap: v2Spacing.sm,
    },
    dashboardInsightCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.lg,
    },
    dashboardInsightHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.sm,
      justifyContent: "space-between",
      marginBottom: v2Spacing.xs,
    },
    dashboardInsightLabel: {
      color: colors.text,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      minWidth: 0,
    },
    dashboardInsightTone: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: 9,
      paddingVertical: v2Spacing.xs,
    },
    dashboardInsightBody: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
    },
    comparisonGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.md,
    },
    comparisonCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      minWidth: 0,
      padding: v2Spacing.lg,
    },
    comparisonTopRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.sm,
      justifyContent: "space-between",
    },
    comparisonLabel: {
      color: colors.muted,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      minWidth: 0,
    },
    comparisonDirection: {
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    comparisonValue: {
      color: colors.text,
      fontSize: v2Typography.largeMetric.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.largeMetric.lineHeight,
      marginTop: v2Spacing.sm,
    },
    comparisonSummary: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: v2Spacing.xs,
    },
    rankingGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.md,
    },
    rankingCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      gap: v2Spacing.sm,
      minWidth: 0,
      padding: v2Spacing.lg,
    },
    rankingTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    rankingEmpty: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
    },
    rankingRow: {
      alignItems: "center",
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.sm,
      minHeight: 46,
      paddingTop: v2Spacing.sm,
    },
    rankingIndex: {
      color: colors.muted,
      flexShrink: 0,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      width: 18,
    },
    rankingMain: {
      flex: 1,
      minWidth: 0,
    },
    rankingName: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    rankingMeta: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
    personalBestStrip: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.lg,
    },
    personalBestTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: v2Spacing.xs,
    },
    personalBestRow: {
      alignItems: "center",
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
      minHeight: 40,
      paddingTop: v2Spacing.sm,
    },
    personalBestName: {
      color: colors.muted,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      minWidth: 0,
    },
    personalBestValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: "46%",
      textAlign: "right",
    },
    dashboardEmptyText: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      padding: v2Spacing.lg,
    },
  });
}
