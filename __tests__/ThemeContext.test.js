import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text } from "react-native";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

const THEME_PREFERENCE_KEY = "momentum:theme-preference";

// A minimal consumer, standing in for any real screen. What we care about
// is the contract ThemeProvider makes with every screen in the app: flip
// the preference, get new colors, and have the choice survive a restart
// (i.e. actually reach AsyncStorage) - not any one screen's rendering.
function ThemeProbe() {
  const {
    colors,
    resolvedTheme,
    setThemePreference,
    themeLoaded,
    themePreference,
  } = useTheme();

  return (
    <>
      {/* themeLoaded flips once the AsyncStorage read in ThemeProvider's
          effect resolves. Waiting on this - rather than on "preference" or
          "resolved", which are already present pre-load with their default
          values - is what keeps this suite act()-warning-free. */}
      <Text testID="loaded">{String(themeLoaded)}</Text>
      <Text testID="preference">{themePreference}</Text>
      <Text testID="resolved">{resolvedTheme}</Text>
      <Text testID="text-color">{colors.text}</Text>
      <Text
        accessibilityRole="button"
        onPress={() => setThemePreference("dark")}
        testID="switch-to-dark"
      >
        Switch to dark
      </Text>
    </>
  );
}

async function renderAndWaitForLoad() {
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>
  );

  await waitFor(() =>
    expect(screen.getByTestId("loaded")).toHaveTextContent("true")
  );
}

describe("ThemeContext theme switching", () => {
  test("switching preference updates resolved theme and colors", async () => {
    await renderAndWaitForLoad();

    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    const lightTextColor = screen.getByTestId("text-color").children[0];

    await act(async () => {
      fireEvent.press(screen.getByTestId("switch-to-dark"));
    });

    expect(screen.getByTestId("preference")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(screen.getByTestId("text-color").children[0]).not.toBe(
      lightTextColor
    );
  });

  test("switching preference persists it to AsyncStorage", async () => {
    await renderAndWaitForLoad();

    await act(async () => {
      fireEvent.press(screen.getByTestId("switch-to-dark"));
    });

    await expect(AsyncStorage.getItem(THEME_PREFERENCE_KEY)).resolves.toBe(
      "dark"
    );
  });

  // Regression: the load effect used to resolve "system" against the live
  // device scheme and write that concrete value straight back to storage,
  // since it treated "differs from the resolved scheme" as "needs
  // correcting" - which is true of "system" by definition. That silently
  // and permanently downgraded "follow system" to a fixed light/dark after
  // the very next load (any app restart, not just backup/restore), even
  // though "system" is itself a fully supported preference, not a legacy
  // value needing repair.
  test("loading a saved System preference keeps it as System, not a resolved scheme", async () => {
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, "system");

    await renderAndWaitForLoad();

    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    await expect(AsyncStorage.getItem(THEME_PREFERENCE_KEY)).resolves.toBe(
      "system"
    );
  });
});
