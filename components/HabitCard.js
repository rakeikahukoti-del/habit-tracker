import { memo, useEffect, useMemo, useRef } from "react";
import * as Haptics from "expo-haptics";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { AppIcon, AppText } from "./ui";
import ProgressDots from "./ProgressDots";
import {
  v2FontWeight,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
  v2Motion,
} from "../src/design";
import {
  getCurrentStreak,
  getWeeklyProgress,
  wasCompletedToday,
} from "../utils/habitStats";
import { withAlpha } from "../utils/colorUtils";
import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_EMOJI,
} from "../constants/habitOptions";
import { useTheme } from "../context/ThemeContext";
import { router } from "expo-router";
import { useReducedMotion } from "../hooks/useReducedMotion";

const SWIPE_COMPLETE_COLOR = "#4F755B";
const SWIPE_UNDO_COLOR = "#85494D";
const SWIPE_START_DISTANCE = 6;
const SWIPE_DIRECTION_RATIO = 1.15;
const SWIPE_THRESHOLD = 30;
const SWIPE_LIMIT = 112;

function HabitCard({
  enableLongPressReorder = true,
  enableSwipeToComplete = true,
  habit,
  onReorderPress,
  onToggleComplete,
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const styles = useMemo(
    () => createStyles(colors, isCompact),
    [colors, isCompact]
  );
  const completedToday = wasCompletedToday(habit);
  const currentStreak = getCurrentStreak(habit.completedDates, habit);
  const weeklyProgress = getWeeklyProgress(habit);
  const icon = habit.emoji || DEFAULT_HABIT_EMOJI;
  const accentColor = habit.color || DEFAULT_HABIT_COLOR;
  const themeAccent = colors.accent || colors.primary;
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeHapticTriggered = useRef(false);
  const tapBlockedBySwipe = useRef(false);
  const tapBlockTimeoutRef = useRef(null);
  const completeProgressWidth = swipeX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD, SWIPE_LIMIT],
    outputRange: ["0%", "58%", "100%"],
    extrapolate: "clamp",
  });
  const undoProgressWidth = swipeX.interpolate({
    inputRange: [-SWIPE_LIMIT, -SWIPE_THRESHOLD, 0],
    outputRange: ["100%", "58%", "0%"],
    extrapolate: "clamp",
  });
  const completeIndicatorScale = swipeX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0.72, 1.18],
    extrapolate: "clamp",
  });
  const undoIndicatorScale = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1.18, 0.72],
    extrapolate: "clamp",
  });
  const completeIndicatorOpacity = swipeX.interpolate({
    inputRange: [0, 12, SWIPE_THRESHOLD],
    outputRange: [0.25, 0.7, 1],
    extrapolate: "clamp",
  });
  const undoIndicatorOpacity = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -12, 0],
    outputRange: [1, 0.7, 0],
    extrapolate: "clamp",
  });
  const completeInstructionOpacity = swipeX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0.75, 1],
    extrapolate: "clamp",
  });
  const undoInstructionOpacity = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const completeActionOpacity = swipeX.interpolate({
    inputRange: [0, 6, SWIPE_THRESHOLD],
    outputRange: [0, 0.75, 1],
    extrapolate: "clamp",
  });
  const undoActionOpacity = swipeX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -6, 0],
    outputRange: [1, 0.75, 0],
    extrapolate: "clamp",
  });
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          if (!enableSwipeToComplete) {
            return false;
          }

          const horizontalDistance = Math.abs(gestureState.dx);
          const verticalDistance = Math.abs(gestureState.dy);
          const validDirection =
            (!completedToday && gestureState.dx > 0) ||
            (completedToday && gestureState.dx < 0);

          return (
            validDirection &&
            horizontalDistance > SWIPE_START_DISTANCE &&
            horizontalDistance > verticalDistance * SWIPE_DIRECTION_RATIO
          );
        },
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!enableSwipeToComplete) {
            return false;
          }

          const horizontalSwipe =
            ((!completedToday && gestureState.dx > 0) ||
              (completedToday && gestureState.dx < 0)) &&
            Math.abs(gestureState.dx) > SWIPE_START_DISTANCE &&
            Math.abs(gestureState.dx) >
              Math.abs(gestureState.dy) * SWIPE_DIRECTION_RATIO;

          if (!horizontalSwipe) {
            return false;
          }

          return horizontalSwipe;
        },
        onPanResponderMove: (_, gestureState) => {
          if (Math.abs(gestureState.dx) > 5) {
            tapBlockedBySwipe.current = true;
          }

          let nextSwipeX = 0;

          if (!completedToday && gestureState.dx > 0) {
            nextSwipeX = Math.min(gestureState.dx, SWIPE_LIMIT);
          }

          if (completedToday && gestureState.dx < 0) {
            nextSwipeX = Math.max(gestureState.dx, -SWIPE_LIMIT);
          }

          swipeX.setValue(nextSwipeX);

          if (
            Math.abs(nextSwipeX) >= SWIPE_THRESHOLD &&
            !swipeHapticTriggered.current
          ) {
            swipeHapticTriggered.current = true;
            triggerSelectionHaptic();
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (
            enableSwipeToComplete &&
            !completedToday &&
            gestureState.dx > SWIPE_THRESHOLD
          ) {
            runSwipeSuccessAnimation(swipeX, SWIPE_LIMIT, reduceMotion, () => {
              swipeHapticTriggered.current = false;
              resetTapBlock();
            });
            onToggleComplete(habit, { source: "swipe" });
            return;
          }

          if (
            enableSwipeToComplete &&
            completedToday &&
            gestureState.dx < -SWIPE_THRESHOLD
          ) {
            runSwipeSuccessAnimation(swipeX, -SWIPE_LIMIT, reduceMotion, () => {
              swipeHapticTriggered.current = false;
              resetTapBlock();
            });
            onToggleComplete(habit, { source: "swipe-undo" });
            return;
          }

          swipeHapticTriggered.current = false;
          runSwipeResetAnimation(swipeX, reduceMotion, resetTapBlock);
        },
        onPanResponderTerminate: () => {
          swipeHapticTriggered.current = false;
          runSwipeResetAnimation(swipeX, reduceMotion, resetTapBlock);
        },
      }),
    [
      completedToday,
      enableSwipeToComplete,
      habit,
      onToggleComplete,
      reduceMotion,
      swipeX,
    ]
  );
  const swipeActionBackground = SWIPE_COMPLETE_COLOR;
  const undoActionBackground = SWIPE_UNDO_COLOR;
  const completionLabel = completedToday
    ? "Completed today"
    : "Not completed today";
  const habitCardHint = completedToday
    ? "Swipe left to undo today's completion, or double tap to open details."
    : "Swipe right to complete today, or double tap to open details.";

  useEffect(
    () => () => {
      if (tapBlockTimeoutRef.current) {
        clearTimeout(tapBlockTimeoutRef.current);
      }

      swipeX.stopAnimation();
    },
    [swipeX]
  );

  function resetTapBlock() {
    if (tapBlockTimeoutRef.current) {
      clearTimeout(tapBlockTimeoutRef.current);
    }

    tapBlockTimeoutRef.current = setTimeout(() => {
      tapBlockedBySwipe.current = false;
      tapBlockTimeoutRef.current = null;
    }, 90);
  }

  function handleOpenHabit() {
    if (tapBlockedBySwipe.current) {
      return;
    }

    router.push(`/habit/${habit.id}`);
  }

  return (
    <View
      {...panResponder.panHandlers}
      style={styles.swipeWrap}
    >
      <Animated.View
        style={[
          styles.swipeAction,
          styles.completeAction,
          {
            backgroundColor: swipeActionBackground,
            borderColor: SWIPE_COMPLETE_COLOR,
            opacity: completeActionOpacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.swipeProgress,
            {
              backgroundColor: "rgba(255, 255, 255, 0.22)",
              width: completeProgressWidth,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.swipeIndicator,
            {
              opacity: completeIndicatorOpacity,
              transform: [{ scale: completeIndicatorScale }],
            },
          ]}
        >
          <AppIcon color="#111111" name="check" size={18} strokeWidth={2.4} />
        </Animated.View>
        <Animated.Text
          style={[styles.swipeText, { opacity: completeInstructionOpacity }]}
        >
          Complete
        </Animated.Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.swipeAction,
          styles.undoAction,
          {
            backgroundColor: undoActionBackground,
            borderColor: SWIPE_UNDO_COLOR,
            opacity: undoActionOpacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.undoSwipeProgress,
            {
              backgroundColor: "rgba(255, 255, 255, 0.18)",
              width: undoProgressWidth,
            },
          ]}
        />
        <Animated.Text
          style={[styles.swipeText, { opacity: undoInstructionOpacity }]}
        >
          Undo
        </Animated.Text>
        <Animated.View
          style={[
            styles.swipeIndicator,
            {
              opacity: undoIndicatorOpacity,
              transform: [{ scale: undoIndicatorScale }],
            },
          ]}
        >
          <AppIcon color="#111111" name="undo" size={18} strokeWidth={2.2} />
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[
          styles.card,
          {
            borderColor: completedToday
              ? themeAccent
              : colors.habitCardBorder || withAlpha(accentColor, 0.58),
            backgroundColor: colors.card,
            shadowColor: completedToday ? themeAccent : colors.shadow,
            transform: [{ translateX: swipeX }],
          },
          completedToday && styles.cardCompleted,
          styles.cardLayer,
        ]}
      >
        <View style={styles.topRow}>
          <Pressable
            accessibilityActions={[
              { name: "activate", label: "Open details" },
              {
                name: "toggleComplete",
                label: completedToday ? "Undo today" : "Complete today",
              },
              { name: "longpress", label: "Reorder habit" },
            ]}
            accessibilityHint={habitCardHint}
            accessibilityLabel={`${habit.name}, ${habit.category || "General"}, ${currentStreak} day streak, ${completionLabel}`}
            accessibilityRole="button"
            accessibilityState={{ selected: completedToday }}
            delayLongPress={260}
            onLongPress={() => {
              if (enableLongPressReorder) {
                onReorderPress?.(habit);
              }
            }}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === "activate") {
                handleOpenHabit();
              }

              if (event.nativeEvent.actionName === "toggleComplete") {
                onToggleComplete(habit, { source: "accessibility" });
              }

              if (event.nativeEvent.actionName === "longpress") {
                onReorderPress?.(habit);
              }
            }}
            onPress={handleOpenHabit}
            style={({ pressed }) => [
              styles.cardMainContent,
              pressed && styles.cardMainPressed,
            ]}
          >
            <View style={styles.identity}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: withAlpha(accentColor, 0.1),
                    borderColor: withAlpha(accentColor, 0.28),
                  },
                ]}
              >
                <AppText align="center" style={styles.icon}>
                  {icon}
                </AppText>
              </View>

              <View style={styles.titleGroup}>
                <AppText
                  color={colors.text}
                  numberOfLines={2}
                  style={styles.name}
                  variant="cardTitle"
                >
                  {habit.name}
                </AppText>
                <AppText
                  color={colors.muted}
                  numberOfLines={1}
                  style={styles.category}
                  variant="caption"
                >
                  {habit.category || "General"}
                </AppText>
              </View>
            </View>
          </Pressable>

          <View style={styles.rightActions} pointerEvents="none">
            <View
              style={[
                styles.completionDot,
                completedToday && {
                  backgroundColor: themeAccent,
                  borderColor: themeAccent,
                },
              ]}
            />
            <View
              accessibilityLabel={`${currentStreak} day streak`}
              style={styles.streakBadge}
            >
              <AppIcon
                color={completedToday ? themeAccent : colors.muted}
                name="flame"
                size={15}
                strokeWidth={1.6}
              />
              <AppText
                color={colors.muted}
                style={styles.streakText}
                numberOfLines={1}
              >
                {currentStreak}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.weekRow}>
          <ProgressDots days={weeklyProgress} compact />
        </View>
      </Animated.View>
    </View>
  );
}

