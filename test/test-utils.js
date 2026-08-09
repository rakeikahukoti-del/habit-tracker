// Shared render helper: every screen/component in this app reads theme
// colors via useTheme(), which throws outside a ThemeProvider. Centralizing
// the wrapper here means each test file doesn't have to know that.
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "../context/ThemeContext";

export function renderWithProviders(ui, options) {
  return render(ui, { wrapper: ThemeProvider, ...options });
}

export * from "@testing-library/react-native";
