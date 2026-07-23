import { memo, useMemo, useRef } from "react";
import * as Haptics from "expo-haptics";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import ProgressDots from "./ProgressDots";
import {
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  spacing,
} from "../constants/typography";
import {
  getCurrentStreak,
  getWeeklyProgress,
  wasCompletedToday,
} from "../utils/habitStats";
import { DEFAULT_HABIT_COLOR } from "../constants/habitOptions";
import { useTheme } from "../context/ThemeContext";
import { router } from "expo-router";

const SWIPE_COMPLETE_COLOR = "#3A8B5A";
const SWIPE_UNDO_COLOR = "#A94C50";
const SWIPE_THRESHOLD = 38;
const SWIPE_LIMIT = 112;

function HabitCard({
  enableLongPressReorder = true,
  enableSwipeToComplete = true,
  habit,
  onReorderPress,
  onToggleComplete,
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const styles = useMemo(
    () => createStyles(colors, isCompact),
    [colors, isCompact]
  );
  const completedToday = wasCompletedToday(habit);
  const currentStreak = getCurrentStreak(habit.completedDates);
  const weeklyProgress = getWeeklyProgress(habit);
  const icon = habit.emoji || "✨";
  const accentColor = habit.color || DEFAULT_HABIT_COLOR;
  const themeAccent = colors.accent || colors.primary;
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeHapticTriggered = useRef(false);
  const tapBlockedBySwipe = useRef(false);
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

          return (
            horizontalDistance > 4 &&
            horizontalDistance > verticalDistance * 0.55
          );
        },
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!enableSwipeToComplete) {
            return false;
          }

          const horizontalSwipe =
            Math.abs(gestureState.dx) > 4 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 0.55;

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
            Animated.sequence([
              Animated.spring(swipeX, {
                toValue: SWIPE_LIMIT,
                useNativeDriver: false,
              }),
              Animated.spring(swipeX, {
                toValue: 0,
                useNativeDriver: false,
              }),
            ]).start(() => {
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
            Animated.sequence([
              Animated.spring(swipeX, {
                toValue: -SWIPE_LIMIT,
                useNativeDriver: false,
              }),
              Animated.spring(swipeX, {
                toValue: 0,
                useNativeDriver: false,
              }),
            ]).start(() => {
              swipeHapticTriggered.current = false;
              resetTapBlock();
            });
            onToggleComplete(habit, { source: "swipe-undo" });
            return;
          }

          swipeHapticTriggered.current = false;
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: false,
          }).start(resetTapBlock);
        },
        onPanResponderTerminate: () => {
          swipeHapticTriggered.current = false;
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: false,
          }).start(resetTapBlock);
        },
      }),
    [completedToday, enableSwipeToComplete, habit, onToggleComplete, swipeX]
  );
  const swipeActionBackground = SWIPE_COMPLETE_COLOR;
  const undoActionBackground = SWIPE_UNDO_COLOR;

  function resetTapBlock() {
    setTimeout(() => {
      tapBlockedBySwipe.current = false;
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
          <Text style={styles.swipeIcon}>✓</Text>
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
          <Text style={styles.swipeIcon}>↶</Text>
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
            accessibilityHint="Swipe right to complete, swipe left to undo, or double tap to open details."
            accessibilityLabel={`${habit.name}, ${habit.category || "General"}, ${currentStreak} day streak`}
            accessibilityRole="button"
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
                  backgroundColor: withAlpha(accentColor, 0.08),
                  borderColor: withAlpha(accentColor, 0.22),
                },
              ]}
            >
              <Text style={styles.icon}>{icon}</Text>
            </View>

            <View style={styles.titleGroup}>
              <Text style={styles.name} numberOfLines={1}>
                {habit.name}
              </Text>
              <Text style={styles.category} numberOfLines={1}>
                {habit.category || "General"}
              </Text>
            </View>
          </View>

          </Pressable>

          <View
            style={styles.rightActions}
            pointerEvents="none"
          >
            <View
              accessibilityLabel={`${currentStreak} day streak`}
              style={styles.streakBadge}
            >
              <Text style={styles.streakIcon}>🔥</Text>
              <Text
                style={styles.streakText}
                numberOfLines={1}
              >
                {currentStreak}
              </Text>
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

function createStyles(colors, isCompact) {
  return StyleSheet.create({
    swipeWrap: {
      borderRadius: radius.lg,
      maxWidth: "100%",
      overflow: "hidden",
      position: "relative",
      width: "100%",
    },
    swipeAction: {
      alignItems: "center",
      borderRadius: radius.lg,
      borderWidth: 1,
      bottom: 0,
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "flex-start",
      left: 0,
      paddingHorizontal: spacing.xl,
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
      backgroundColor: "rgba(255, 255, 255, 0.92)",
      borderRadius: radius.round,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    swipeIcon: {
      color: "#173024",
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    swipeText: {
      color: colors.inverseText,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.habitCardBorder || colors.border,
      borderRadius: radius.xl,
      borderWidth: 1,
      maxWidth: "100%",
      padding: isCompact ? spacing.md : spacing.lg,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.055,
      shadowRadius: 14,
      elevation: 1,
      width: "100%",
    },
    cardLayer: {
      zIndex: 2,
    },
    cardCompleted: {
      borderWidth: 2,
      elevation: 3,
      shadowOpacity: 0.12,
      shadowRadius: 14,
    },
    topRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      maxWidth: "100%",
    },
    cardMainContent: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      flexShrink: 1,
      gap: spacing.md,
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
      gap: isCompact ? 10 : spacing.md,
      minWidth: 0,
    },
    iconBadge: {
      alignItems: "center",
      borderRadius: radius.lg,
      borderWidth: 1,
      height: isCompact ? 42 : 46,
      justifyContent: "center",
      width: isCompact ? 42 : 46,
    },
    icon: {
      fontSize: isCompact ? 21 : 23,
    },
    titleGroup: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
    },
    name: {
      color: colors.text,
      fontSize: isCompact ? fontSize.bodyLarge : fontSize.cardTitle,
      fontWeight: fontWeight.bold,
      letterSpacing: 0,
    },
    category: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.regular,
      marginTop: spacing.xs,
    },
    rightActions: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      gap: spacing.sm,
    },
    weekRow: {
      marginTop: spacing.md,
      maxWidth: "100%",
      paddingTop: 2,
      width: "100%",
    },
    streakBadge: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      gap: spacing.xs,
      justifyContent: "center",
      maxWidth: 54,
      minHeight: 30,
    },
    streakIcon: {
      fontSize: fontSize.label,
      lineHeight: lineHeight.caption,
    },
    streakText: {
      color: colors.muted,
      flexShrink: 1,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
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
