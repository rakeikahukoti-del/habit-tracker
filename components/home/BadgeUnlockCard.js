import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { BadgeMedal } from "../progression";
import { AppText, ModalShell } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { getBadgeGlowDuration } from "../../utils/badgeUnlockTiming";
import {
  v2CompactSpacing,
  v2FontWeight,
  v2Motion,
  v2PressedStyles,
  v2Radius,
  v2Typography,
} from "../../src/design";

// Promoted from an inline banner to a ModalShell overlay - see
// CompletionRewardCard.js for the full rationale (all 5 activeRewardType
// states now share one presentation). The medal's own glow effect is kept;
// the outer card's bespoke border/shadow is dropped in favor of ModalShell's
// shared chrome.
//
// Tier-weighted glow (Phase 8 badge/rank survey, Proposal A): Bronze/
// Silver/Gold/Platinum keep the original spring-scale + glow exactly as
// authored. Diamond and Master - the two rarest tiers - get the same
// animation shape with the glow's ramp-in stretched an extra ~500ms, so
// the moment reads as visibly slower/more deliberate rather than a
// bigger or brighter effect. Spring-scale is untouched for every tier;
// only the glow's timing branches. Duration now lives in
// utils/badgeUnlockTiming.js so useHomeController.js's auto-dismiss timer
// can derive from the same numbers (Phase 9 fix #5).
export default function BadgeUnlockCard({ badge, onClose, visible }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const scaleAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0.72)).current;
  const glowAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const glowDuration = getBadgeGlowDuration(badge?.tier);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    if (reduceMotion) {
      scaleAnim.setValue(1);
      glowAnim.setValue(1);
      return undefined;
    }

    scaleAnim.setValue(0.72);
    glowAnim.setValue(0);

    const animation = Animated.parallel([
      Animated.spring(scaleAnim, {
        damping: v2Motion.spring.damping,
        mass: v2Motion.spring.mass,
        stiffness: v2Motion.spring.stiffness,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        duration: glowDuration,
        toValue: 1,
        useNativeDriver: false,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [badge?.id, glowAnim, glowDuration, reduceMotion, scaleAnim, visible]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  if (!badge) {
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
      <Pressable
        accessibilityLabel={`${badge.label} achievement unlocked. ${badge.description}. Double tap to dismiss.`}
        accessibilityRole="button"
        onPress={onClose}
        style={({ pressed }) => [
          styles.badgeUnlockPopup,
          pressed && v2PressedStyles.card,
        ]}
      >
        {/* Two nested Animated.Views, not one: RN tracks native/JS driver
            mode per component, not per Animated.Value. scaleAnim is
            native-driven (useNativeDriver: true) and glowAnim/glowOpacity
            is JS-driven (shadow props aren't natively animatable) - mixing
            both on a single node's style array "moves" that node to
            native on the first run, then throws "Attempting to run JS
            driven animation on animated node that has been moved to
            'native' earlier" the next time shadowOpacity tries to update
            on it. Reproduces on any tier, from the second badge-unlock
            popup shown in a session onward - pre-existing, not introduced
            by the tier-weighted glow above. */}
        <Animated.View
          style={[styles.medalScale, { transform: [{ scale: scaleAnim }] }]}
        >
          <Animated.View
            style={[
              styles.medalGlow,
              {
                shadowColor: colors.accent,
                shadowOpacity: glowOpacity,
              },
            ]}
          >
            <BadgeMedal badge={badge} decorative earned large />
          </Animated.View>
        </Animated.View>
        <View style={styles.badgeUnlockContent}>
          <AppText style={styles.badgeUnlockEyebrow}>Badge earned</AppText>
          <AppText style={styles.badgeUnlockTitle}>{badge.label}</AppText>
          <AppText style={styles.badgeUnlockDescription}>
            {badge.description}
          </AppText>
          <View style={styles.badgeUnlockFooter}>
            <AppText style={styles.badgeUnlockTier}>{badge.tier}</AppText>
            <AppText style={styles.badgeUnlockRarity}>{badge.rarity}</AppText>
          </View>
        </View>
      </Pressable>
    </ModalShell>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    badgeUnlockPopup: {
      alignItems: "center",
      gap: v2CompactSpacing.md,
    },
    medalScale: {
      alignItems: "center",
      justifyContent: "center",
    },
    medalGlow: {
      alignItems: "center",
      borderRadius: v2Radius.large,
      justifyContent: "center",
    },
    badgeUnlockContent: {
      alignItems: "center",
      gap: 7,
      width: "100%",
    },
    badgeUnlockEyebrow: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: v2FontWeight.bold,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    badgeUnlockRarity: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.text,
      fontSize: 12,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: v2CompactSpacing.sm,
      paddingVertical: 5,
      textTransform: "uppercase",
    },
    badgeUnlockTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: v2FontWeight.bold,
      textAlign: "center",
    },
    badgeUnlockDescription: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
      textAlign: "center",
    },
    badgeUnlockFooter: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "space-between",
      marginTop: 4,
    },
    badgeUnlockTier: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.text,
      fontSize: 12,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: v2CompactSpacing.sm,
      paddingVertical: 5,
    },
  });
}
