import { useMemo } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { useEntranceAnimation } from "../../hooks/useEntranceAnimation";
import { v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function ReturnExperienceCard({ message, onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const entrance = useEntranceAnimation([message]);

  return (
    <Animated.View style={entrance.style}>
      <Pressable
        accessibilityHint="Dismisses this return message for today."
        accessibilityLabel={`${message}. Double tap to dismiss.`}
        accessibilityRole="button"
        onPress={onDismiss}
        style={({ pressed }) => [
          styles.returnCard,
          pressed && v2PressedStyles.card,
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
    </Animated.View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    returnCard: {
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
    returnIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: v2Radius.medium,
      height: 34,
      justifyContent: "center",
      width: 34,
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
