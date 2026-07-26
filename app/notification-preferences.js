import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  SettingsMessage,
  SettingsRow,
  SettingsScreen,
  SettingsSection,
  SettingsToggleRow,
} from "../components/settings";
import { getNotificationPermissionState } from "../notifications/habitNotifications";
import {
  defaultAppPreferences,
  getAppPreferences,
  setAppPreference,
} from "../storage/appPreferences";
import { applyDailyReminderPreference } from "../storage/habitsStorage";

export default function NotificationPreferencesScreen() {
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
      await applyDailyReminderPreference(value);
      const savedPreferences = await setAppPreference(
        "enableDailyReminders",
        value
      );
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
    <SettingsScreen
      onBack={() => router.replace("/settings")}
      subtitle="Reminders are optional. Momentum works normally if they are off."
      title="Notifications"
    >
      <SettingsMessage tone="danger">{message}</SettingsMessage>

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
    </SettingsScreen>
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
