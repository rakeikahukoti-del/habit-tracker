// AsyncStorage ships a mock object (not a self-registering module), so it
// has to be wired up with jest.mock() rather than referenced directly as a
// setupFiles/setupFilesAfterEnv entry.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// The mock's backing store (__INTERNAL_MOCK_STORAGE__) is a module-level
// singleton - without this, state set by one test (e.g. selecting a theme)
// leaks into the next test in the same file, since jest doesn't re-require
// mocked modules between tests by default. Any component reading persisted
// state (ThemeContext, and anything through it - AppearanceScreen, etc.)
// needs this to get an isolated starting state per test.
afterEach(async () => {
  const AsyncStorage = require("@react-native-async-storage/async-storage");
  await AsyncStorage.clear();
});
