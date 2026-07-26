import { useCallback, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SettingsSection, SettingsToggleRow } from "../components/settings";
import { BackIcon, IconButton } from "../components/ui";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  pageTitleLineHeight,
  pageTitleSize,
  spacing,
} from "../constants/typography";
import { useTheme } from "../context/ThemeContext";
import {
  defaultAppPreferences,
  getAppPreferences,
  setAppPreference,
} from "../storage/appPreferences";

export default function GamificationPreferencesScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen, isTablet }),
    [colors, isSmallScreen, isTablet]
  );
  const [preferences, setPreferences] = useState(defaultAppPreferences);
  const [message, setMessage] = useState("");
  const preferenceUpdatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadPreferences() {
        const savedPreferences = await getAppPreferences();

        if (isActive) {
          setPreferences(savedPreferences);
        }
      }

      loadPreferences();

      return () => {
        isActive = false;
      };
    }, [])
  );

  async function handlePreferenceChange(key, value) {
    if (preferenceUpdatingRef.current) {
      return;
    }

    preferenceUpdatingRef.current = true;

    try {
      setMessage("");
      setPreferences((current) => ({ ...current, [key]: value }));
      setPreferences(await setAppPreference(key, value));
    } catch {
      setMessage("Could not save that preference. Please try again.");
      setPreferences(await getAppPreferences());
    } finally {
      preferenceUpdatingRef.current = false;
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <IconButton
          accessibilityLabel="Back to Settings"
          onPress={() => router.replace("/settings")}
          style={styles.backButton}
        >
          <BackIcon />
        </IconButton>

        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Gamification</Text>
        <Text style={styles.subtitle}>
          Control reward presentation without resetting progress.
        </Text>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <SettingsSection title="Home">
          <SettingsToggleRow
            description="Shows your daily progress summary on Home."
            onValueChange={(value) =>
              handlePreferenceChange("showProgressCard", value)
            }
            title="Progress card"
            value={preferences.showProgressCard}
          />
          <SettingsToggleRow
            description="Shows XP, level, and rank details on Home."
            onValueChange={(value) =>
              handlePreferenceChange("showXpRankOnHome", value)
            }
            title="Show rank on Home"
            value={preferences.showXpRankOnHome}
          />
        </SettingsSection>

        <SettingsSection title="Rewards">
          <SettingsToggleRow
            description="Future badge unlocks can show a short popup."
            onValueChange={(value) =>
              handlePreferenceChange("showBadgePopups", value)
            }
            title="Badge popups"
            value={preferences.showBadgePopups}
          />
          <SettingsToggleRow
            description="Future level changes can show a short popup."
            onValueChange={(value) =>
              handlePreferenceChange("showLevelUpPopup", value)
            }
            title="Level-up popup"
            value={preferences.showLevelUpPopup}
          />
          <SettingsToggleRow
            description="Uses subtle haptics for reward moments."
            onValueChange={(value) =>
              handlePreferenceChange("enableRewardHaptics", value)
            }
            title="Reward haptics"
            value={preferences.enableRewardHaptics}
          />
        </SettingsSection>
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
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? layout.formMaxWidth : "100%",
      padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
      paddingBottom: layout.screenBottomPadding,
      width: "100%",
    },
    backButton: {
      alignSelf: "flex-start",
      marginBottom: spacing.lg,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.xs,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: pageTitleSize(isSmallScreen),
      fontWeight: fontWeight.bold,
      lineHeight: pageTitleLineHeight(isSmallScreen),
    },
    subtitle: {
      color: colors.muted,
      fontSize: fontSize.body,
      lineHeight: lineHeight.body,
      marginBottom: spacing.xl,
      marginTop: spacing.sm,
    },
    message: {
      color: colors.primary,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
      marginBottom: spacing.lg,
    },
  });
}
