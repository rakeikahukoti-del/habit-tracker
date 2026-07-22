import AsyncStorage from "@react-native-async-storage/async-storage";
import { isPlainObject, logStorageError } from "./storageUtils";

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
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

    return value === "true";
  } catch (error) {
    logStorageError("Could not read onboarding state.", error);
    return false;
  }
}

export async function completeOnboarding() {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
  } catch (error) {
    logStorageError("Could not save onboarding state.", error);
    throw error;
  }
}

export async function getLastShownLevel() {
  try {
    const value = await AsyncStorage.getItem(LAST_SHOWN_LEVEL_KEY);
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : 1;
  } catch (error) {
    logStorageError("Could not read last shown level.", error);
    return 1;
  }
}

export async function setLastShownLevel(level) {
  const safeLevel = Number.isFinite(level) && level > 0 ? level : 1;

  try {
    await AsyncStorage.setItem(LAST_SHOWN_LEVEL_KEY, String(safeLevel));
  } catch (error) {
    logStorageError("Could not save last shown level.", error);
    throw error;
  }
}

export async function getAppPreferences() {
  try {
    const rawPreferences = await AsyncStorage.getItem(APP_PREFERENCES_KEY);
    let parsedPreferences = {};

    if (rawPreferences) {
      try {
        const parsedData = JSON.parse(rawPreferences);

        parsedPreferences = isPlainObject(parsedData) ? parsedData : {};
      } catch (error) {
        logStorageError("Could not parse app preferences.", error);
        parsedPreferences = {};
      }
    }

    const legacyMoveCompleted = await AsyncStorage.getItem(
      MOVE_COMPLETED_TO_BOTTOM_KEY
    );

    return sanitizeAppPreferences({
      ...parsedPreferences,
      moveCompletedToBottom:
        typeof parsedPreferences.moveCompletedToBottom === "boolean"
          ? parsedPreferences.moveCompletedToBottom
          : legacyMoveCompleted === "true",
    });
  } catch (error) {
    logStorageError("Could not read app preferences.", error);
    return defaultAppPreferences;
  }
}

export async function saveAppPreferences(preferences) {
  if (!isPlainObject(preferences)) {
    const error = new Error("saveAppPreferences expected an object.");

    logStorageError("Refusing to overwrite preferences with invalid data.", error);
    throw error;
  }

  const nextPreferences = sanitizeAppPreferences(preferences);

  try {
    await AsyncStorage.setItem(
      APP_PREFERENCES_KEY,
      JSON.stringify(nextPreferences)
    );
    await AsyncStorage.setItem(
      MOVE_COMPLETED_TO_BOTTOM_KEY,
      nextPreferences.moveCompletedToBottom ? "true" : "false"
    );

    return nextPreferences;
  } catch (error) {
    logStorageError("Could not save app preferences.", error);
    throw error;
  }
}

export async function setAppPreference(key, value) {
  if (!Object.prototype.hasOwnProperty.call(defaultAppPreferences, key)) {
    const error = new Error(`Unknown app preference: ${key}`);

    logStorageError("Refusing to save unknown app preference.", error);
    throw error;
  }

  const preferences = await getAppPreferences();

  if (preferences[key] === value) {
    return preferences;
  }

  return saveAppPreferences({
    ...preferences,
    [key]: value,
  });
}

function sanitizeAppPreferences(preferences) {
  if (!isPlainObject(preferences)) {
    return defaultAppPreferences;
  }

  return Object.keys(defaultAppPreferences).reduce((nextPreferences, key) => {
    nextPreferences[key] =
      typeof preferences[key] === "boolean"
        ? preferences[key]
        : defaultAppPreferences[key];

    return nextPreferences;
  }, {});
}
