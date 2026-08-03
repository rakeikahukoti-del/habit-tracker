import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { PRESSED_STATS_STYLE } from "../home/pressedStyles";

export default function TrendUnlockBanner({ onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityLabel="First trend unlocked. Analytics can now show useful patterns."
      accessibilityRole="button"
      accessibilityHint="Double tap to dismiss this message."
      onPress={onDismiss}
      style={({ pressed }) => [
        styles.unlockBanner,
        pressed && PRESSED_STATS_STYLE,
      ]}
    >
      <View style={styles.unlockIcon}>
        <AppIcon name="analytics" color={colors.primary} size={18} />
      </View>
      <View style={styles.unlockText}>
        <AppText style={styles.unlockTitle}>First trend unlocked</AppText>
        <AppText style={styles.unlockMessage}>
          Momentum can now show patterns from your habit history.
        </AppText>
      </View>
      <AppText style={styles.unlockDismiss}>Got it</AppText>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    unlockBanner: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.primary,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: v2Spacing.lg,
      minHeight: 64,
      padding: v2Spacing.md,
    },
    unlockIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: v2Radius.pill,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    unlockText: {
      flex: 1,
      minWidth: 0,
    },
    unlockTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    unlockMessage: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: 2,
    },
    unlockDismiss: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
