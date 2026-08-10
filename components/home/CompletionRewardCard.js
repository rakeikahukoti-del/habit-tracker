import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { v2CompactSpacing, v2FontWeight, v2Motion, v2PressedStyles, v2Radius, v2Shadows, v2Spacing, v2Typography } from "../../src/design";
import { XP_PER_LEVEL } from "../../utils/gamification";

export default function CompletionRewardCard({ reward, onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  // Same spring scale-in as BadgeUnlockCard.js - this is the most-seen
  // reward moment in the app (every completion, not just milestones), so it
  // gets the same entrance treatment rather than popping in instantly.
  const scaleAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0.72)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      scaleAnim.setValue(1);
      return;
    }

    scaleAnim.setValue(0.72);

    const animation = Animated.spring(scaleAnim, {
      damping: v2Motion.spring.damping,
      mass: v2Motion.spring.mass,
      stiffness: v2Motion.spring.stiffness,
      toValue: 1,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [reduceMotion, reward.habitName, reward.streak, reward.xpEarned, scaleAnim]);

  function handleDismiss() {
    if (reduceMotion) {
      onDismiss();
      return;
    }

    Animated.parallel([
      Animated.timing(scaleAnim, {
        duration: v2Motion.duration.fast,
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        duration: v2Motion.duration.fast,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDismiss();
      }
    });
  }

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        accessibilityLabel={`${reward.habitName} completed. ${reward.xpEarned} XP earned. ${reward.streak} day streak. Double tap to dismiss.`}
        accessibilityRole="button"
        onPress={handleDismiss}
        style={({ pressed }) => [
          styles.completionPopup,
          pressed && v2PressedStyles.card,
        ]}
      >
        <View style={styles.completionPopupTop}>
          <AppText style={styles.completionPopupEyebrow}>Completed</AppText>
          <AppText style={styles.completionPopupXp}>
            +{reward.xpEarned} XP
          </AppText>
        </View>
        <AppText style={styles.completionPopupTitle} numberOfLines={2}>
          {reward.habitName}
        </AppText>
        <AppText style={styles.completionPopupMeta}>
          {reward.streak} day streak • {reward.rank} •{" "}
          {reward.rankProgress}/{XP_PER_LEVEL} XP
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    completionPopup: {
      backgroundColor: colors.card,
      borderColor: colors.accent,
      borderRadius: v2Radius.feature,
      borderWidth: 1.5,
      marginBottom: v2Spacing.sm,
      paddingHorizontal: 16,
      paddingVertical: v2CompactSpacing.md,
      ...v2Shadows.medium,
      shadowColor: colors.accent,
      shadowOpacity: 0.16,
    },
    completionPopupTop: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    completionPopupEyebrow: {
      color: colors.accent,
      fontSize: v2Typography.navigationLabel.fontSize,
      fontWeight: v2FontWeight.bold,
      textTransform: "uppercase",
    },
    completionPopupXp: {
      color: colors.primary,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    completionPopupTitle: {
      color: colors.text,
      fontSize: v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    completionPopupMeta: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
      marginTop: 5,
    },
  });
}
