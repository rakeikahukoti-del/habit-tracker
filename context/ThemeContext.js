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

const THEME_PREFERENCE_KEY = "momentum:theme-preference";
const ThemeContext = createContext(null);
const BASE_THEME_KEYS = ["light", "dark", "system"];

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState("dark");
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadThemePreference() {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);

        if (isMounted && isValidThemePreference(savedPreference)) {
          setThemePreferenceState(savedPreference);
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
  }, []);

  const setThemePreference = useCallback(async (nextPreference) => {
    if (!isValidThemePreference(nextPreference)) {
      return;
    }

    if (nextPreference === themePreference) {
      return;
    }

    setThemePreferenceState(nextPreference);

    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextPreference);
    } catch (error) {
      logStorageError("Could not save theme preference.", error);
    }
  }, [themePreference]);

  const resolvedTheme =
    themePreference === "system" ? systemScheme || "light" : themePreference;
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

function isValidThemePreference(preference) {
  return BASE_THEME_KEYS.includes(preference) || Boolean(themes[preference]);
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return value;
}
