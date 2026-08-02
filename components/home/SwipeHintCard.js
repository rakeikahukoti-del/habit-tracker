import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Shadows, v2Spacing, v2Typography } from "../../src/design";
import { PRESSED_CARD_STYLE } from "./pressedStyles";

export default function SwipeHintCard({ onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityHint="Dismisses this one-time swipe tip."
      accessibilityLabel="Swipe right to complete a habit. Double tap to dismiss this tip."
      accessibilityRole="button"
      onPress={onDismiss}
      style={({ pressed }) => [
        styles.swipeHint,
        pressed && PRESSED_CARD_STYLE,
      ]}
    >
      <View style={styles.swipeHintIcon}>
        <AppIcon
          color={colors.primary}
          name="check"
          size={18}
          strokeWidth={2.4}
        />
      </View>
      <View style={styles.swipeHintText}>
        <AppText style={styles.swipeHintTitle}>Swipe to complete</AppText>
        <AppText style={styles.swipeHintBody}>
          Swipe a habit right when it is done. Tap the card to view its
          details.
        </AppText>
      </View>
      <AppText style={styles.swipeHintDismiss}>Got it</AppText>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    swipeHint: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: 8,
      minHeight: 70,
      paddingHorizontal: 14,
      paddingVertical: 12,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
    },
    swipeHintIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    swipeHintText: {
      flex: 1,
      minWidth: 0,
    },
    swipeHintTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    swipeHintBody: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: 2,
    },
    swipeHintDismiss: {
      color: colors.primary,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
