import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  SettingsMessage,
  SettingsRow,
  SettingsScreen,
  SettingsSection,
  SettingsToggleRow,
} from "../components/settings";
import {
  defaultAppPreferences,
  getAppPreferences,
  setAppPreference,
} from "../storage/appPreferences";

export default function HabitPreferencesScreen() {
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
    <SettingsScreen
      onBack={() => router.replace("/settings")}
      subtitle="Control how habits behave on Home."
      title="Habit preferences"
    >
      <SettingsMessage>{message}</SettingsMessage>

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
    </SettingsScreen>
  );
}
