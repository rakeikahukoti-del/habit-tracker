// Interaction-test layer, separate from scripts/logic-smoke-test.cjs (the
// existing pure-logic regression suite, run via `npm test`). This config
// powers component/interaction tests under __tests__/ using
// @testing-library/react-native, run via `npm run test:rtl`.
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["./jest.setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/scripts/"],
};
