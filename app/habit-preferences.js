import { router } from "expo-router";
import {
  SettingsMessage,
  SettingsRow,
  SettingsScreen,
  SettingsSection,
  SettingsToggleRow,
} from "../components/settings";
import { useAppPreferenceSettings } from "../hooks/useAppPreferenceSettings";

export default function HabitPreferencesScreen() {
  const { message, preferences, setPreferenceValue } =
    useAppPreferenceSettings();

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
            setPreferenceValue("moveCompletedToBottom", value)
          }
          title="Move completed habits to bottom"
          value={preferences.moveCompletedToBottom}
        />
      </SettingsSection>

      <SettingsSection title="Interactions">
        <SettingsToggleRow
          description="Swipe right to complete and left to undo."
          onValueChange={(value) =>
            setPreferenceValue("enableSwipeToComplete", value)
          }
          title="Swipe actions"
          value={preferences.enableSwipeToComplete}
        />
        <SettingsToggleRow
          description="Allows drag reordering where supported."
          onValueChange={(value) =>
            setPreferenceValue("enableLongPressReorder", value)
          }
          title="Long-press reorder"
          value={preferences.enableLongPressReorder}
        />
      </SettingsSection>
    </SettingsScreen>
  );
}
