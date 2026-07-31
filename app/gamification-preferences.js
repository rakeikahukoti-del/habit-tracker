import { router } from "expo-router";
import {
  SettingsMessage,
  SettingsScreen,
  SettingsSection,
  SettingsToggleRow,
} from "../components/settings";
import { useAppPreferenceSettings } from "../hooks/useAppPreferenceSettings";

export default function GamificationPreferencesScreen() {
  const { message, preferences, setPreferenceValue, updating } =
    useAppPreferenceSettings();

  return (
    <SettingsScreen
      onBack={() => router.replace("/settings")}
      subtitle="Control reward presentation without resetting progress."
      title="Gamification"
    >
      <SettingsMessage tone="danger">{message}</SettingsMessage>

      <SettingsSection title="Home">
        <SettingsToggleRow
          description="Shows your daily progress summary on Home."
          disabled={updating}
          onValueChange={(value) =>
            setPreferenceValue("showProgressCard", value)
          }
          title="Progress card"
          value={preferences.showProgressCard}
        />
        <SettingsToggleRow
          description="Shows XP, level, and rank details on Home."
          disabled={updating}
          onValueChange={(value) =>
            setPreferenceValue("showXpRankOnHome", value)
          }
          title="Show rank on Home"
          value={preferences.showXpRankOnHome}
        />
      </SettingsSection>

      <SettingsSection title="Rewards">
        <SettingsToggleRow
          description="Future badge unlocks can show a short popup."
          disabled={updating}
          onValueChange={(value) =>
            setPreferenceValue("showBadgePopups", value)
          }
          title="Badge popups"
          value={preferences.showBadgePopups}
        />
        <SettingsToggleRow
          description="Future level changes can show a short popup."
          disabled={updating}
          onValueChange={(value) =>
            setPreferenceValue("showLevelUpPopup", value)
          }
          title="Level-up popup"
          value={preferences.showLevelUpPopup}
        />
        <SettingsToggleRow
          description="Uses subtle haptics for reward moments."
          disabled={updating}
          onValueChange={(value) =>
            setPreferenceValue("enableRewardHaptics", value)
          }
          title="Reward haptics"
          value={preferences.enableRewardHaptics}
        />
      </SettingsSection>
    </SettingsScreen>
  );
}
