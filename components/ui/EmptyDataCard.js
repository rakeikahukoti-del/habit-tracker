import { useMemo } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import AppIcon from "./AppIcon";
import AppText from "./AppText";
import { useTheme } from "../../context/ThemeContext";
import { useEntranceAnimation } from "../../hooks/useEntranceAnimation";
import { v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

// Shared "not enough data yet" card - was duplicated byte-for-byte (down to
// the layout, animation, and pressed-state) between Progress's EmptyProgress
// and Analytics' EmptyAnalytics, differing only in icon, copy, and the
// accessibility label on the CTA. Same rationale as the Phase 4 ModalShell
// merge: genuinely identical structure, not just superficially similar.
export default function EmptyDataCard({
  ctaAccessibilityLabel,
  ctaLabel,
  ctaRoute,
  icon,
  message,
  title,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const entrance = useEntranceAnimation();

  return (
    <Animated.View style={[styles.emptyCard, entrance.style]}>
      <View style={styles.emptyIconCircle}>
        <AppIcon color={colors.primary} name={icon} size={22} strokeWidth={2} />
      </View>
      <AppText style={styles.emptyTitle}>{title}</AppText>
      <AppText style={styles.emptyText}>{message}</AppText>
      <Pressable
        accessibilityLabel={ctaAccessibilityLabel}
        accessibilityRole="button"
        onPress={() => router.push(ctaRoute)}
        style={({ pressed }) => [
          styles.emptyAction,
          pressed && v2PressedStyles.stats,
        ]}
      >
        <AppIcon color={colors.inverseText} name="plus" size={16} />
        <AppText style={styles.emptyActionText}>{ctaLabel}</AppText>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.xl,
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
    },
    emptyText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
      marginBottom: v2Spacing.lg,
    },
    emptyAction: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.large,
      flexDirection: "row",
      gap: v2Spacing.xs,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: v2Spacing.lg,
    },
    emptyActionText: {
      color: colors.inverseText,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
