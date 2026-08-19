// Interaction-test layer, separate from scripts/logic-smoke-test.cjs (the
// existing pure-logic regression suite, run via `npm test`). This config
// powers component/interaction tests under __tests__/ using
// @testing-library/react-native, run via `npm run test:rtl`.
module.exports = {
  preset: "jest-expo",
  // RNGH's own setup file (mocks RNGestureHandlerModule/GestureButtons/
  // Pressable) - jest-expo's preset doesn't mock any of these itself
  // (checked before adding), so this is additive, not a collision. Lives
  // in setupFiles (runs before the test framework installs) per RNGH's own
  // documented convention, separate from setupFilesAfterEnv below.
  setupFiles: ["react-native-gesture-handler/jestSetup.js"],
  setupFilesAfterEnv: ["./jest.setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/scripts/"],
};
