import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { MomentumWolfMark } from "./brand";
import {
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  spacing,
} from "../constants/typography";
import { useTheme } from "../context/ThemeContext";

export default function EmptyState() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <MomentumWolfMark
        color={colors.text}
        cutoutColor={colors.card}
        size={72}
        style={styles.mark}
      />
      <Text style={styles.title}>No habits yet</Text>
      <Text style={styles.message}>
        Start with one small promise to yourself.
      </Text>
      <Link href="/add" asChild>
        <Pressable
          accessibilityLabel="Create a new habit"
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Create First Habit</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      marginTop: spacing.xl,
      paddingHorizontal: spacing.xxl,
      paddingVertical: 36,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 1,
    },
    mark: {
      marginBottom: spacing.xl,
    },
    title: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.sm,
    },
    message: {
      color: colors.muted,
      fontSize: fontSize.bodyLarge,
      lineHeight: lineHeight.bodyLarge,
      marginBottom: spacing.xl,
      maxWidth: 260,
      textAlign: "center",
    },
    button: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
    buttonText: {
      color: colors.inverseText,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.bold,
    },
  });
}
