import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import HabitCard from "../HabitCard";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function TodaysFocusSection({
  availablePriorityHabits,
  dailyPlanMessage,
  dailyPlanProgress,
  enableLongPressReorder,
  enableSwipeToComplete,
  habits,
  isSmallScreen,
  onAddPriority,
  onMovePriority,
  onOpenFocusMode,
  onReorderPress,
  onRemovePriority,
  onToggleComplete,
  priorityHabits,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View style={styles.focusSection}>
      <View style={styles.focusSectionHeader}>
        <View style={styles.focusSectionText}>
          <AppText style={styles.focusSectionTitle}>Today's Focus</AppText>
          <AppText style={styles.focusSectionSubtitle}>
            {priorityHabits.length > 0
              ? `${dailyPlanProgress.completedCount}/${dailyPlanProgress.totalCount} priorities complete`
              : "Choose up to three habits to prioritize today."}
          </AppText>
        </View>
        {priorityHabits.length > 0 ? (
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

      {priorityHabits.length > 0 ? (
        <View style={styles.priorityList}>
          {priorityHabits.map((habit, index) => (
            <View key={habit.id} style={styles.priorityItem}>
              <HabitCard
                habit={habit}
                enableLongPressReorder={enableLongPressReorder}
                enableSwipeToComplete={enableSwipeToComplete}
                onReorderPress={onReorderPress}
                onToggleComplete={onToggleComplete}
              />
              <View style={styles.priorityControls}>
                <Pressable
                  accessibilityLabel={`Move ${habit.name} up in today's focus`}
                  accessibilityRole="button"
                  disabled={index === 0}
                  hitSlop={8}
                  onPress={() => onMovePriority(habit, "up")}
                  style={({ pressed }) => [
                    styles.priorityControlButton,
                    index === 0 && styles.priorityControlDisabled,
                    pressed && v2PressedStyles.button,
                  ]}
                >
                  <AppIcon
                    color={index === 0 ? colors.softText : colors.text}
                    name="chevron-up"
                    size={16}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Move ${habit.name} down in today's focus`}
                  accessibilityRole="button"
                  disabled={index === priorityHabits.length - 1}
                  hitSlop={8}
                  onPress={() => onMovePriority(habit, "down")}
                  style={({ pressed }) => [
                    styles.priorityControlButton,
                    index === priorityHabits.length - 1 &&
                      styles.priorityControlDisabled,
                    pressed && v2PressedStyles.button,
                  ]}
                >
                  <AppIcon
                    color={
                      index === priorityHabits.length - 1
                        ? colors.softText
                        : colors.text
                    }
                    name="chevron-down"
                    size={16}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Remove ${habit.name} from today's focus`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => onRemovePriority(habit)}
                  style={({ pressed }) => [
                    styles.priorityRemoveButton,
                    pressed && v2PressedStyles.button,
                  ]}
                >
                  <AppText style={styles.priorityRemoveText}>Remove</AppText>
                </Pressable>
              </View>
            </View>
          ))}
          {priorityHabits.length < 3 && availablePriorityHabits.length > 0 ? (
            <View style={styles.priorityAddRow}>
              <AppText style={styles.priorityAddLabel}>Add to focus</AppText>
              <View style={styles.priorityPicker}>
                {availablePriorityHabits.slice(0, 4).map((habit) => (
                  <Pressable
                    accessibilityLabel={`Add ${habit.name} to today's focus`}
                    accessibilityRole="button"
                    hitSlop={{ bottom: 4, top: 4 }}
                    key={habit.id}
                    onPress={() => onAddPriority(habit)}
                    style={({ pressed }) => [
                      styles.priorityChip,
                      pressed && v2PressedStyles.button,
                    ]}
                  >
                    <AppText style={styles.priorityChipEmoji}>
                      {habit.emoji || "•"}
                    </AppText>
                    <AppText
                      numberOfLines={1}
                      style={styles.priorityChipText}
                    >
                      {habit.name}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : availablePriorityHabits.length > 0 ? (
        <View style={styles.priorityPicker}>
          {availablePriorityHabits.slice(0, 5).map((habit) => (
            <Pressable
              accessibilityLabel={`Add ${habit.name} to today's focus`}
              accessibilityRole="button"
              hitSlop={{ bottom: 4, top: 4 }}
              key={habit.id}
              onPress={() => onAddPriority(habit)}
              style={({ pressed }) => [
                styles.priorityChip,
                pressed && v2PressedStyles.button,
              ]}
            >
              <AppText style={styles.priorityChipEmoji}>
                {habit.emoji || "•"}
              </AppText>
              <AppText numberOfLines={1} style={styles.priorityChipText}>
                {habit.name}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : habits.length > 0 ? (
        <AppText style={styles.noFocusText}>
          Nothing is scheduled for today.
        </AppText>
      ) : null}
    </View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    focusSection: {
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      gap: v2Spacing.sm,
      paddingBottom: v2Spacing.md,
      paddingTop: v2Spacing.md,
    },
    focusSectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
      width: "100%",
    },
    focusSectionText: {
      flex: 1,
      minWidth: 0,
    },
    focusSectionTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.sectionTitle.lineHeight,
    },
    focusSectionSubtitle: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
      marginTop: 3,
    },
    focusStartButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.pill,
      flexDirection: "row",
      gap: v2Spacing.xs,
      justifyContent: "center",
      minHeight: 42,
      minWidth: 92,
      paddingHorizontal: 14,
    },
    focusStartText: {
      color: colors.inverseText,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    dailyPlanMessage: {
      color: colors.primary,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.caption.lineHeight,
    },
    priorityList: {
      gap: 12,
      width: "100%",
    },
    priorityAddRow: {
      gap: v2Spacing.xs,
      paddingTop: 2,
      width: "100%",
    },
    priorityAddLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.caption.lineHeight,
    },
    priorityItem: {
      gap: v2Spacing.xs,
      width: "100%",
    },
    priorityControls: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.sm,
      justifyContent: "flex-end",
      paddingHorizontal: 2,
    },
    priorityControlButton: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    priorityControlDisabled: {
      opacity: 0.42,
    },
    priorityRemoveButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 36,
      paddingHorizontal: 12,
    },
    priorityRemoveText: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    priorityPicker: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      width: "100%",
    },
    priorityChip: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.xs,
      maxWidth: "100%",
      minHeight: 40,
      paddingHorizontal: 12,
    },
    priorityChipEmoji: {
      color: colors.text,
      fontSize: 15,
    },
    priorityChipText: {
      color: colors.text,
      flexShrink: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: isSmallScreen ? 170 : 230,
    },
    noFocusText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
    },
  });
}
