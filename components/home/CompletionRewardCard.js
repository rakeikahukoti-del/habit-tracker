import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { AppText, ModalShell } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { v2FontWeight, v2Motion, v2PressedStyles, v2Radius, v2Typography } from "../../src/design";
import { XP_PER_LEVEL } from "../../utils/gamification";

// Promoted from an inline banner to a ModalShell overlay (Phase 6 Home
// restructure) alongside BadgeUnlockCard/CelebrationBanner, so all 5 states
// in the activeRewardType priority queue share one presentation and none
// can scroll out of view now that Home is a single scrollable list - this
// one especially, since it fires on every completion (not just milestones)
// and previously could render off-screen above a scrolled position with no
// way for the user to see it before it auto-dismissed. The card's own
// accent-tinted border/shadow is dropped in favor of ModalShell's shared
// neutral chrome - a real, visible styling change made in exchange for all
// 5 reward states now looking and behaving identically.
export default function CompletionRewardCard({ onClose, reward, visible }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  // Same spring scale-in as BadgeUnlockCard.js - this is the most-seen
  // reward moment in the app (every completion, not just milestones), so it
  // gets the same entrance treatment rather than popping in instantly.
  const scaleAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0.72)).current;

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    if (reduceMotion) {
      scaleAnim.setValue(1);
      return undefined;
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
  }, [reduceMotion, reward?.habitName, reward?.streak, reward?.xpEarned, scaleAnim, visible]);

  if (!reward) {
    return null;
  }

  return (
    <ModalShell
      maxWidth={360}
      onClose={onClose}
      padding={22}
      reduceMotion={reduceMotion}
      visible={visible}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          accessibilityLabel={`${reward.habitName} completed. ${reward.xpEarned} XP earned. ${reward.streak} day streak. Double tap to dismiss.`}
          accessibilityRole="button"
          onPress={onClose}
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
    </ModalShell>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    completionPopup: {
      borderRadius: v2Radius.medium,
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
