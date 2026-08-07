import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function AnalyticsError({ message, onRetry }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View accessibilityLiveRegion="polite" style={styles.emptyCard}>
      <AppText style={styles.emptyTitle}>Analytics unavailable</AppText>
      <AppText style={styles.emptyText}>{message}</AppText>
      <Pressable
        accessibilityLabel="Try loading Analytics again"
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [
          styles.emptyAction,
          pressed && v2PressedStyles.stats,
        ]}
      >
        <AppText style={styles.emptyActionText}>Try again</AppText>
      </Pressable>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.xl,
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
