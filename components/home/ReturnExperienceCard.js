import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Shadows, v2Spacing, v2Typography } from "../../src/design";
import { PRESSED_CARD_STYLE } from "./pressedStyles";

export default function ReturnExperienceCard({ message, onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityHint="Dismisses this return message for today."
      accessibilityLabel={`${message}. Double tap to dismiss.`}
      accessibilityRole="button"
      onPress={onDismiss}
      style={({ pressed }) => [
        styles.returnCard,
        pressed && PRESSED_CARD_STYLE,
      ]}
    >
      <View style={styles.returnIcon}>
        <AppIcon
          color={colors.primary}
          name="home"
          size={18}
          strokeWidth={2}
        />
      </View>
      <View style={styles.returnText}>
        <AppText style={styles.returnTitle}>Today</AppText>
        <AppText style={styles.returnBody}>{message}</AppText>
      </View>
      <AppText style={styles.returnDismiss}>Dismiss</AppText>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    returnCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: 8,
      minHeight: 68,
      paddingHorizontal: 14,
      paddingVertical: 12,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
    },
    returnIcon: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    returnText: {
      flex: 1,
      minWidth: 0,
    },
    returnTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    returnBody: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: 2,
    },
    returnDismiss: {
      color: colors.primary,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
