import {
  SafeAreaView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { MomentumWolfMark, MomentumWordmark } from "../components/brand";
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
  const styles = createStyles(colors, { isSmallScreen, isTablet });

  async function handleStart() {
    await completeOnboarding();
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brand}>
          <MomentumWolfMark size={94} />
          <MomentumWordmark width={190} />
        </View>
        <AppText style={styles.eyebrow}>Welcome</AppText>
        <AppText style={styles.title}>
          Build discipline through consistency.
        </AppText>
        <AppText style={styles.subtitle}>
          Choose the habits that matter. Complete them each day. Momentum tracks
          the progress you build.
        </AppText>

        <View style={styles.points}>
          <AppText style={styles.point}>
            Today shows the habits in front of you.
          </AppText>
          <AppText style={styles.point}>
            Progress and Rank show consistency over time.
          </AppText>
          <AppText style={styles.point}>
            Your habit data stays on this device.
          </AppText>
        </View>

        <PressableScale
          accessibilityLabel="Start tracking habits"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleStart}
          style={styles.button}
        >
          <AppText style={styles.buttonText}>Start tracking</AppText>
        </PressableScale>
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
      padding: isSmallScreen
        ? v2Layout.screenPaddingCompact
        : v2Layout.screenPadding,
      width: "100%",
    },
    brand: {
      alignItems: "flex-start",
      gap: v2Spacing.lg,
      marginBottom: v2Spacing.xxl,
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
    buttonText: {
      color: colors.inverseText,
      fontSize: v2Typography.button.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
