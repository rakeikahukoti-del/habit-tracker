import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function AnalyticsLinks() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.analyticsLinkWrap}>
      <Pressable
        accessibilityLabel="Open Year in Review"
        accessibilityRole="button"
        hitSlop={4}
        onPress={() => router.push("/year-review")}
        style={({ pressed }) => [
          styles.analyticsLink,
          pressed && v2PressedStyles.stats,
        ]}
      >
        <AppText style={styles.analyticsLinkText}>Year in Review</AppText>
        <AppIcon
          color={colors.primary}
          name="arrow-right"
          size={17}
          strokeWidth={2}
        />
      </Pressable>
      <Pressable
        accessibilityLabel="Open analytics"
        accessibilityRole="button"
        hitSlop={4}
        onPress={() => router.push("/analytics")}
        style={({ pressed }) => [
          styles.analyticsLink,
          pressed && v2PressedStyles.stats,
        ]}
      >
        <AppText style={styles.analyticsLinkText}>
          View deeper analytics
        </AppText>
        <AppIcon
          color={colors.primary}
          name="arrow-right"
          size={17}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    analyticsLinkWrap: {
      alignItems: "flex-start",
      marginBottom: v2Spacing.xl,
    },
    analyticsLink: {
      alignItems: "center",
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.xs,
      minHeight: 42,
      paddingHorizontal: v2Spacing.md,
    },
    analyticsLinkText: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