export default memo(HabitCard);

function getSwipeSpringConfig(toValue) {
  return {
    damping: v2Motion.spring.damping,
    mass: v2Motion.spring.mass,
    stiffness: v2Motion.spring.stiffness,
    toValue,
    useNativeDriver: false,
  };
}

function runSwipeSuccessAnimation(animatedValue, toValue, reduceMotion, onComplete) {
  if (reduceMotion) {
    animatedValue.setValue(0);
    onComplete?.();
    return;
  }

  Animated.sequence([
    Animated.spring(animatedValue, getSwipeSpringConfig(toValue)),
    Animated.spring(animatedValue, getSwipeSpringConfig(0)),
  ]).start(onComplete);
}

function runSwipeResetAnimation(animatedValue, reduceMotion, onComplete) {
  if (reduceMotion) {
    animatedValue.setValue(0);
    onComplete?.();
    return;
  }

  Animated.spring(animatedValue, getSwipeSpringConfig(0)).start(onComplete);
}

function createStyles(colors, isCompact) {
  return StyleSheet.create({
    swipeWrap: {
      borderRadius: v2Radius.large,
      marginBottom: 1,
      maxWidth: "100%",
      overflow: "hidden",
      position: "relative",
      width: "100%",
    },
    swipeAction: {
      alignItems: "center",
      borderRadius: v2Radius.large,
      borderWidth: 0,
      bottom: 0,
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "flex-start",
      left: 0,
      paddingHorizontal: isCompact ? v2Spacing.lg : v2Spacing.xl,
      position: "absolute",
      top: 0,
      width: "100%",
      zIndex: 1,
    },
    completeAction: {
      justifyContent: "flex-start",
    },
    undoAction: {
      justifyContent: "flex-end",
    },
    swipeProgress: {
      bottom: 0,
      left: 0,
      opacity: 0.28,
      position: "absolute",
      top: 0,
    },
    undoSwipeProgress: {
      bottom: 0,
      opacity: 0.24,
      position: "absolute",
      right: 0,
      top: 0,
    },
    swipeIndicator: {
      alignItems: "center",
      backgroundColor: "rgba(243, 243, 243, 0.92)",
      borderRadius: v2Radius.pill,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    swipeText: {
      color: "#F3F3F3",
      ...v2Typography.button,
      fontWeight: v2FontWeight.bold,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.habitCardBorder || colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      maxWidth: "100%",
      minHeight: isCompact ? 88 : 94,
      paddingHorizontal: isCompact ? v2Spacing.md : v2Spacing.lg,
      paddingVertical: isCompact ? 12 : 14,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      width: "100%",
    },
    cardLayer: {
      zIndex: 2,
    },
    cardCompleted: {
      borderWidth: 1.5,
      ...v2Shadows.medium,
      shadowColor: colors.accent || colors.primary,
      shadowOpacity: 0.16,
    },
    topRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
      maxWidth: "100%",
    },
    cardMainContent: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      flexShrink: 1,
      gap: v2Spacing.md,
      justifyContent: "space-between",
      minHeight: 52,
      minWidth: 0,
    },
    cardMainPressed: {
      opacity: 0.74,
    },
    identity: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      flexShrink: 1,
      gap: isCompact ? 10 : v2Spacing.md,
      minWidth: 0,
    },
    iconBadge: {
      alignItems: "center",
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      height: isCompact ? 44 : 46,
      justifyContent: "center",
      width: isCompact ? 44 : 46,
    },
    icon: {
      fontSize: isCompact ? 21 : 23,
      lineHeight: isCompact ? 26 : 28,
    },
    titleGroup: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
    },
    name: {
      fontSize: isCompact ? 15 : v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.semibold,
      letterSpacing: 0,
    },
    category: {
      marginTop: 3,
      lineHeight: v2Typography.caption.lineHeight,
      minWidth: 0,
    },
    rightActions: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      gap: isCompact ? v2Spacing.sm : 10,
    },
    weekRow: {
      marginTop: 10,
      maxWidth: "100%",
      paddingTop: 2,
      width: "100%",
    },
    completionDot: {
      backgroundColor: "transparent",
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1.5,
      height: 14,
      width: 14,
    },
    streakBadge: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      gap: v2Spacing.xs,
      justifyContent: "center",
      maxWidth: isCompact ? 54 : 62,
      minHeight: 28,
    },
    streakText: {
      flexShrink: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.label.lineHeight,
    },
  });
}

async function triggerSelectionHaptic() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptic feedback is optional and should never interrupt swipe completion.
  }
}
