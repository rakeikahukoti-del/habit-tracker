import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppIcon, AppText, ModalShell } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2CompactSpacing, v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function FocusModeModal({
  dailyPlanProgress,
  focusBusy,
  focusComplete,
  focusHabit,
  focusStreak,
  onComplete,
  onExit,
  onSkip,
  visible,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ModalShell
      animationType="fade"
      maxWidth={360}
      onClose={onExit}
      padding={22}
      visible={visible}
    >
      <ScrollView
        contentContainerStyle={styles.focusModalContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.focusModalIcon}>
          <AppIcon
            color={colors.primary}
            name={focusComplete ? "check" : "flame"}
            size={24}
            strokeWidth={2.2}
          />
        </View>
        <AppText style={styles.levelModalEyebrow}>Focus Mode</AppText>
        <AppText style={styles.focusModalTitle}>
          {focusComplete
            ? "Today's focus is complete"
            : focusHabit?.name || "No focus habit"}
        </AppText>
        <AppText style={styles.focusModalBody}>
          {focusComplete
            ? "All priority habits are complete for today."
            : focusHabit
              ? `${dailyPlanProgress.completedCount}/${dailyPlanProgress.totalCount} complete • ${focusStreak} streak`
              : "All incomplete priorities were skipped for this session."}
        </AppText>
        {focusHabit && !focusComplete ? (
          <View style={styles.focusHabitPreview}>
            <AppText style={styles.focusHabitEmoji}>
              {focusHabit.emoji || "•"}
            </AppText>
            <View style={styles.focusHabitText}>
              <AppText numberOfLines={2} style={styles.focusHabitName}>
                {focusHabit.name}
              </AppText>
              <AppText numberOfLines={1} style={styles.focusHabitCategory}>
                {focusHabit.category || "General"}
              </AppText>
            </View>
          </View>
        ) : null}
        <View style={styles.focusModalActions}>
          {focusHabit && !focusComplete ? (
            <>
              <Pressable
                accessibilityLabel={`Complete ${focusHabit.name}`}
                accessibilityRole="button"
                disabled={focusBusy}
                onPress={onComplete}
                style={({ pressed }) => [
                  styles.focusPrimaryButton,
                  focusBusy && styles.priorityControlDisabled,
                  pressed && v2PressedStyles.button,
                ]}
              >
                <AppText style={styles.focusPrimaryButtonText}>
                  Complete
                </AppText>
              </Pressable>
              <Pressable
                accessibilityLabel={`Skip ${focusHabit.name} for this focus session`}
                accessibilityRole="button"
                onPress={onSkip}
                style={({ pressed }) => [
                  styles.focusSecondaryButton,
                  pressed && v2PressedStyles.button,
                ]}
              >
                <AppText style={styles.focusSecondaryButtonText}>
                  Skip
                </AppText>
              </Pressable>
            </>
          ) : null}
          <Pressable
            accessibilityLabel="Exit focus mode"
            accessibilityRole="button"
            onPress={onExit}
            style={({ pressed }) => [
              styles.focusExitButton,
              pressed && v2PressedStyles.button,
            ]}
          >
            <AppText style={styles.focusExitButtonText}>Exit</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </ModalShell>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    levelModalEyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: v2FontWeight.bold,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    focusModalContent: {
      alignItems: "stretch",
    },
    focusModalIcon: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      height: 56,
      justifyContent: "center",
      marginBottom: v2Spacing.md,
      width: 56,
    },
    focusModalTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: v2FontWeight.bold,
      lineHeight: 30,
    },
    focusModalBody: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: 8,
    },
    focusHabitPreview: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      marginTop: 16,
      padding: v2CompactSpacing.md,
    },
    focusHabitEmoji: {
      color: colors.text,
      fontSize: 24,
      lineHeight: 30,
    },
    focusHabitText: {
      flex: 1,
      minWidth: 0,
    },
    focusHabitName: {
      color: colors.text,
      fontSize: v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.cardTitle.lineHeight,
    },
    focusHabitCategory: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 3,
    },
    focusModalActions: {
      gap: v2Spacing.sm,
      marginTop: 18,
    },
    focusPrimaryButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.large,
      justifyContent: "center",
      minHeight: 50,
    },
    focusPrimaryButtonText: {
      color: colors.inverseText,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    focusSecondaryButton: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 46,
    },
    focusSecondaryButtonText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    focusExitButton: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 42,
    },
    focusExitButtonText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    priorityControlDisabled: {
      opacity: 0.42,
    },
  });
}
