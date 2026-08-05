import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { PRESSED_BUTTON_STYLE } from "../home/pressedStyles";

export default function RankError({ message, onRetry }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View accessibilityLiveRegion="polite" style={styles.loadingCard}>
      <AppText style={styles.errorTitle}>Progression unavailable</AppText>
      <AppText style={styles.loadingText}>{message}</AppText>
      <Pressable
        accessibilityLabel="Try loading progression again"
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          pressed && PRESSED_BUTTON_STYLE,
        ]}
      >
        <AppText style={styles.retryButtonText}>Try again</AppText>
      </Pressable>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    loadingCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      gap: 10,
      padding: 28,
    },
    loadingText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      textAlign: "center",
    },
    errorTitle: {
      color: colors.text,
      fontSize: v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    retryButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.large,
      justifyContent: "center",
      minHeight: 46,
      paddingHorizontal: v2Spacing.xl,
    },
    retryButtonText: {
      color: colors.inverseText,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
