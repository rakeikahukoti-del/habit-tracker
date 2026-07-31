import { useCallback, useRef, useState } from "react";
import { Linking } from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  SettingsMessage,
  SettingsRow,
  SettingsScreen,
  SettingsSection,
  SettingsToggleRow,
} from "../components/settings";
import {
  getNotificationPermissionMessage,
  getNotificationPermissionState,
} from "../notifications/habitNotifications";
import {
  defaultAppPreferences,
  getAppPreferences,
  setAppPreference,
} from "../storage/appPreferences";
import {
  applyDailyReminderPreference,
  getHabits,
  reconcileHabitNotifications,
} from "../storage/habitsStorage";
import {
  getNotificationPermissionLabel,
  getReminderSettingsSummary,
} from "../utils/settingsPresentation";

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState(defaultAppPreferences);
  const [permissionState, setPermissionState] = useState("not-requested");
  const [reminderSummary, setReminderSummary] = useState(
    getReminderSettingsSummary([])
  );
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [preferenceUpdating, setPreferenceUpdating] = useState(false);
  const preferenceUpdatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadPreferences() {
        try {
          setLoading(true);
          setMessage("");

          try {
            await reconcileHabitNotifications();
          } catch {
            // Reminders are optional; preferences should still load if repair fails.
          }

          const [savedPreferences, savedPermissionState, habits] =
            await Promise.all([
              getAppPreferences(),
              getNotificationPermissionState(),
              getHabits(),
            ]);

          if (isActive) {
            setPreferences(savedPreferences);
            setPermissionState(savedPermissionState);
            setReminderSummary(getReminderSettingsSummary(habits));
          }
        } catch {
          if (isActive) {
            setMessage("Could not load notification settings. Try again.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
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
    setPreferenceUpdating(true);

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
      const habits = await getHabits();

      setPreferences(savedPreferences);
      setReminderSummary(getReminderSettingsSummary(habits));
      setPermissionState(await getNotificationPermissionState());
    } catch {
      setMessage("Could not update reminders. Please try again.");

      const [savedPreferences, habits, savedPermissionState] =
        await Promise.all([
          getAppPreferences(),
          getHabits(),
          getNotificationPermissionState(),
        ]);

      setPreferences(savedPreferences);
      setReminderSummary(getReminderSettingsSummary(habits));
      setPermissionState(savedPermissionState);
    } finally {
      preferenceUpdatingRef.current = false;
      setPreferenceUpdating(false);
    }
  }

  async function openNotificationSettings() {
    try {
      setMessage("");
      await Linking.openSettings();
    } catch {
      setMessage("Could not open device settings.");
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
          description={getNotificationPermissionMessage(permissionState)}
          showChevron={false}
          title="Notification access"
          value={
            loading
              ? "Checking"
              : getNotificationPermissionLabel(permissionState)
          }
        />
        {permissionState === "blocked" ? (
          <SettingsRow
            accessibilityLabel="Open device notification settings"
            description="Update notification access in your device settings."
            onPress={openNotificationSettings}
            title="Open device settings"
          />
        ) : null}
      </SettingsSection>

      <SettingsSection
        footer="Momentum asks permission only when reminders need to be scheduled."
        title="Reminders"
      >
        <SettingsToggleRow
          description="Allow scheduled reminders for habits with reminder times."
          disabled={loading || preferenceUpdating}
          onValueChange={handleDailyReminderChange}
          title="Daily reminders"
          value={preferences.enableDailyReminders}
        />
        <SettingsRow
          description={reminderSummary.description}
          showChevron={false}
          title="Active reminders"
          value={reminderSummary.value}
        />
      </SettingsSection>
    </SettingsScreen>
  );
}
