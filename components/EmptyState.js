import { Animated, StyleSheet, useWindowDimensions, View } from "react-native";
import { Link } from "expo-router";
import { MomentumWolfMark } from "./brand";
import { AppIcon, AppText, PrimaryButton } from "./ui";
import { v2Breakpoints, v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { useEntranceAnimation } from "../hooks/useEntranceAnimation";

export default function EmptyState() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors, width < v2Breakpoints.smallScreenMaxWidth);
  const entrance = useEntranceAnimation();

  return (
    <Animated.View style={[styles.container, entrance.style]}>
      <MomentumWolfMark decorative size={72} style={styles.mark} />
      <AppText style={styles.title}>
        No habits yet — your first one starts today
      </AppText>
      <AppText style={styles.message}>
        Add one small habit. Swipe it complete today, then watch your streak
        and progress build.
      </AppText>
      <View
        accessibilityLabel="How Momentum works"
        accessible
        style={styles.tipList}
      >
        <TipRow
          color={colors.muted}
          icon="check"
          styles={styles}
          text="Swipe right or tap the tick to complete a habit."
        />
        <TipRow
          color={colors.muted}
          icon="progress"
          styles={styles}
          text="Progress updates automatically."
        />
      </View>
      <Link href="/add" asChild>
        <PrimaryButton
          accessibilityLabel="Create a new habit"
          hitSlop={8}
          style={styles.button}
        >
          Create first habit
        </PrimaryButton>
      </Link>
    </Animated.View>
  );
}

function TipRow({ color, icon, styles, text }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipIcon}>
        <AppIcon color={color} name={icon} size={16} strokeWidth={2} />
      </View>
      <AppText style={styles.tipText}>{text}</AppText>
    </View>
  );
}

function createStyles(colors, isSmallScreen) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      marginTop: v2Spacing.xl,
      maxWidth: 420,
      paddingHorizontal: isSmallScreen ? v2Spacing.lg : v2Spacing.xxl,
      paddingVertical: isSmallScreen ? v2Spacing.xxl : 36,
      width: "100%",
    },
    mark: {
      marginBottom: v2Spacing.xl,
    },
    title: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.sectionTitle.lineHeight,
      marginBottom: v2Spacing.sm,
    },
    message: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      marginBottom: v2Spacing.lg,
      maxWidth: 260,
      textAlign: "center",
    },
    tipList: {
      alignSelf: "stretch",
      gap: v2Spacing.sm,
      marginBottom: v2Spacing.xl,
    },
    tipRow: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: v2Radius.medium,
      flexDirection: "row",
      gap: v2Spacing.sm,
      minHeight: 44,
      paddingHorizontal: v2Spacing.md,
      paddingVertical: v2Spacing.sm,
    },
    tipIcon: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 24,
      minWidth: 24,
    },
    tipText: {
      color: colors.muted,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
    },
    button: {
      paddingHorizontal: v2Spacing.xl,
    },
  });
}
