import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SettingsScreen } from "../components/settings";
import { AppText } from "../components/ui";
import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_EMOJI,
} from "../constants/habitOptions";
import {
  v2FontWeight,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { getHabits, saveHabitOrder } from "../storage/habitsStorage";
import { withAlpha } from "../utils/colorUtils";

const ROW_DRAG_HEIGHT = 76;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ReorderHabitsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const activeDragY = useRef(new Animated.Value(0)).current;
  const habitsRef = useRef([]);
  const dragState = useRef({
    id: null,
    lastIndex: 0,
    startIndex: 0,
  });

  useEffect(
    () => () => {
      activeDragY.stopAnimation();
    },
    [activeDragY]
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadHabits() {
        try {
          setError("");
          const savedHabits = await getHabits();

          if (isActive) {
            setHabits(savedHabits);
            habitsRef.current = savedHabits;
          }
        } catch {
          if (isActive) {
            setError("Could not load habits. Please try again.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadHabits();

      return () => {
        isActive = false;
      };
    }, [])
  );

  function handleDragStart(habit, index) {
    activeDragY.stopAnimation();
    activeDragY.setValue(0);
    dragState.current = {
      id: habit.id,
      lastIndex: index,
      startIndex: index,
    };
    setDraggingId(habit.id);
  }

  function handleDragMove(gestureState) {
    const currentDrag = dragState.current;

    if (!currentDrag.id) {
      return;
    }

    const offset = Math.round(gestureState.dy / ROW_DRAG_HEIGHT);
    const targetIndex = clamp(
      currentDrag.startIndex + offset,
      0,
      habitsRef.current.length - 1
    );
    const visualOffset =
      gestureState.dy -
      (targetIndex - currentDrag.startIndex) * ROW_DRAG_HEIGHT;

    activeDragY.setValue(visualOffset);

    if (targetIndex === currentDrag.lastIndex) {
      return;
    }

    const nextHabits = moveArrayItem(
      habitsRef.current,
      currentDrag.lastIndex,
      targetIndex
    );

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    dragState.current = {
      ...currentDrag,
      lastIndex: targetIndex,
    };
    habitsRef.current = nextHabits;
    setHabits(nextHabits);
  }

  async function handleDragEnd() {
    const currentDrag = dragState.current;

    if (!currentDrag.id) {
      return;
    }

    try {
      setError("");
      await animateToRest(activeDragY);
      const reorderedHabits = await saveHabitOrder(
        habitsRef.current.map((habit) => habit.id)
      );

      habitsRef.current = reorderedHabits;
      setHabits(reorderedHabits);
    } catch {
      setError("Could not reorder habits. Please try again.");
    } finally {
      dragState.current = {
        id: null,
        lastIndex: 0,
        startIndex: 0,
      };
      activeDragY.setValue(0);
      setDraggingId(null);
    }
  }

  return (
    <SettingsScreen
      backLabel="Back to Habit Preferences"
      eyebrow="Habits"
      onBack={() => router.replace("/habit-preferences")}
      scrollEnabled={!draggingId}
      subtitle="Hold a row, then drag it up or down."
      title="Reorder habits"
    >
      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

      <View style={styles.listCard}>
        {loading ? (
          <AppText style={styles.emptyText}>Loading habits...</AppText>
        ) : habits.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText style={styles.emptyTitle}>No habits yet</AppText>
            <AppText style={styles.emptyText}>
              Create a habit first, then set its order here.
            </AppText>
          </View>
        ) : (
          habits.map((habit, index) => (
            <HabitOrderRow
              dragY={activeDragY}
              habit={habit}
              index={index}
              isDragging={draggingId === habit.id}
              key={habit.id}
              onDragEnd={handleDragEnd}
              onDragMove={handleDragMove}
              onDragStart={handleDragStart}
              styles={styles}
            />
          ))
        )}
      </View>
    </SettingsScreen>
  );
}

function HabitOrderRow({
  habit,
  dragY,
  index,
  isDragging,
  onDragEnd,
  onDragMove,
  onDragStart,
  styles,
}) {
  const accentColor = habit.color || DEFAULT_HABIT_COLOR;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => isDragging,
        onPanResponderMove: (_, gestureState) => onDragMove(gestureState),
        onPanResponderRelease: onDragEnd,
        onPanResponderTerminate: onDragEnd,
      }),
    [isDragging, onDragEnd, onDragMove]
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.habitRowWrap,
        index === 0 && styles.firstHabitRow,
        isDragging && [
          styles.habitRowDragging,
          {
            transform: [{ translateY: dragY }, { scale: 1.015 }],
          },
        ],
      ]}
    >
      <Pressable
        accessibilityHint="Long press, then drag up or down to reorder."
        accessibilityLabel={`Reorder ${habit.name}`}
        accessibilityRole="button"
        accessibilityState={{ busy: isDragging }}
        delayLongPress={180}
        onLongPress={() => onDragStart(habit, index)}
        style={({ pressed }) => [
          styles.habitRow,
          pressed && !isDragging && styles.habitRowPressed,
        ]}
      >
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: withAlpha(accentColor, 0.1),
              borderColor: withAlpha(accentColor, 0.28),
            },
          ]}
        >
          <AppText style={styles.iconText}>
            {habit.emoji || DEFAULT_HABIT_EMOJI}
          </AppText>
        </View>

        <View style={styles.habitText}>
          <AppText numberOfLines={1} style={styles.habitName}>
            {habit.name}
          </AppText>
          {habit.category ? (
            <AppText numberOfLines={1} style={styles.habitCategory}>
              {habit.category}
            </AppText>
          ) : null}
        </View>

        <View
          accessible={false}
          style={styles.dragHandle}
        >
          <AppText style={styles.dragHandleText}>☰</AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    errorText: {
      backgroundColor: colors.dangerSoft,
      borderRadius: v2Radius.small,
      color: colors.danger,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginBottom: v2Spacing.md,
      overflow: "hidden",
      padding: v2Spacing.md,
    },
    listCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      overflow: "visible",
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.07,
    },
    habitRowWrap: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      backgroundColor: colors.card,
    },
    habitRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 70,
      padding: isSmallScreen ? v2Spacing.md : v2Spacing.lg,
    },
    habitRowPressed: {
      opacity: 0.82,
    },
    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
    firstHabitRow: {
      borderTopWidth: 0,
    },
    habitRowDragging: {
      backgroundColor: colors.inputBackground,
      ...v2Shadows.floating,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      zIndex: 20,
    },
    iconBadge: {
      alignItems: "center",
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      height: 46,
      justifyContent: "center",
      width: 46,
    },
    iconText: {
      fontSize: 23,
      lineHeight: 28,
    },
    habitText: {
      flex: 1,
      minWidth: 0,
    },
    habitName: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
    },
    habitCategory: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: 2,
    },
    dragHandle: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    dragHandleText: {
      color: colors.muted,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: 22,
    },
    emptyState: {
      alignItems: "center",
      padding: v2Spacing.xxl,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: v2Spacing.xs,
      textAlign: "center",
    },
    emptyText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.regular,
      lineHeight: v2Typography.body.lineHeight,
      padding: v2Spacing.xl,
      textAlign: "center",
    },
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function moveArrayItem(items, fromIndex, toIndex) {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);

  nextItems.splice(toIndex, 0, item);

  return nextItems;
}

function animateToRest(animatedValue) {
  return new Promise((resolve) => {
    Animated.spring(animatedValue, {
      damping: 18,
      mass: 0.7,
      stiffness: 180,
      toValue: 0,
      useNativeDriver: true,
    }).start(resolve);
  });
}
