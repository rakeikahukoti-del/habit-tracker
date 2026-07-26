import { useCallback, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SettingsRow, SettingsSection, SettingsToggleRow } from "../components/settings";
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

export default function HabitPreferencesScreen() {
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
        <Text style={styles.title}>Habit preferences</Text>
        <Text style={styles.subtitle}>
          Control how habits behave on Home.
        </Text>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <SettingsSection title="Order">
          <SettingsRow
            description="Drag habits into your preferred order."
            onPress={() => router.push("/reorder-habits")}
            title="Reorder habits"
          />
          <SettingsToggleRow
            description="Keeps unfinished habits at the top of Today."
            onValueChange={(value) =>
              handlePreferenceChange("moveCompletedToBottom", value)
            }
            title="Move completed habits to bottom"
            value={preferences.moveCompletedToBottom}
          />
        </SettingsSection>

        <SettingsSection title="Interactions">
          <SettingsToggleRow
            description="Swipe right to complete and left to undo."
            onValueChange={(value) =>
              handlePreferenceChange("enableSwipeToComplete", value)
            }
            title="Swipe actions"
            value={preferences.enableSwipeToComplete}
          />
          <SettingsToggleRow
            description="Allows drag reordering where supported."
            onValueChange={(value) =>
              handlePreferenceChange("enableLongPressReorder", value)
            }
            title="Long-press reorder"
            value={preferences.enableLongPressReorder}
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
