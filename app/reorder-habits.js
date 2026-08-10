import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  AccessibilityInfo,
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
import { AppIcon, AppText } from "../components/ui";
import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_EMOJI,
} from "../constants/habitOptions";
import {
  v2Breakpoints,
  v2FontWeight,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
  v2Motion,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import {
  getHabits,
  saveHabitOrder,
} from "../storage/habitsStorage";
import { withAlpha } from "../utils/colorUtils";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useEntranceAnimation } from "../hooks/useEntranceAnimation";

const ROW_DRAG_HEIGHT = 82;
const AUTO_SCROLL_EDGE_DISTANCE = 116;
const AUTO_SCROLL_STEP = 44;
const AUTO_SCROLL_THROTTLE_MS = 70;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ReorderHabitsScreen() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const { height, width } = useWindowDimensions();
  const isSmallScreen = width < v2Breakpoints.smallScreenMaxWidth;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [reorderUpdatingId, setReorderUpdatingId] = useState(null);
  const activeDragY = useRef(new Animated.Value(0)).current;
  const habitsRef = useRef([]);
  const lastAutoScrollAtRef = useRef(0);
  const originalOrderIdsRef = useRef([]);
  const scrollOffsetRef = useRef(0);
  const scrollRef = useRef(null);
  const reorderUpdatingRef = useRef(false);
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
    originalOrderIdsRef.current = habitsRef.current.map((item) => item.id);
    setDraggingId(habit.id);
    Haptics.selectionAsync().catch(() => {});
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
    maybeAutoScroll(gestureState.moveY);

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
      const nextOrderIds = habitsRef.current.map((habit) => habit.id);

      await animateToRest(activeDragY, reduceMotion);

      if (!areStringArraysEqual(originalOrderIdsRef.current, nextOrderIds)) {
        const reorderedHabits = await saveHabitOrder(nextOrderIds);

        habitsRef.current = reorderedHabits;
        setHabits(reorderedHabits);
      }
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
      Haptics.selectionAsync().catch(() => {});
    }
  }

  async function handleAccessibilityMove(index, direction) {
    if (reorderUpdatingRef.current || draggingId) {
      return;
    }

    const targetIndex = clamp(
      index + direction,
      0,
      habitsRef.current.length - 1
    );

    if (targetIndex === index) {
      return;
    }

    const previousHabits = habitsRef.current;
    const movedHabit = previousHabits[index];
    const nextHabits = moveArrayItem(previousHabits, index, targetIndex);

    reorderUpdatingRef.current = true;
    setReorderUpdatingId(movedHabit.id);
    setError("");
    habitsRef.current = nextHabits;
    setHabits(nextHabits);

    try {
      const savedHabits = await saveHabitOrder(
        nextHabits.map((habit) => habit.id)
      );

      habitsRef.current = savedHabits;
      setHabits(savedHabits);
      AccessibilityInfo.announceForAccessibility?.(
        `${movedHabit.name} moved to position ${targetIndex + 1}.`
      );
    } catch {
      habitsRef.current = previousHabits;
      setHabits(previousHabits);
      setError("Could not reorder habits. Please try again.");
    } finally {
      reorderUpdatingRef.current = false;
      setReorderUpdatingId(null);
    }
  }

  function maybeAutoScroll(moveY) {
    const now = Date.now();

    if (now - lastAutoScrollAtRef.current < AUTO_SCROLL_THROTTLE_MS) {
      return;
    }

    let nextOffset = scrollOffsetRef.current;

    if (moveY < AUTO_SCROLL_EDGE_DISTANCE) {
      nextOffset = Math.max(0, scrollOffsetRef.current - AUTO_SCROLL_STEP);
    } else if (moveY > height - AUTO_SCROLL_EDGE_DISTANCE) {
      nextOffset = scrollOffsetRef.current + AUTO_SCROLL_STEP;
    } else {
      return;
    }

    lastAutoScrollAtRef.current = now;
    scrollOffsetRef.current = nextOffset;
    scrollRef.current?.scrollTo({ animated: true, y: nextOffset });
  }

  return (
    <SettingsScreen
      backLabel="Back to Habit Preferences"
      eyebrow="Habits"
      onBack={() => {
        if (!draggingId) {
          router.replace("/habit-preferences");
        }
      }}
      onScroll={(event) => {
        scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEnabled={!draggingId}
      scrollEventThrottle={16}
      scrollRef={scrollRef}
      subtitle="Long press a habit, then drag it into position."
      title="Reorder habits"
    >
      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

      <View style={styles.listCard}>
        {loading ? (
          <AppText style={styles.emptyText}>Loading habits...</AppText>
        ) : habits.length === 0 ? (
          <ReorderEmptyState colors={colors} styles={styles} />
        ) : (
          habits.map((habit, index) => (
            <HabitOrderRow
              dragY={activeDragY}
              colors={colors}
              habit={habit}
              index={index}
              isDragging={draggingId === habit.id}
              isUpdating={reorderUpdatingId === habit.id}
              key={habit.id}
              onAccessibilityMove={handleAccessibilityMove}
              onDragEnd={handleDragEnd}
              onDragMove={handleDragMove}
              onDragStart={handleDragStart}
              styles={styles}
              totalCount={habits.length}
            />
          ))
        )}
      </View>
    </SettingsScreen>
  );
}

function ReorderEmptyState({ colors, styles }) {
  const entrance = useEntranceAnimation();

  return (
    <Animated.View style={[styles.emptyState, entrance.style]}>
      <View style={styles.emptyIconCircle}>
        <AppIcon color={colors.primary} name="drag" size={22} strokeWidth={2} />
      </View>
      <AppText style={styles.emptyTitle}>
        No habits yet — add one to start reordering
      </AppText>
      <AppText style={styles.emptyText}>
        Create a habit first, then set its order here.
      </AppText>
    </Animated.View>
  );
}

function HabitOrderRow({
  colors,
  habit,
  dragY,
  index,
  isDragging,
  isUpdating,
  onAccessibilityMove,
  onDragEnd,
  onDragMove,
  onDragStart,
  styles,
  totalCount,
}) {
  const accentColor = habit.color || DEFAULT_HABIT_COLOR;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          isDragging && Math.abs(gestureState.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          isDragging && Math.abs(gestureState.dy) > 2,
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
        accessibilityActions={[
          ...(index > 0 ? [{ name: "decrement", label: "Move up" }] : []),
          ...(index < totalCount - 1
            ? [{ name: "increment", label: "Move down" }]
            : []),
        ]}
        accessibilityHint="Long press and drag, or use adjustable actions to move this habit."
        accessibilityLabel={`Reorder ${habit.name}`}
        accessibilityRole="adjustable"
        accessibilityState={{
          busy: isDragging || isUpdating,
          selected: isDragging,
        }}
        accessibilityValue={{
          max: totalCount,
          min: 1,
          now: index + 1,
          text: `Position ${index + 1} of ${totalCount}`,
        }}
        delayLongPress={150}
        disabled={isUpdating}
        onLongPress={() => onDragStart(habit, index)}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "decrement") {
            onAccessibilityMove(index, -1);
          }

          if (event.nativeEvent.actionName === "increment") {
            onAccessibilityMove(index, 1);
          }
        }}
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

        <View accessible={false} style={styles.dragHandle}>
          <AppIcon
            color={isDragging ? colors.text : colors.muted}
            name="drag"
            size={20}
            strokeWidth={2}
          />
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
      borderRadius: v2Radius.large,
      overflow: "visible",
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
      minHeight: ROW_DRAG_HEIGHT,
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
      borderColor: colors.accent,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      marginHorizontal: v2Spacing.xs,
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
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    emptyState: {
      alignItems: "center",
      padding: v2Spacing.xxl,
    },
    emptyIconCircle: {
      alignItems: "center",
      backgroundColor: colors.accentSoft,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      height: 56,
      justifyContent: "center",
      marginBottom: v2Spacing.md,
      width: 56,
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

function areStringArraysEqual(firstArray, secondArray) {
  if (firstArray.length !== secondArray.length) {
    return false;
  }

  return firstArray.every((item, index) => item === secondArray[index]);
}

function animateToRest(animatedValue, reduceMotion) {
  return new Promise((resolve) => {
    if (reduceMotion) {
      animatedValue.setValue(0);
      resolve();
      return;
    }

    Animated.spring(animatedValue, {
      damping: v2Motion.spring.damping,
      mass: v2Motion.spring.mass,
      stiffness: v2Motion.spring.stiffness,
      toValue: 0,
      useNativeDriver: true,
    }).start(resolve);
  });
}
