import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { PRESSED_STATS_STYLE } from "../home/pressedStyles";

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
            pressed && PRESSED_STATS_STYLE,
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
            pressed && canGoNext && PRESSED_STATS_STYLE,
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

function CompactMetric({ label, styles, value }) {
  return (
    <View style={styles.compactMetric}>
      <AppText style={styles.compactMetricValue}>{value}</AppText>
      <AppText style={styles.compactMetricLabel}>{label}</AppText>
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
  });
}
