import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  spacing,
} from "../constants/typography";
import { useTheme } from "../context/ThemeContext";
import { completeOnboarding } from "../storage/appPreferences";

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });

  async function handleStart() {
    await completeOnboarding();
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroEmoji}>⚡</Text>
        </View>
        <Text style={styles.eyebrow}>Welcome to Momentum</Text>
        <Text style={styles.title}>Make today's habits clear</Text>
        <Text style={styles.subtitle}>
          Create a habit, swipe to complete it, and watch your progress build.
        </Text>

        <View style={styles.points}>
          <Text style={styles.point}>Home shows what to do today</Text>
          <Text style={styles.point}>Progress and Rank show what you have built</Text>
          <Text style={styles.point}>Your habit data stays on this device</Text>
        </View>

        <Pressable
          accessibilityLabel="Start tracking habits"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleStart}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Start tracking</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      flex: 1,
      justifyContent: "center",
      maxWidth: isTablet ? 620 : "100%",
      padding: isSmallScreen ? 20 : 26,
      width: "100%",
    },
    heroIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: 28,
      height: 72,
      justifyContent: "center",
      marginBottom: 22,
      width: 72,
    },
    heroEmoji: {
      fontSize: 36,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.sm,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: isSmallScreen ? 30 : 34,
      fontWeight: fontWeight.bold,
      lineHeight: isSmallScreen ? 36 : 40,
    },
    subtitle: {
      color: colors.muted,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.bodyLarge,
      marginTop: 14,
    },
    points: {
      gap: 10,
      marginTop: 26,
    },
    point: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      color: colors.text,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      padding: 14,
    },
    button: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      justifyContent: "center",
      marginTop: 28,
      minHeight: 54,
      paddingHorizontal: 18,
      paddingVertical: 16,
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
