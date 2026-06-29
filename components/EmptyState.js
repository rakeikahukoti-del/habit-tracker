import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
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
      <View style={styles.iconBadge}>
        <Text style={styles.icon}>🌱</Text>
      </View>
      <Text style={styles.title}>No habits yet</Text>
      <Text style={styles.message}>
        Create your first habit and give today a clear next step.
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
          <Text style={styles.buttonText}>Create Habit</Text>
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
    borderRadius: radius.xxl,
    borderWidth: 1,
    marginTop: spacing.xxl,
    padding: 26,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radius.xxl,
    height: 64,
    justifyContent: "center",
    marginBottom: 18,
    width: 64,
  },
  icon: {
    fontSize: 34,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.muted,
    fontSize: fontSize.bodyLarge,
    lineHeight: lineHeight.bodyLarge,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 13,
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
