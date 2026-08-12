import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { themes } from "../constants/colors";
import { logStorageError } from "../storage/storageUtils";
import {
  isSupportedThemePreference,
  normalizeThemePreference,
} from "../utils/themePreferences";

const THEME_PREFERENCE_KEY = "momentum:theme-preference";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState("light");
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadThemePreference() {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        // "system" is a supported preference in its own right, not a value
        // that needs correcting - only genuinely unsupported/legacy values
        // (old per-habit theme keys, corrupted data) get resolved to a
        // concrete scheme and rewritten. Resolving "system" here as if it
        // were invalid silently collapsed it into whatever the device's
        // scheme happened to be at that moment, permanently: the next time
        // this effect ran (any future app launch, or a live OS theme
        // change while the app was already open, since this effect depends
        // on systemScheme) it would overwrite storage with a fixed
        // light/dark value, and "follow system" stopped tracking OS changes
        // for the rest of that session too, since state no longer held
        // "system" for line 83's resolvedTheme calculation to react to.
        const isSupported = isSupportedThemePreference(savedPreference);
        const sanitizedPreference = isSupported
          ? savedPreference
          : normalizeThemePreference(savedPreference, systemScheme);

        if (isMounted) {
          setThemePreferenceState(sanitizedPreference);
        }

        if (savedPreference && !isSupported) {
          await AsyncStorage.setItem(THEME_PREFERENCE_KEY, sanitizedPreference);
        }
      } catch (error) {
        logStorageError("Could not read theme preference.", error);
      } finally {
        if (isMounted) {
          setThemeLoaded(true);
        }
      }
    }

    loadThemePreference();

    return () => {
      isMounted = false;
    };
  }, [systemScheme]);

  const setThemePreference = useCallback(async (nextPreference) => {
    if (!isSupportedThemePreference(nextPreference)) {
      return false;
    }

    if (nextPreference === themePreference) {
      return true;
    }

    const previousPreference = themePreference;

    setThemePreferenceState(nextPreference);

    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextPreference);
      return true;
    } catch (error) {
      logStorageError("Could not save theme preference.", error);
      setThemePreferenceState(previousPreference);
      return false;
    }
  }, [themePreference]);

  const resolvedTheme = normalizeThemePreference(themePreference, systemScheme);
  const colors = themes[resolvedTheme] || themes.dark;

  const value = useMemo(
    () => ({
      colors,
      isDark: resolvedTheme === "dark",
      resolvedTheme,
      setThemePreference,
      themeLoaded,
      themePreference,
    }),
    [colors, resolvedTheme, setThemePreference, themeLoaded, themePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return value;
}
