import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function MilestoneCard({ isSmallScreen, milestones }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const nextLabel = milestones.nextMilestone
    ? `${milestones.completionCount}/${milestones.nextMilestone}`
    : `${milestones.completionCount}`;

  return (
    <View
      accessibilityLabel={`Habit milestones. ${milestones.completionCount} completions. ${
        milestones.nextMilestone
          ? `${milestones.nextMilestone - milestones.completionCount} more to reach ${milestones.nextMilestone}.`
          : "All tracked milestones reached."
      }`}
      accessible
      style={styles.milestoneCard}
    >
      <View style={styles.milestoneHeader}>
        <View style={styles.milestoneMain}>
          <AppText style={styles.milestoneLabel}>Total completions</AppText>
          <AppText style={styles.milestoneValue}>{nextLabel}</AppText>
        </View>
        <AppText style={styles.milestonePill}>
          {milestones.nextMilestone ? "Next" : "Complete"}
        </AppText>
      </View>
      <View style={styles.milestoneTrack}>
        <View
          style={[
            styles.milestoneFill,
            { width: `${milestones.progressToNext}%` },
          ]}
        />
      </View>
      <View style={styles.milestoneChips}>
        {milestones.milestones.map((milestone) => (
          <View
            key={milestone.target}
            style={[
              styles.milestoneChip,
              milestone.completed && styles.milestoneChipComplete,
            ]}
          >
            <AppText
              style={[
                styles.milestoneChipText,
                milestone.completed && styles.milestoneChipTextComplete,
              ]}
            >
              {milestone.target}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    milestoneCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.lg,
    },
    milestoneHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    milestoneMain: {
      flex: 1,
      minWidth: 0,
    },
    milestoneLabel: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    milestoneValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
      marginTop: 2,
    },
    milestonePill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: v2Spacing.md,
      paddingVertical: 7,
    },
    milestoneTrack: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      height: 8,
      marginTop: v2Spacing.md,
      overflow: "hidden",
    },
    milestoneFill: {
      backgroundColor: colors.primary,
      borderRadius: v2Radius.pill,
      height: "100%",
    },
    milestoneChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.xs,
      marginTop: v2Spacing.md,
    },
    milestoneChip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      minHeight: 30,
      justifyContent: "center",
      paddingHorizontal: v2Spacing.md,
    },
    milestoneChipComplete: {
      borderColor: colors.primary,
    },
    milestoneChipText: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    milestoneChipTextComplete: {
      color: colors.text,
    },
  });
}
