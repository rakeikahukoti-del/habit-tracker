import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  SettingsMessage,
  SettingsScreen,
  SettingsSection,
  SettingsToggleRow,
} from "../components/settings";
import {
  defaultAppPreferences,
  getAppPreferences,
  setAppPreference,
} from "../storage/appPreferences";

export default function GamificationPreferencesScreen() {
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
      subtitle="Control reward presentation without resetting progress."
      title="Gamification"
    >
      <SettingsMessage>{message}</SettingsMessage>

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
    </SettingsScreen>
  );
}
