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

const THEME_PREFERENCE_KEY = "momentum:theme-preference";
const ThemeContext = createContext(null);
const BASE_THEME_KEYS = ["light", "dark", "system"];

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState("system");
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    async function loadThemePreference() {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);

        if (isValidThemePreference(savedPreference)) {
          setThemePreferenceState(savedPreference);
        }
      } finally {
        setThemeLoaded(true);
      }
    }

    loadThemePreference();
  }, []);

  const setThemePreference = useCallback(async (nextPreference) => {
    if (!isValidThemePreference(nextPreference)) {
      return;
    }

    setThemePreferenceState(nextPreference);
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextPreference);
  }, []);

  const resolvedTheme =
    themePreference === "system" ? systemScheme || "light" : themePreference;
  const colors = themes[resolvedTheme] || themes.light;

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
