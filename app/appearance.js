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

  function selectTheme(themeKey) {
    setThemePreference(themeKey);
  }

  return (
    <SettingsScreen
      onBack={() => router.replace("/settings")}
      subtitle={`Current appearance: ${formatThemeLabel(resolvedTheme)}.`}
      title="Appearance"
    >
      <SettingsMessage>
        Rank progression now uses medals instead of changing the app theme.
      </SettingsMessage>

      <SettingsSection title="Mode">
        {appearanceOptions.map((option) => (
          <ThemePreviewRow
            key={option.value}
            label={option.label}
            onPress={() => selectTheme(option.value)}
            previewColors={themes[option.value]}
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
