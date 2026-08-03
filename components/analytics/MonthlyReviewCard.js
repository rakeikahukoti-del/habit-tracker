import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function MonthlyReviewCard({ isSmallScreen, review }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View
      accessibilityLabel={`${review.label} review. ${review.completionRate}% completion rate. ${review.totalCompletions} completions. ${review.perfectDays} perfect days.`}
      accessible
      style={styles.reviewCard}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.reviewMain}>
          <AppText style={styles.reviewLabel}>{review.label}</AppText>
          <AppText style={styles.reviewValue}>{review.completionRate}%</AppText>
          <AppText style={styles.reviewCaption}>completion rate</AppText>
        </View>
        <View style={styles.reviewPill}>
          <AppText style={styles.reviewPillText}>
            {review.totalXpEarned} XP
          </AppText>
        </View>
      </View>
      <View style={styles.reviewRows}>
        <ReviewRow
          label="Completed"
          value={review.totalCompletions}
          styles={styles}
        />
        <ReviewRow
          label="Perfect days"
          value={review.perfectDays}
          styles={styles}
        />
        <ReviewRow
          label="Best habit"
          value={review.bestHabit?.name || "Building"}
          styles={styles}
        />
      </View>
      {review.recordsAchieved.length > 0 ? (
        <AppText style={styles.reviewNote}>
          {review.recordsAchieved.length} personal record
          {review.recordsAchieved.length === 1 ? "" : "s"} matched this month.
        </AppText>
      ) : null}
    </View>
  );
}

function ReviewRow({ label, styles, value }) {
  return (
    <View style={styles.reviewRow}>
      <AppText style={styles.reviewRowLabel}>{label}</AppText>
      <AppText numberOfLines={2} style={styles.reviewRowValue}>
        {value}
      </AppText>
    </View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
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
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
    },
    reviewValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 34 : 40,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 40 : 46,
    },
    reviewCaption: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    reviewPill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexShrink: 0,
      minHeight: 34,
      justifyContent: "center",
      paddingHorizontal: v2Spacing.md,
    },
    reviewPillText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    reviewRows: {
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
    },
    reviewRow: {
      alignItems: "center",
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
      minHeight: 42,
      paddingTop: v2Spacing.sm,
    },
    reviewRowLabel: {
      color: colors.muted,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      minWidth: 0,
    },
    reviewRowValue: {
      color: colors.text,
      flexShrink: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: "54%",
      textAlign: "right",
    },
    reviewNote: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: v2Spacing.md,
    },
  });
}
