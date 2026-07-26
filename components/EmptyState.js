import { StyleSheet, View } from "react-native";
import { useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { MomentumWolfMark } from "./brand";
import { AppText, PressableScale } from "./ui";
import {
  v2FontWeight,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";

export default function EmptyState() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors, width < 380);

  return (
    <View style={styles.container}>
      <MomentumWolfMark
        color={colors.text}
        cutoutColor={colors.card}
        size={72}
        style={styles.mark}
      />
      <AppText style={styles.title}>No habits yet</AppText>
      <AppText style={styles.message}>
        Start with one small promise to yourself.
      </AppText>
      <Link href="/add" asChild>
        <PressableScale
          accessibilityLabel="Create a new habit"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.button}
        >
          <AppText style={styles.buttonText}>Create First Habit</AppText>
        </PressableScale>
      </Link>
    </View>
  );
}

function createStyles(colors, isSmallScreen) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      marginTop: v2Spacing.xl,
      paddingHorizontal: isSmallScreen ? v2Spacing.lg : v2Spacing.xxl,
      paddingVertical: isSmallScreen ? v2Spacing.xxl : 36,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
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
      marginBottom: v2Spacing.xl,
      maxWidth: 260,
      textAlign: "center",
    },
    button: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.large,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: v2Spacing.xl,
      paddingVertical: v2Spacing.md,
    },
    buttonText: {
      color: colors.inverseText,
      fontSize: v2Typography.button.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
