import { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { BackIcon, IconButton } from "../components/ui";
import {
  SettingsSection,
  ThemePreviewRow,
} from "../components/settings";
import { themes } from "../constants/colors";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  pageTitleLineHeight,
  pageTitleSize,
  spacing,
} from "../constants/typography";
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
    colors,
    resolvedTheme,
    setThemePreference,
    themePreference,
  } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen, isTablet }),
    [colors, isSmallScreen, isTablet]
  );
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <IconButton
          accessibilityLabel="Back to Settings"
          onPress={() => router.replace("/settings")}
          style={styles.backButton}
        >
          <BackIcon />
        </IconButton>

        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Appearance</Text>
        <Text style={styles.subtitle}>
          Current appearance: {formatThemeLabel(resolvedTheme)}.
        </Text>

        {message ? <Text style={styles.message}>{message}</Text> : null}

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
      </ScrollView>
    </SafeAreaView>
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

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? layout.formMaxWidth : "100%",
      padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
      paddingBottom: layout.screenBottomPadding,
      width: "100%",
    },
    backButton: {
      alignSelf: "flex-start",
      marginBottom: spacing.lg,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.xs,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: pageTitleSize(isSmallScreen),
      fontWeight: fontWeight.bold,
      lineHeight: pageTitleLineHeight(isSmallScreen),
    },
    subtitle: {
      color: colors.muted,
      fontSize: fontSize.body,
      lineHeight: lineHeight.body,
      marginBottom: spacing.xl,
      marginTop: spacing.sm,
    },
    message: {
      color: colors.primary,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
      marginBottom: spacing.lg,
    },
  });
}
