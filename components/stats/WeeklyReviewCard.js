import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function WeeklyReviewCard({ expanded, isSmallScreen, onToggle, review }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

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
          pressed && v2PressedStyles.stats,
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

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    reviewCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
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
      marginBottom: v2Spacing.xs,
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
      marginBottom: v2Spacing.xs,
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
  });
}
