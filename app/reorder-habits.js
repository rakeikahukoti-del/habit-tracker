import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { DEFAULT_HABIT_COLOR } from "../constants/habitOptions";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  pageTitleLineHeight,
  pageTitleSize,
  radius,
  spacing,
} from "../constants/typography";
import { useTheme } from "../context/ThemeContext";
import { getHabits, saveHabitOrder } from "../storage/habitsStorage";

const ROW_DRAG_HEIGHT = 76;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ReorderHabitsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        scrollEnabled={!draggingId}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityLabel="Back to Habit Preferences"
          accessibilityRole="button"
          hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
          onPress={() => router.replace("/habit-preferences")}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Habits</Text>
        </Pressable>

        <Text style={styles.eyebrow}>Habits</Text>
        <Text style={styles.title}>Reorder habits</Text>
        <Text style={styles.subtitle}>
          Hold and drag a habit to set the Home order.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.listCard}>
          {loading ? (
            <Text style={styles.emptyText}>Loading habits...</Text>
          ) : habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No habits yet</Text>
              <Text style={styles.emptyText}>
                Create a habit first, then set its order here.
              </Text>
            </View>
          ) : (
            habits.map((habit, index) => (
              <HabitOrderRow
                habit={habit}
                index={index}
                isDragging={draggingId === habit.id}
                key={habit.id}
                dragY={activeDragY}
                onDragEnd={handleDragEnd}
                onDragMove={handleDragMove}
                onDragStart={handleDragStart}
                styles={styles}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
        accessibilityLabel={`Hold and drag ${habit.name}`}
        accessibilityRole="button"
        delayLongPress={180}
        onLongPress={() => onDragStart(habit, index)}
        style={styles.habitRow}
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
          <Text style={styles.iconText}>{habit.emoji || "✨"}</Text>
        </View>

        <View style={styles.habitText}>
          <Text numberOfLines={1} style={styles.habitName}>
            {habit.name}
          </Text>
          <Text numberOfLines={1} style={styles.habitCategory}>
            {habit.category || "General"}
          </Text>
        </View>

        <View
          accessibilityLabel="Drag handle"
          style={styles.dragHandle}
        >
          <Text style={styles.dragHandleText}>☰</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? layout.formMaxWidth : "100%",
      padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
      paddingBottom: layout.screenBottomPadding,
      width: "100%",
    },
    backButton: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.round,
      borderWidth: 1,
      justifyContent: "center",
      marginBottom: spacing.lg,
      minHeight: layout.minTapTarget,
      paddingHorizontal: spacing.lg,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.xs,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: pageTitleSize(isSmallScreen),
      fontWeight: fontWeight.bold,
      lineHeight: pageTitleLineHeight(isSmallScreen),
      marginBottom: spacing.sm,
    },
    subtitle: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.body,
      marginBottom: spacing.lg,
    },
    errorText: {
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.sm,
      color: colors.danger,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    listCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xl,
      borderWidth: 1,
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
      gap: spacing.md,
      minHeight: 70,
      padding: isSmallScreen ? spacing.md : spacing.lg,
    },
    firstHabitRow: {
      borderTopWidth: 0,
    },
    habitRowDragging: {
      backgroundColor: colors.inputBackground,
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      zIndex: 20,
    },
    iconBadge: {
      alignItems: "center",
      borderRadius: radius.md,
      borderWidth: 1,
      height: 46,
      justifyContent: "center",
      width: 46,
    },
    iconText: {
      fontSize: 23,
    },
    habitText: {
      flex: 1,
      minWidth: 0,
    },
    habitName: {
      color: colors.text,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.bodyLarge,
    },
    habitCategory: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.caption,
      marginTop: spacing.xs,
    },
    dragHandle: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.round,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    dragHandleText: {
      color: colors.muted,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
      lineHeight: 22,
    },
    emptyState: {
      alignItems: "center",
      padding: spacing.xxl,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.xs,
      textAlign: "center",
    },
    emptyText: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.body,
      padding: spacing.xl,
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

function withAlpha(hexColor, alpha) {
  const normalized = hexColor.replace("#", "");

  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
