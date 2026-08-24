import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function MonthlyActivityCard({
  monthSummary,
  selectedMonth,
  setSelectedMonth,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
            pressed && v2PressedStyles.stats,
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
            pressed && canGoNext && v2PressedStyles.stats,
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
            <InsightRow
              badge="Strongest"
              name={monthSummary.strongestHabit.name}
              styles={styles}
              value={`${monthSummary.strongestHabit.completionRate}%`}
            />
          ) : null}
          {monthSummary.mostImprovedHabit ? (
            <InsightRow
              badge="Most improved"
              name={monthSummary.mostImprovedHabit.name}
              styles={styles}
              value={`+${monthSummary.mostImprovedHabit.improvement}%`}
            />
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

function CompactMetric({ label, styles, value }) {
  return (
    <View style={styles.compactMetric}>
      <AppText style={styles.compactMetricValue}>{value}</AppText>
      <AppText style={styles.compactMetricLabel}>{label}</AppText>
    </View>
  );
}

// Shrunk from a full sentence ("Strongest: {name} at {rate}%") to a badge
// + name + value row (Phase 13 text-density pass) - same information,
// scannable at a glance instead of read as prose.
function InsightRow({ badge, name, styles, value }) {
  return (
    <View
      accessibilityLabel={`${badge}: ${name}, ${value}`}
      accessible
      style={styles.insightRow}
    >
      <View style={styles.insightBadge}>
        <AppText style={styles.insightBadgeText}>{badge}</AppText>
      </View>
      <AppText numberOfLines={1} style={styles.insightName}>
        {name}
      </AppText>
      <AppText style={styles.insightValue}>{value}</AppText>
    </View>
  );
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function createStyles(colors) {
  return StyleSheet.create({
    monthCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
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
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
      paddingTop: v2Spacing.md,
    },
    insightRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.sm,
    },
    insightBadge: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexShrink: 0,
      paddingHorizontal: v2Spacing.sm,
      paddingVertical: 3,
    },
    insightBadgeText: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    insightName: {
      color: colors.text,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      minWidth: 0,
    },
    insightValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    monthEmptyText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: v2Spacing.lg,
    },
  });
}
