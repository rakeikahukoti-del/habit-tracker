import { useRef, useState } from "react";
import { router } from "expo-router";
import {
  SettingsMessage,
  SettingsScreen,
  SettingsSection,
  ThemePreviewRow,
} from "../components/settings";
import { themes } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";
import { appearanceOptions } from "../utils/themePreferences";

export default function AppearanceScreen() {
  const { resolvedTheme, setThemePreference, themePreference } = useTheme();
  const [message, setMessage] = useState("");
  const updateInProgressRef = useRef(false);

  async function selectTheme(themeKey) {
    if (updateInProgressRef.current) {
      return;
    }

    updateInProgressRef.current = true;
    setMessage("");

    try {
      const saved = await setThemePreference(themeKey);

      if (!saved) {
        setMessage("Could not save appearance. Try again.");
      }
    } finally {
      updateInProgressRef.current = false;
    }
  }

  return (
    <SettingsScreen
      onBack={() => router.replace("/settings")}
      subtitle={`Current appearance: ${formatThemeLabel(resolvedTheme)}.`}
      title="Appearance"
    >
      <SettingsMessage tone="danger">{message}</SettingsMessage>

      <SettingsSection
        footer="Appearance changes immediately and is saved on this device."
        title="Mode"
      >
        {appearanceOptions.map((option) => (
          <ThemePreviewRow
            key={option.value}
            label={option.label}
            onPress={() => selectTheme(option.value)}
            previewColors={
              option.value === "system" ? themes[resolvedTheme] : themes[option.value]
            }
            selected={themePreference === option.value}
          />
        ))}
      </SettingsSection>
    </SettingsScreen>
  );
}

function formatThemeLabel(themeKey) {
  return String(themeKey || "dark")
    .charAt(0)
    .toUpperCase() + String(themeKey || "dark").slice(1);
}
