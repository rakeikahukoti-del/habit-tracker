import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, renderWithProviders, screen, waitFor } from "../test/test-utils";
import AppearanceScreen from "../app/appearance";

const THEME_PREFERENCE_KEY = "momentum:theme-preference";

// Exercises the real ThemePreviewRow -> AppearanceScreen -> useTheme wiring
// end to end (no mocked setThemePreference) - this is the "SettingsSection
// theme radio" the persistence bug fixed a few sessions ago
// (system-preference-through-backup-restore) lives downstream of.
describe("AppearanceScreen theme radio", () => {
  test("starts with Light selected (no saved preference)", async () => {
    renderWithProviders(<AppearanceScreen />);

    expect(await screen.findByLabelText("Light theme, selected")).toBeTruthy();
    expect(screen.getByText("Current appearance: Light.")).toBeTruthy();
  });

  test("selecting Dark calls setThemePreference(\"dark\") and updates the UI", async () => {
    renderWithProviders(<AppearanceScreen />);
    await screen.findByLabelText("Light theme, selected");

    fireEvent.press(screen.getByLabelText("Dark theme"));

    await waitFor(() =>
      expect(screen.getByText("Current appearance: Dark.")).toBeTruthy()
    );
    expect(screen.getByLabelText("Dark theme, selected")).toBeTruthy();
  });

  test("selecting a theme persists it to AsyncStorage", async () => {
    renderWithProviders(<AppearanceScreen />);
    await screen.findByLabelText("Light theme, selected");

    fireEvent.press(screen.getByLabelText("Dark theme"));

    await waitFor(async () => {
      expect(await AsyncStorage.getItem(THEME_PREFERENCE_KEY)).toBe("dark");
    });
  });

  test("selecting System calls setThemePreference(\"system\")", async () => {
    renderWithProviders(<AppearanceScreen />);
    await screen.findByLabelText("Light theme, selected");

    fireEvent.press(screen.getByLabelText("System theme"));

    await waitFor(() =>
      expect(screen.getByLabelText("System theme, selected")).toBeTruthy()
    );
  });
});
