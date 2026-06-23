import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_COMPLETE_KEY = "momentum:onboarding-complete";
const LAST_SHOWN_LEVEL_KEY = "momentum:last-shown-level";
const MOVE_COMPLETED_TO_BOTTOM_KEY = "momentum:move-completed-to-bottom";
const APP_PREFERENCES_KEY = "momentum:app-preferences";

export const defaultAppPreferences = {
  enableDailyReminders: true,
  enableLongPressReorder: true,
  enableRewardHaptics: true,
  enableSwipeToComplete: true,
  moveCompletedToBottom: false,
  showBadgePopups: true,
  showLevelUpPopup: true,
  showProgressCard: true,
  showXpRankOnHome: true,
};

export async function hasCompletedOnboarding() {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

  return value === "true";
}

export async function completeOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
}

export async function getLastShownLevel() {
  const value = await AsyncStorage.getItem(LAST_SHOWN_LEVEL_KEY);
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 1;
}

export async function setLastShownLevel(level) {
  await AsyncStorage.setItem(LAST_SHOWN_LEVEL_KEY, String(level));
}

export async function getMoveCompletedToBottom() {
  const preferences = await getAppPreferences();

  return preferences.moveCompletedToBottom;
}

export async function setMoveCompletedToBottom(enabled) {
  await setAppPreference("moveCompletedToBottom", enabled);
  await AsyncStorage.setItem(
    MOVE_COMPLETED_TO_BOTTOM_KEY,
    enabled ? "true" : "false"
  );
}

export async function getAppPreferences() {
  const rawPreferences = await AsyncStorage.getItem(APP_PREFERENCES_KEY);
  let parsedPreferences = {};

  if (rawPreferences) {
    try {
      parsedPreferences = JSON.parse(rawPreferences);
    } catch {
      parsedPreferences = {};
    }
  }

  const legacyMoveCompleted = await AsyncStorage.getItem(
    MOVE_COMPLETED_TO_BOTTOM_KEY
  );

  return {
    ...defaultAppPreferences,
    ...parsedPreferences,
    moveCompletedToBottom:
      typeof parsedPreferences.moveCompletedToBottom === "boolean"
        ? parsedPreferences.moveCompletedToBottom
        : legacyMoveCompleted === "true",
  };
}

export async function saveAppPreferences(preferences) {
  const nextPreferences = {
    ...defaultAppPreferences,
    ...preferences,
  };

  await AsyncStorage.setItem(
    APP_PREFERENCES_KEY,
    JSON.stringify(nextPreferences)
  );
  await AsyncStorage.setItem(
    MOVE_COMPLETED_TO_BOTTOM_KEY,
    nextPreferences.moveCompletedToBottom ? "true" : "false"
  );

  return nextPreferences;
}

export async function setAppPreference(key, value) {
  const preferences = await getAppPreferences();

  return saveAppPreferences({
    ...preferences,
    [key]: value,
  });
}
