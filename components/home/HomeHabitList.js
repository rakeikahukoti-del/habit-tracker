import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import EmptyState from "../EmptyState";
import HabitCard from "../HabitCard";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { DAILY_PLAN_LIMIT } from "../../utils/dailyPlanning";
import { v2CompactSpacing, v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

// Renders the whole "your habits for today" surface as one scrollable
// FlatList - pinned (Today's Focus) habits sort to the top via `data`'s
// order (see useHomeController's mergedHomeHabits), each marked with the
// star icon on HabitCard rather than a separate static section above this
// list. See docs/momentum-* and the Phase 6 Home decluttering proposal for
// why: a static block whose height scaled with pin count was the actual
// density problem, not this list.
export default function HomeHabitList({
  availablePriorityHabits,
  countLabel,
  data,
  enableLongPressReorder,
  enableSwipeToComplete,
  isSmallScreen,
  ListHeaderComponent,
  loading,
  onAddPress,
  onAddPriority,
  onMovePriority,
  onRefresh,
  onReorderPress,
  onRemovePriority,
  onToggleComplete,
  priorityHabits,
  refreshing,
  title,
  totalHabitsCount,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const priorityIndexById = useMemo(() => {
    const map = new Map();

    priorityHabits.forEach((habit, index) => map.set(habit.id, index));

    return map;
  }, [priorityHabits]);
  const availablePriorityIds = useMemo(
    () => new Set(availablePriorityHabits.map((habit) => habit.id)),
    [availablePriorityHabits]
  );

  const handleTogglePin = useCallback(
    (habit) => {
      if (priorityIndexById.has(habit.id)) {
        onRemovePriority(habit);
        return;
      }

      onAddPriority(habit);
    },
    [onAddPriority, onRemovePriority, priorityIndexById]
  );
  // Stable references, not curried per-item in renderHabitItem, so
  // HabitCard's memo() actually prevents re-rendering every card in the
  // list whenever one card's pin state changes.
  const handleMoveUp = useCallback(
    (habit) => onMovePriority(habit, "up"),
    [onMovePriority]
  );
  const handleMoveDown = useCallback(
    (habit) => onMovePriority(habit, "down"),
    [onMovePriority]
  );

  const renderHabitItem = useCallback(
    ({ item }) => {
      const pinIndex = priorityIndexById.get(item.id);
      const isPinned = pinIndex !== undefined;

      return (
        <View style={styles.listItem}>
          <HabitCard
            habit={item}
            canMoveDown={isPinned && pinIndex < priorityHabits.length - 1}
            canMoveUp={isPinned && pinIndex > 0}
            canPin={
              !isPinned &&
              availablePriorityIds.has(item.id) &&
              priorityHabits.length < DAILY_PLAN_LIMIT
            }
            enableLongPressReorder={enableLongPressReorder}
            enableSwipeToComplete={enableSwipeToComplete}
            isPinned={isPinned}
            onMoveDown={handleMoveDown}
            onMoveUp={handleMoveUp}
            onReorderPress={onReorderPress}
            onToggleComplete={onToggleComplete}
            onTogglePin={handleTogglePin}
          />
        </View>
      );
    },
    [
      availablePriorityIds,
      enableLongPressReorder,
      enableSwipeToComplete,
      handleMoveDown,
      handleMoveUp,
      handleTogglePin,
      onReorderPress,
      onToggleComplete,
      priorityHabits.length,
      priorityIndexById,
      styles.listItem,
    ]
  );
  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [styles.separator]
  );

  return (
    <FlatList
      style={styles.list}
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.listContent,
        data.length === 0 && styles.emptyListContent,
      ]}
      ListHeaderComponent={
        <>
          {ListHeaderComponent}
          <View style={styles.listHeader}>
            <View style={styles.listHeaderText}>
              <View style={styles.listTitleRow}>
                <AppText style={styles.listTitle}>{title}</AppText>
                {totalHabitsCount > 0 ? (
                  <AppText style={styles.doneBadgeText}>{countLabel}</AppText>
                ) : null}
              </View>
            </View>
            <Pressable
              accessibilityLabel="Add a new habit"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onAddPress}
              style={({ pressed }) => [
                styles.inlineAddButton,
                pressed && v2PressedStyles.button,
              ]}
            >
              <AppIcon color={colors.text} name="plus" size={17} strokeWidth={2.2} />
              <AppText style={styles.inlineAddText}>Add</AppText>
            </Pressable>
          </View>
        </>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
            <AppText style={styles.loadingText}>Loading habits...</AppText>
          </View>
        ) : totalHabitsCount === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.remainingEmptyState}>
            <AppText style={styles.remainingEmptyTitle}>
              Your focus list is set
            </AppText>
            <AppText style={styles.remainingEmptyText}>
              Everything else is clear for today.
            </AppText>
          </View>
        )
      }
      renderItem={renderHabitItem}
      initialNumToRender={8}
      ItemSeparatorComponent={renderSeparator}
      maxToRenderPerBatch={8}
      showsVerticalScrollIndicator={false}
      windowSize={7}
    />
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    list: {
      flex: 1,
      width: "100%",
    },
    listHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      paddingBottom: 8,
      paddingTop: v2CompactSpacing.sm,
      width: "100%",
    },
    listHeaderText: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
    },
    listTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    listTitle: {
      color: colors.text,
      fontSize: isSmallScreen ? v2Typography.cardTitle.fontSize : v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    doneBadgeText: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    inlineAddButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.xs,
      justifyContent: "center",
      marginTop: 1,
      minHeight: 44,
      minWidth: 76,
      paddingHorizontal: v2CompactSpacing.md,
    },
    inlineAddText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    loadingState: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      gap: 10,
      marginTop: 24,
      padding: 28,
    },
    loadingText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    listContent: {
      paddingBottom: 32,
      paddingTop: 6,
      width: "100%",
    },
    listItem: {
      maxWidth: "100%",
      width: "100%",
    },
    emptyListContent: {
      flexGrow: 1,
    },
    remainingEmptyState: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: v2Radius.large,
      marginTop: 8,
      padding: v2CompactSpacing.lg,
    },
    remainingEmptyTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    remainingEmptyText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
      marginTop: 4,
      textAlign: "center",
    },
    separator: {
      height: 10,
    },
  });
}
