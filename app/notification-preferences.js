import { useCallback, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  SettingsRow,
  SettingsSection,
  SettingsToggleRow,
} from "../components/settings";
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
import { getNotificationPermissionState } from "../notifications/habitNotifications";
import {
  defaultAppPreferences,
  getAppPreferences,
  setAppPreference,
} from "../storage/appPreferences";
import { applyDailyReminderPreference } from "../storage/habitsStorage";

export default function NotificationPreferencesScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen, isTablet }),
    [colors, isSmallScreen, isTablet]
  );
  const [preferences, setPreferences] = useState(defaultAppPreferences);
  const [permissionState, setPermissionState] = useState("not-requested");
  const [message, setMessage] = useState("");
  const preferenceUpdatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadPreferences() {
        const [savedPreferences, savedPermissionState] = await Promise.all([
          getAppPreferences(),
          getNotificationPermissionState(),
        ]);

        if (isActive) {
          setPreferences(savedPreferences);
          setPermissionState(savedPermissionState);
        }
      }

      loadPreferences();

      return () => {
        isActive = false;
      };
    }, [])
  );

  async function handleDailyReminderChange(value) {
    if (preferenceUpdatingRef.current) {
      return;
    }

    preferenceUpdatingRef.current = true;

    try {
      setMessage("");
      setPreferences((current) => ({
        ...current,
        enableDailyReminders: value,
      }));
      const savedPreferences = await setAppPreference(
        "enableDailyReminders",
        value
      );

      await applyDailyReminderPreference(value);
      setPreferences(savedPreferences);
      setPermissionState(await getNotificationPermissionState());
    } catch {
      setMessage("Could not update reminders. Please try again.");
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
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          Reminders are optional. Momentum works normally if they are off.
        </Text>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <SettingsSection title="Permission">
          <SettingsRow
            description={getPermissionDescription(permissionState)}
            showChevron={false}
            title="Notification access"
            value={getPermissionLabel(permissionState)}
          />
        </SettingsSection>

        <SettingsSection
          footer="Momentum asks permission only when reminders need to be scheduled."
          title="Reminders"
        >
          <SettingsToggleRow
            description="Allow scheduled reminders for habits with reminder times."
            onValueChange={handleDailyReminderChange}
            title="Daily reminders"
            value={preferences.enableDailyReminders}
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function getPermissionLabel(state) {
  if (state === "granted") {
    return "Allowed";
  }

  if (state === "blocked") {
    return "Blocked";
  }

  if (state === "unavailable") {
    return "Unavailable";
  }

  return "Not asked";
}

function getPermissionDescription(state) {
  if (state === "granted") {
    return "Habit reminders can be scheduled on this device.";
  }

  if (state === "blocked") {
    return "Enable notifications in device settings to receive reminders.";
  }

  if (state === "unavailable") {
    return "Notifications are unavailable in this environment.";
  }

  return "Permission is requested only when a reminder is scheduled.";
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
      color: colors.danger,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
      marginBottom: spacing.lg,
    },
  });
}
