import { memo, useEffect, useMemo, useRef } from "react";
import * as Haptics from "expo-haptics";
import {
  Animated,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { AppIcon, AppText } from "./ui";
import ProgressDots from "./ProgressDots";
import {
  v2ActionColors,
  v2Breakpoints,
  v2FontWeight,
  v2Layout,
  v2PressedStyles,
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

const SWIPE_COMPLETE_COLOR = v2ActionColors.complete;
const SWIPE_UNDO_COLOR = v2ActionColors.undo;
// How far (px) a drag has to travel in the valid direction before the Pan
// gesture activates and starts driving swipeX/the background reveal. Same
// value the old PanResponder used as its own capture distance - keeps the
// "card starts sliding almost immediately" feel unchanged.
const SWIPE_START_DISTANCE = 6;
// How far (px) a touch can drift vertically before activation without
// failing the gesture to the parent FlatList's scroll. Replaces the old
// manual dx/dy-ratio check (SWIPE_DIRECTION_RATIO) with RNGH's declarative
// failOffsetY, evaluated by the native recognizer instead of a JS heuristic
// computed after each bridge-crossing touch-move - the actual fix for the
// FlatList-vs-card arbitration weakness the migration exists for. Slightly
// more generous than the old ratio math implied (~5px at the old 6px/1.15
// activation point) specifically because this arbitration is now handled by
// the platform's own recognizer, not a JS race.
const SWIPE_FAIL_OFFSET_Y = 10;
// Distance (px) a drag must cross past activation for onEnd to count it as
// a deliberate swipe-to-complete/undo, independent of speed. Unchanged from
// the prior PanResponder implementation's SWIPE_THRESHOLD.
const SWIPE_THRESHOLD = 30;
// Velocity (px/s) past which onEnd counts a fast, short flick as a trigger
// even if it never crossed SWIPE_THRESHOLD - the actual fix for "a fast
// flick does nothing" (root cause #1 from the Thread B interaction
// survey): the old PanResponder release handler never read gestureState.vx
// at all. No prior value existed to preserve here, so this is a judgment
// call: 800px/s sits in the range commonly used to distinguish a genuine
// flick from a fast-but-controlled drag in RN swipeable-row
// implementations (roughly 500-1000px/s in community practice) - fast
// enough that an ordinary deliberate drag past SWIPE_THRESHOLD won't
// double-trigger via this branch, but well below what it takes to
// physically flick a phone screen with intent.
const SWIPE_MIN_VELOCITY = 800;
const SWIPE_LIMIT = 112;

function HabitCard({
  canMoveDown = false,
  canMoveUp = false,
  canPin = false,
  enableLongPressReorder = true,
  enableSwipeToComplete = true,
  habit,
  isPinned = false,
  onMoveDown,
  onMoveUp,
  onReorderPress,
  onToggleComplete,
  onTogglePin,
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const isCompact = width < v2Breakpoints.smallScreenMaxWidth;
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
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enableSwipeToComplete)
        // Declarative direction+start-distance gate, evaluated by the native
        // recognizer instead of a JS onMoveShouldSetPanResponder(Capture)
        // heuristic - only the valid direction for the current completion
        // state can activate the gesture at all.
        .activeOffsetX(
          completedToday
            ? [-Infinity, -SWIPE_START_DISTANCE]
            : [SWIPE_START_DISTANCE, Infinity]
        )
        .failOffsetY([-SWIPE_FAIL_OFFSET_Y, SWIPE_FAIL_OFFSET_Y])
        .onUpdate((event) => {
          if (Math.abs(event.translationX) > 5) {
            tapBlockedBySwipe.current = true;
          }

          let nextSwipeX = 0;

          if (!completedToday && event.translationX > 0) {
            nextSwipeX = Math.min(event.translationX, SWIPE_LIMIT);
          }

          if (completedToday && event.translationX < 0) {
            nextSwipeX = Math.max(event.translationX, -SWIPE_LIMIT);
          }

          swipeX.setValue(nextSwipeX);

          if (
            Math.abs(nextSwipeX) >= SWIPE_THRESHOLD &&
            !swipeHapticTriggered.current
          ) {
            swipeHapticTriggered.current = true;
            triggerSelectionHaptic();
          }
        })
        .onEnd((event, success) => {
          // success is false when the gesture was interrupted (e.g. the
          // parent FlatList's scroll won the arbitration) rather than ending
          // on its own - equivalent to the old onPanResponderTerminate path.
          if (!success) {
            swipeHapticTriggered.current = false;
            runSwipeResetAnimation(swipeX, reduceMotion, resetTapBlock);
            return;
          }

          const { translationX, velocityX } = event;
          // Either a deliberate drag past SWIPE_THRESHOLD, or a fast flick
          // past SWIPE_MIN_VELOCITY that never reached the distance
          // threshold - the actual fix for "a fast flick does nothing"
          // (root cause #1 from the interaction survey). requiring
          // translationX to have crossed SWIPE_START_DISTANCE keeps a
          // stray high-velocity reading with near-zero movement from
          // triggering on its own.
          const completeReached =
            !completedToday &&
            translationX > SWIPE_START_DISTANCE &&
            (translationX > SWIPE_THRESHOLD || velocityX > SWIPE_MIN_VELOCITY);
          const undoReached =
            completedToday &&
            translationX < -SWIPE_START_DISTANCE &&
            (translationX < -SWIPE_THRESHOLD ||
              velocityX < -SWIPE_MIN_VELOCITY);

          if (completeReached) {
            runSwipeSuccessAnimation(swipeX, SWIPE_LIMIT, reduceMotion, () => {
              swipeHapticTriggered.current = false;
              resetTapBlock();
            });
            onToggleComplete(habit, { source: "swipe" });
            return;
          }

          if (undoReached) {
            runSwipeSuccessAnimation(swipeX, -SWIPE_LIMIT, reduceMotion, () => {
              swipeHapticTriggered.current = false;
              resetTapBlock();
            });
            onToggleComplete(habit, { source: "swipe-undo" });
            return;
          }

          swipeHapticTriggered.current = false;
          runSwipeResetAnimation(swipeX, reduceMotion, resetTapBlock);
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
    ? "Swipe left or use the tick button to undo today's completion, or double tap to open details."
    : "Swipe right or use the tick button to complete today, or double tap to open details.";

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
    <GestureDetector gesture={panGesture}>
      <View style={styles.swipeWrap}>
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
            <AppIcon
              color={v2ActionColors.completeIcon}
              name="check"
              size={18}
              strokeWidth={2.4}
            />
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
            <AppIcon
              color={v2ActionColors.undoIcon}
              name="undo"
              size={18}
              strokeWidth={2.2}
            />
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
                  <View style={styles.nameRow}>
                    {isPinned || canPin ? (
                      <Pressable
                        accessibilityLabel={
                          isPinned
                            ? `Unpin ${habit.name} from today's focus`
                            : `Pin ${habit.name} to today's focus`
                        }
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => onTogglePin?.(habit)}
                        style={({ pressed }) => [
                          styles.pinButton,
                          pressed && v2PressedStyles.button,
                        ]}
                      >
                        <AppIcon
                          color={isPinned ? colors.primary : colors.softText}
                          name="star"
                          size={15}
                          strokeWidth={2}
                        />
                      </Pressable>
                    ) : null}
                    <AppText
                      color={colors.text}
                      numberOfLines={2}
                      style={styles.name}
                      variant="cardTitle"
                    >
                      {habit.name}
                    </AppText>
                  </View>
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

            <Pressable
              accessibilityLabel={
                completedToday
                  ? `Undo today's completion of ${habit.name}`
                  : `Complete ${habit.name} for today`
              }
              accessibilityRole="button"
              accessibilityState={{ selected: completedToday }}
              hitSlop={4}
              onPress={() => onToggleComplete(habit, { source: "tick" })}
              style={({ pressed }) => [
                styles.tickButton,
                completedToday && {
                  backgroundColor: themeAccent,
                  borderColor: themeAccent,
                },
                pressed && v2PressedStyles.button,
              ]}
            >
              <AppIcon
                color={completedToday ? v2ActionColors.completeIcon : colors.muted}
                name="check"
                size={18}
                strokeWidth={2.4}
              />
            </Pressable>
          </View>

          {isPinned ? (
            <View style={styles.pinControlsRow}>
              <AppText style={styles.pinControlsLabel}>Today's Focus</AppText>
              <View style={styles.pinControlsButtons}>
                <Pressable
                  accessibilityLabel={`Move ${habit.name} up in today's focus`}
                  accessibilityRole="button"
                  disabled={!canMoveUp}
                  hitSlop={8}
                  onPress={() => onMoveUp?.(habit)}
                  style={({ pressed }) => [
                    styles.pinControlButton,
                    !canMoveUp && styles.pinControlButtonDisabled,
                    pressed && v2PressedStyles.button,
                  ]}
                >
                  <AppIcon
                    color={canMoveUp ? colors.text : colors.softText}
                    name="chevron-up"
                    size={15}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Move ${habit.name} down in today's focus`}
                  accessibilityRole="button"
                  disabled={!canMoveDown}
                  hitSlop={8}
                  onPress={() => onMoveDown?.(habit)}
                  style={({ pressed }) => [
                    styles.pinControlButton,
                    !canMoveDown && styles.pinControlButtonDisabled,
                    pressed && v2PressedStyles.button,
                  ]}
                >
                  <AppIcon
                    color={canMoveDown ? colors.text : colors.softText}
                    name="chevron-down"
                    size={15}
                  />
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.weekRow}>
            <View style={styles.streakBadge}>
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
            <ProgressDots days={weeklyProgress} compact />
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
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
      color: v2ActionColors.completeText,
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
    nameRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.xs,
    },
    pinButton: {
      alignItems: "center",
      flexShrink: 0,
      justifyContent: "center",
    },
    name: {
      flexShrink: 1,
      fontSize: isCompact ? 15 : v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.semibold,
      letterSpacing: 0,
    },
    category: {
      marginTop: 3,
      lineHeight: v2Typography.caption.lineHeight,
      minWidth: 0,
    },
    pinControlsRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    pinControlsLabel: {
      color: colors.softText,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      letterSpacing: 0.2,
      textTransform: "uppercase",
    },
    pinControlsButtons: {
      flexDirection: "row",
      gap: v2Spacing.xs,
    },
    pinControlButton: {
      alignItems: "center",
      borderColor: colors.border,
      borderRadius: v2Radius.small,
      borderWidth: 1,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    pinControlButtonDisabled: {
      opacity: 0.4,
    },
    // Real, tappable alternative to the swipe gesture (Phase 10 Thread B) -
    // not a replacement, both call the same onToggleComplete. Sized to the
    // app's minTapTarget convention (Thread A's category-button fix) and
    // uses the same contrast-fixed colors.border/colors.card idle tokens,
    // so it doesn't reintroduce the low-contrast idle state that fix
    // addressed.
    tickButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexShrink: 0,
      height: v2Layout.minTapTarget,
      justifyContent: "center",
      width: v2Layout.minTapTarget,
    },
    weekRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.md,
      marginTop: 10,
      maxWidth: "100%",
      paddingTop: 2,
      width: "100%",
    },
    // Relocated from the card's top-right corner (Phase 10 Thread B) to
    // make room for the tick button there - grouped with ProgressDots in
    // the same row since both are progress/streak indicators, and this
    // row already has full width to spare rather than competing with the
    // name/category text's flex:1/flexShrink:1 space upstream.
    streakBadge: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      gap: v2Spacing.xs,
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
