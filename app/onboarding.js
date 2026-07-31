import { useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import BrandLogo from "../components/BrandLogo";
import { AppText, PressableScale } from "../components/ui";
import {
  v2FontWeight,
  v2Layout,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { completeOnboarding } from "../storage/appPreferences";

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const styles = createStyles(colors, { isSmallScreen, isTablet });

  async function handleStart() {
    if (startingRef.current) {
      return;
    }

    startingRef.current = true;
    setStarting(true);
    setError("");

    try {
      await completeOnboarding();
      router.replace("/");
    } catch {
      startingRef.current = false;
      setStarting(false);
      setError("Could not finish setup. Please try again.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.container}>
        <View style={styles.brand}>
          <BrandLogo
            decorative
            size={isSmallScreen ? 76 : 88}
          />
          <AppText style={styles.wordmark}>MOMENTUM</AppText>
        </View>
        <AppText style={styles.eyebrow}>Start simple</AppText>
        <AppText style={styles.title}>
          Build better habits one day at a time.
        </AppText>
        <AppText style={styles.subtitle}>
          Create habits, complete what is scheduled, and review the progress you
          build over time.
        </AppText>

        <View style={styles.points}>
          <AppText style={styles.point}>
            Home keeps today focused.
          </AppText>
          <AppText style={styles.point}>
            Progress shows streaks, trends, and weekly context.
          </AppText>
          <AppText style={styles.point}>
            XP and ranks reward consistency without pressure.
          </AppText>
        </View>

        {error ? (
          <AppText accessibilityRole="alert" style={styles.error}>
            {error}
          </AppText>
        ) : null}

        <PressableScale
          accessibilityLabel="Start tracking habits"
          accessibilityRole="button"
          accessibilityState={{ busy: starting, disabled: starting }}
          disabled={starting}
          hitSlop={8}
          onPress={handleStart}
          style={[styles.button, starting && styles.buttonDisabled]}
        >
          <AppText style={styles.buttonText}>
            {starting ? "Starting..." : "Start tracking"}
          </AppText>
        </PressableScale>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
    },
    container: {
      alignSelf: "center",
      justifyContent: "center",
      maxWidth: isTablet ? 620 : "100%",
      padding: isSmallScreen
        ? v2Layout.screenPaddingCompact
        : v2Layout.screenPadding,
      width: "100%",
    },
    brand: {
      alignItems: "center",
      alignSelf: "flex-start",
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
    },
    wordmark: {
      color: colors.text,
      fontSize: 18,
      fontWeight: v2FontWeight.medium,
      letterSpacing: 8,
      lineHeight: 24,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: v2Spacing.sm,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: isSmallScreen ? 30 : v2Typography.display.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 36 : v2Typography.display.lineHeight,
    },
    subtitle: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.regular,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.md,
    },
    points: {
      gap: v2Spacing.md,
      marginTop: v2Spacing.xl,
    },
    point: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      overflow: "hidden",
      padding: v2Spacing.md,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.07,
    },
    button: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.large,
      justifyContent: "center",
      marginTop: v2Spacing.xxl,
      minHeight: 54,
      paddingHorizontal: v2Spacing.lg,
      paddingVertical: v2Spacing.base,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.inverseText,
      fontSize: v2Typography.button.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    error: {
      color: colors.danger,
      ...v2Typography.bodySupporting,
      marginTop: v2Spacing.lg,
    },
  });
}
