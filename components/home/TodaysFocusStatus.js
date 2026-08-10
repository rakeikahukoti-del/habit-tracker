import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

// Replaces TodaysFocusSection's always-expanded card stack. The pinned
// habits themselves now live inline in the merged habit list (sorted to the
// top, marked with the star icon on HabitCard) - this is just the status
// line that used to be TodaysFocusSection's header, so "how am I doing on
// my focus habits" is still visible without scrolling, at a fraction of the
// old always-on cost.
export default function TodaysFocusStatus({
  dailyPlanMessage,
  dailyPlanProgress,
  hasPriorityHabits,
  onOpenFocusMode,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.focusStatus}>
      <View style={styles.focusStatusRow}>
        <View style={styles.focusStatusText}>
          <AppText style={styles.focusStatusTitle}>Today's Focus</AppText>
          <AppText style={styles.focusStatusSubtitle}>
            {hasPriorityHabits
              ? `${dailyPlanProgress.completedCount}/${dailyPlanProgress.totalCount} complete`
              : "Tap the star on a habit below to pin up to three for today."}
          </AppText>
        </View>
        {hasPriorityHabits ? (
          <Pressable
            accessibilityLabel="Start focus mode"
            accessibilityRole="button"
            hitSlop={4}
            onPress={onOpenFocusMode}
            style={({ pressed }) => [
              styles.focusStartButton,
              pressed && v2PressedStyles.button,
            ]}
          >
            <AppIcon color={colors.inverseText} name="flame" size={15} />
            <AppText style={styles.focusStartText}>Focus</AppText>
          </Pressable>
        ) : null}
      </View>

      {dailyPlanMessage ? (
        <AppText style={styles.dailyPlanMessage}>{dailyPlanMessage}</AppText>
      ) : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    focusStatus: {
      marginBottom: v2Spacing.sm,
    },
    focusStatusRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    focusStatusText: {
      flex: 1,
      minWidth: 0,
    },
    focusStatusTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    focusStatusSubtitle: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
      marginTop: 2,
    },
    focusStartButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.pill,
      flexDirection: "row",
      flexShrink: 0,
      gap: v2Spacing.xs,
      justifyContent: "center",
      minHeight: 36,
      paddingHorizontal: v2Spacing.md,
    },
    focusStartText: {
      color: colors.inverseText,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    dailyPlanMessage: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: v2Spacing.xs,
    },
  });
}
