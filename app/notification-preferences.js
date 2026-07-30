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
  getReminderPreview,
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

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState(defaultAppPreferences);
  const [permissionState, setPermissionState] = useState("not-requested");
  const [reminderSummary, setReminderSummary] = useState(getEmptyReminderSummary());
  const [message, setMessage] = useState("");
  const preferenceUpdatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadPreferences() {
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
          setReminderSummary(getReminderSummary(habits));
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
      const habits = await getHabits();

      setPreferences(savedPreferences);
      setReminderSummary(getReminderSummary(habits));
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
          description={getNotificationPermissionMessage(permissionState)}
          showChevron={false}
          title="Notification access"
          value={getPermissionLabel(permissionState)}
        />
        {permissionState === "blocked" ? (
          <SettingsRow
            accessibilityLabel="Open device notification settings"
            description="Update notification access in your device settings."
            onPress={() => Linking.openSettings()}
            title="Open Settings"
          />
        ) : null}
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

function getReminderSummary(habits) {
  const safeHabits = Array.isArray(habits) ? habits : [];
  const scheduledHabits = safeHabits.filter(
    (habit) => habit.reminderStatus === "scheduled"
  );
  const notificationCount = scheduledHabits.reduce(
    (sum, habit) =>
      sum +
      (Array.isArray(habit.notificationIds) ? habit.notificationIds.length : 0),
    0
  );
  const nextPreview = scheduledHabits[0]
    ? getReminderPreview(scheduledHabits[0])
    : "";

  if (scheduledHabits.length === 0) {
    return getEmptyReminderSummary();
  }

  return {
    description: nextPreview
      ? `${nextPreview}. ${scheduledHabits.length} habit reminder${scheduledHabits.length === 1 ? "" : "s"} enabled.`
      : `${scheduledHabits.length} habit reminder${scheduledHabits.length === 1 ? "" : "s"} enabled.`,
    value: String(notificationCount),
  };
}

function getEmptyReminderSummary() {
  return {
    description: "Add a reminder time to any habit to schedule reminders.",
    value: "0",
  };
}
