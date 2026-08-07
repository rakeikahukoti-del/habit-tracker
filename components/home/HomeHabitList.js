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
import { v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function HomeHabitList({
  countLabel,
  data,
  enableLongPressReorder,
  enableSwipeToComplete,
  isSmallScreen,
  loading,
  onAddPress,
  onRefresh,
  onReorderPress,
  onToggleComplete,
  refreshing,
  subtitle,
  title,
  totalHabitsCount,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  const renderHabitItem = useCallback(
    ({ item }) => (
      <View style={styles.listItem}>
        <HabitCard
          habit={item}
          enableLongPressReorder={enableLongPressReorder}
          enableSwipeToComplete={enableSwipeToComplete}
          onReorderPress={onReorderPress}
          onToggleComplete={onToggleComplete}
        />
      </View>
    ),
    [
      enableLongPressReorder,
      enableSwipeToComplete,
      onReorderPress,
      onToggleComplete,
      styles.listItem,
    ]
  );
  const renderSeparator = useCallback(
    () => <View style={styles.separator} />,
    [styles.separator]
  );

  return (
    <>
      <View style={styles.listHeader}>
        <View style={styles.listHeaderText}>
          <View style={styles.listTitleRow}>
            <AppText style={styles.listTitle}>{title}</AppText>
            <AppText style={styles.doneBadgeText}>
              {countLabel}
            </AppText>
          </View>
          <AppText style={styles.listSubtitle}>{subtitle}</AppText>
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

      <FlatList
        style={styles.list}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          data.length === 0 && styles.emptyListContent,
        ]}
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
    </>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    listHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      paddingBottom: 8,
      paddingTop: 10,
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
    listSubtitle: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
      marginTop: 4,
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
      paddingHorizontal: 14,
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
    list: {
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
      padding: 18,
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
