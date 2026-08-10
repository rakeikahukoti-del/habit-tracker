import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { BadgeMedal } from "../progression";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  v2CompactSpacing,
  v2FontWeight,
  v2Motion,
  v2PressedStyles,
  v2Radius,
  v2Shadows,
  v2Typography,
} from "../../src/design";

export default function BadgeUnlockCard({ badge, onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const scaleAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0.72)).current;
  const glowAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      scaleAnim.setValue(1);
      glowAnim.setValue(1);
      return;
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
        duration: v2Motion.duration.emphasis,
        toValue: 1,
        useNativeDriver: false,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [badge?.id, glowAnim, reduceMotion, scaleAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <Pressable
      accessibilityLabel={`${badge.label} achievement unlocked. ${badge.description}. Double tap to dismiss.`}
      accessibilityRole="button"
      onPress={onDismiss}
      style={({ pressed }) => [
        styles.badgeUnlockPopup,
        pressed && v2PressedStyles.card,
      ]}
    >
      <Animated.View
        style={[
          styles.medalGlow,
          {
            shadowColor: colors.accent,
            shadowOpacity: glowOpacity,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <BadgeMedal badge={badge} earned large />
      </Animated.View>
      <View style={styles.badgeUnlockContent}>
        <AppText style={styles.badgeUnlockEyebrow}>Badge earned</AppText>
        <AppText style={styles.badgeUnlockTitle}>{badge.label}</AppText>
        <AppText style={styles.badgeUnlockDescription}>
          {badge.description}
        </AppText>
        <View style={styles.badgeUnlockFooter}>
          <AppText style={styles.badgeUnlockTier}>{badge.tier}</AppText>
          <AppText style={styles.badgeUnlockRarity}>
            {badge.rarity}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    badgeUnlockPopup: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.accent,
      borderRadius: v2Radius.feature,
      borderWidth: 1.5,
      gap: v2CompactSpacing.md,
      marginBottom: v2CompactSpacing.sm,
      paddingHorizontal: v2CompactSpacing.lg,
      paddingVertical: 20,
      ...v2Shadows.medium,
      shadowColor: colors.accent,
      shadowOpacity: 0.18,
    },
    medalGlow: {
      ...v2Shadows.floating,
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
