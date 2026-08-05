import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
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
      backgroundColor: colors.surface,
      borderRadius: v2Radius.large,
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: v2Spacing.sm,
      minHeight: 64,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    swipeHintIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: v2Radius.medium,
      height: 34,
      justifyContent: "center",
      width: 34,
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
