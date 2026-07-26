import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  SettingsMessage,
  SettingsScreen,
  SettingsSection,
  ThemePreviewRow,
} from "../components/settings";
import { themes } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";
import {
  getGamification,
  getGamificationLevelInfo,
  rankThemes,
} from "../storage/gamificationStorage";

const BASE_THEMES = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export default function AppearanceScreen() {
  const {
    resolvedTheme,
    setThemePreference,
    themePreference,
  } = useTheme();
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadLevel() {
        try {
          const storedGamification = await getGamification();
          const levelInfo = getGamificationLevelInfo(storedGamification);

          if (!isActive) {
            return;
          }

          setLevel(levelInfo.level);

          if (isLockedTheme(themePreference, levelInfo.level)) {
            await setThemePreference("system");
            setMessage("Locked theme reset to System.");
          }
        } catch {
          if (isActive) {
            setMessage("Could not load theme unlocks.");
          }
        }
      }

      loadLevel();

      return () => {
        isActive = false;
      };
    }, [setThemePreference, themePreference])
  );

  function selectTheme(themeKey) {
    setMessage("");
    setThemePreference(themeKey);
  }

  return (
    <SettingsScreen
      onBack={() => router.replace("/settings")}
      subtitle={`Current appearance: ${formatThemeLabel(resolvedTheme)}.`}
      title="Appearance"
    >
      <SettingsMessage>{message}</SettingsMessage>

        <SettingsSection title="Mode">
          {BASE_THEMES.map((option) => (
            <ThemePreviewRow
              key={option.value}
              label={option.label}
              onPress={() => selectTheme(option.value)}
              previewColors={getPreviewColors(option.value)}
              selected={themePreference === option.value}
            />
          ))}
        </SettingsSection>

        <SettingsSection
          footer="Rank themes unlock automatically as your level increases."
          title="Rank themes"
        >
          {rankThemes.map((theme) => {
            const unlocked = level >= theme.unlockLevel;

            return (
              <ThemePreviewRow
                disabled={!unlocked}
                key={theme.key}
                label={theme.label}
                lockedText={`Unlocks at level ${theme.unlockLevel}`}
                onPress={() => selectTheme(theme.key)}
                previewColors={getPreviewColors(theme.key)}
                selected={themePreference === theme.key}
              />
            );
          })}
        </SettingsSection>
    </SettingsScreen>
  );
}

function getPreviewColors(themeKey) {
  if (themeKey === "system") {
    return {
      accent: themes.light.accent,
      background: themes.dark.background,
      card: themes.light.card,
      primary: themes.dark.primary,
    };
  }

  return themes[themeKey] || themes.dark;
}

function formatThemeLabel(themeKey) {
  return String(themeKey || "dark")
    .charAt(0)
    .toUpperCase() + String(themeKey || "dark").slice(1);
}

function isLockedTheme(themePreference, userLevel) {
  const rankTheme = rankThemes.find((theme) => theme.key === themePreference);

  return Boolean(rankTheme && userLevel < rankTheme.unlockLevel);
}
