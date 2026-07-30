import AsyncStorage from "@react-native-async-storage/async-storage";
import packageJson from "../package.json";
import { normalizeDailyPlan } from "../utils/dailyPlanning";
import { normalizeGamificationState } from "../utils/gamification";
import { normalizeThemePreference } from "../utils/themePreferences";
import {
  defaultAppPreferences,
  getAppPreferences,
  saveAppPreferences,
  setLastShownLevel,
} from "./appPreferences";
import { saveDailyPlan } from "./dailyPlanStorage";
import {
  getGamification,
  getGamificationLevelInfo,
  rebuildGamificationFromHabits,
} from "./gamificationStorage";
import {
  getHabits,
  importHabitsBackup,
  normalizeHabitOrder,
} from "./habitsStorage";
import { isPlainObject, logStorageError } from "./storageUtils";

export const BACKUP_VERSION = 1;
export const BACKUP_APP_NAME = "Momentum";

export const STORAGE_KEY_MANIFEST = [
  storageKey("habit-tracker:habits", "Habits and completion history", "habitsStorage", 1, [
    "notifications",
    "gamification",
    "analytics",
  ]),
  storageKey("habit-tracker:habits-backup", "Unreadable habit JSON recovery copy", "habitsStorage", 1),
  storageKey("habit-tracker:gamification", "XP, badges, rewards, and recent achievements", "gamificationStorage", 1, [
    "habits",
  ]),
  storageKey("momentum:app-preferences", "App behavior preferences", "appPreferences", 1),
  storageKey("momentum:move-completed-to-bottom", "Legacy completed-sort preference mirror", "appPreferences", 1),
  storageKey("momentum:onboarding-complete", "Onboarding completion flag", "appPreferences", 1),
  storageKey("momentum:last-shown-level", "Last level shown in reward UI", "appPreferences", 1, [
    "gamification",
  ]),
  storageKey("momentum:first-trend-unlock-shown", "First analytics trend milestone flag", "appPreferences", 1),
  storageKey("momentum:first-swipe-hint-dismissed", "First swipe hint dismissal flag", "appPreferences", 1),
  storageKey("momentum:return-guidance-dismissed-date", "Return guidance dismissal date", "appPreferences", 1),
  storageKey("momentum:theme-preference", "Light/Dark appearance preference", "ThemeContext", 1),
  storageKey("momentum:daily-plan", "Current local daily plan", "dailyPlanStorage", 1, [
    "habits",
  ]),
];

const RAW_KEYS = {
  firstSwipeHintDismissed: "momentum:first-swipe-hint-dismissed",
  firstTrendUnlockShown: "momentum:first-trend-unlock-shown",
  lastShownLevel: "momentum:last-shown-level",
  onboardingComplete: "momentum:onboarding-complete",
  returnGuidanceDismissedDate: "momentum:return-guidance-dismissed-date",
  themePreference: "momentum:theme-preference",
};

export async function exportAppData() {
  const [habits, gamification, rawState, preferences] = await Promise.all([
    getHabits(),
    getGamification(),
    readRawBackupState(),
    getAppPreferences(),
  ]);
  const dailyPlan = parseStoredJson(rawState.dailyPlan, null);

  return JSON.stringify(
    {
      app: BACKUP_APP_NAME,
      appVersion: packageJson.version,
      exportedAt: new Date().toISOString(),
      version: BACKUP_VERSION,
      data: {
        appearance: {
          themePreference: normalizeThemePreference(rawState.themePreference),
        },
        dailyPlan,
        flags: getBackupFlags(rawState),
        gamification: normalizeGamificationState(gamification),
        habits,
        preferences,
      },
    },
    null,
    2
  );
}

export async function importAppData(jsonText, { mode = "replace" } = {}) {
  if (mode !== "replace") {
    throw new Error("Only replace imports are supported.");
  }

  const validation = validateBackup(jsonText);

  if (!validation.ok) {
    throw new Error(validation.errors[0] || "Backup is invalid.");
  }

  const { data } = validation;

  await saveAppPreferences(data.preferences);
  const importedHabits = await importHabitsBackup(
    JSON.stringify({ habits: data.habits })
  );

  await saveAppearance(data.appearance);
  await saveFlags(data.flags);
  await saveDailyPlan(data.dailyPlan, importedHabits);

  const gamification = await rebuildGamificationFromHabits(importedHabits, {
    includeMessage: false,
  });
  await setLastShownLevel(getGamificationLevelInfo(gamification).level);

  return {
    gamification,
    habits: importedHabits,
    metadata: validation.metadata,
    warnings: validation.warnings,
  };
}

export function getBackupMetadata(jsonText) {
  return validateBackup(jsonText).metadata;
}

export function validateBackup(input) {
  const parseResult = parseBackupInput(input);

  if (!parseResult.ok) {
    return createValidationResult({
      errors: [parseResult.error],
      metadata: getEmptyMetadata(),
    });
  }

  const migration = migrateBackup(parseResult.value);

  if (!migration.ok) {
    return createValidationResult({
      errors: migration.errors,
      metadata: getMetadataFromBackup(parseResult.value, null, migration.warnings),
      warnings: migration.warnings,
    });
  }

  const normalized = normalizeBackupData(migration.backup);
  const metadata = getMetadataFromBackup(migration.backup, normalized.data, [
    ...migration.warnings,
    ...normalized.warnings,
  ]);

  if (normalized.errors.length > 0) {
    return createValidationResult({
      errors: normalized.errors,
      metadata,
      warnings: normalized.warnings,
    });
  }

  return {
    data: normalized.data,
    errors: [],
    metadata,
    ok: true,
    version: migration.backup.version,
    warnings: [...migration.warnings, ...normalized.warnings],
  };
}

export function migrateBackup(rawBackup) {
  const backup = normalizeLegacyBackup(rawBackup);
  const warnings = [];

  if (!isPlainObject(backup)) {
    return {
      errors: ["Backup must be a JSON object or habit array."],
      ok: false,
      warnings,
    };
  }

  const version = Number.isFinite(backup.version) ? backup.version : 1;

  if (version > BACKUP_VERSION) {
    return {
      errors: [`Backup version ${version} is newer than this app supports.`],
      ok: false,
      warnings,
    };
  }

  let migratedBackup = {
    ...backup,
    version,
  };

  for (let currentVersion = version; currentVersion < BACKUP_VERSION; currentVersion += 1) {
    const migration = migrations[currentVersion];

    if (typeof migration !== "function") {
      return {
        errors: [`No migration available for backup version ${currentVersion}.`],
        ok: false,
        warnings,
      };
    }

    migratedBackup = migration(migratedBackup);
    warnings.push(`Migrated backup from version ${currentVersion} to ${currentVersion + 1}.`);
  }

  return {
    backup: migratedBackup,
    errors: [],
    ok: true,
    warnings,
  };
}

function normalizeBackupData(backup) {
  const warnings = [];
  const errors = [];
  const rawData = isPlainObject(backup.data) ? backup.data : {};
  const habitsInput = Array.isArray(rawData.habits)
    ? rawData.habits
    : Array.isArray(backup.habits)
      ? backup.habits
      : [];

  if (!Array.isArray(habitsInput)) {
    errors.push("Backup habits must be an array.");
  }

  const validHabitInputs = habitsInput.filter(isPlainObject);

  if (habitsInput.length > 0 && validHabitInputs.length === 0) {
    errors.push("Backup does not contain any valid habits.");
  }

  if (habitsInput.length !== validHabitInputs.length) {
    warnings.push("Some invalid habit entries were ignored.");
  }

  const habits = normalizeHabitOrder(validHabitInputs);

  if (hasDuplicateIds(validHabitInputs)) {
    warnings.push("Duplicate habit IDs were repaired.");
  }

  const preferences = normalizePreferences(rawData.preferences, warnings);
  const appearance = normalizeAppearance(rawData.appearance, warnings);
  const gamification = normalizeGamificationState(rawData.gamification);
  const dailyPlan = normalizeBackupDailyPlan(rawData.dailyPlan, habits, warnings);
  const flags = normalizeFlags(rawData.flags, warnings);

  return {
    data: {
      appearance,
      dailyPlan,
      flags,
      gamification,
      habits,
      preferences,
    },
    errors,
    warnings,
  };
}

function normalizePreferences(preferences, warnings) {
  if (preferences == null) {
    warnings.push("Missing preferences were restored with defaults.");
    return defaultAppPreferences;
  }

  if (!isPlainObject(preferences)) {
    warnings.push("Invalid preferences were restored with defaults.");
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

function normalizeAppearance(appearance, warnings) {
  const rawTheme = isPlainObject(appearance)
    ? appearance.themePreference
    : appearance;
  const normalizedTheme = normalizeThemePreference(rawTheme);

  if (rawTheme && rawTheme !== normalizedTheme) {
    warnings.push("Unsupported theme preference was normalized.");
  }

  return {
    themePreference: normalizedTheme,
  };
}

function normalizeBackupDailyPlan(plan, habits, warnings) {
  if (plan == null) {
    return null;
  }

  if (!isPlainObject(plan)) {
    warnings.push("Invalid daily plan was ignored.");
    return null;
  }

  if (!isValidDateKey(plan.date)) {
    warnings.push("Invalid daily plan date was ignored.");
    return null;
  }

  return normalizeDailyPlan(plan, habits, plan.date);
}

function normalizeFlags(flags, warnings) {
  if (flags == null) {
    return {};
  }

  if (!isPlainObject(flags)) {
    warnings.push("Invalid backup flags were ignored.");
    return {};
  }

  return {
    firstSwipeHintDismissed: parseBooleanFlag(flags.firstSwipeHintDismissed),
    firstTrendUnlockShown: parseBooleanFlag(flags.firstTrendUnlockShown),
    onboardingComplete: parseBooleanFlag(flags.onboardingComplete),
    returnGuidanceDismissedDate: isValidDateKey(flags.returnGuidanceDismissedDate)
      ? flags.returnGuidanceDismissedDate
      : "",
  };
}

function normalizeLegacyBackup(rawBackup) {
  if (Array.isArray(rawBackup)) {
    return {
      app: BACKUP_APP_NAME,
      exportedAt: "",
      version: 1,
      data: {
        habits: rawBackup,
      },
    };
  }

  if (isPlainObject(rawBackup) && Array.isArray(rawBackup.habits)) {
    return {
      app: rawBackup.app || BACKUP_APP_NAME,
      appVersion: rawBackup.appVersion || "",
      exportedAt: rawBackup.exportedAt || "",
      version: Number.isFinite(rawBackup.version) ? rawBackup.version : 1,
      data: {
        habits: rawBackup.habits,
      },
    };
  }

  return rawBackup;
}

async function readRawBackupState() {
  const pairs = await AsyncStorage.multiGet([
    "momentum:app-preferences",
    "momentum:daily-plan",
    RAW_KEYS.firstSwipeHintDismissed,
    RAW_KEYS.firstTrendUnlockShown,
    RAW_KEYS.lastShownLevel,
    RAW_KEYS.onboardingComplete,
    RAW_KEYS.returnGuidanceDismissedDate,
    RAW_KEYS.themePreference,
  ]);
  const values = Object.fromEntries(pairs);

  return {
    appPreferences: values["momentum:app-preferences"],
    dailyPlan: values["momentum:daily-plan"],
    firstSwipeHintDismissed: values[RAW_KEYS.firstSwipeHintDismissed],
    firstTrendUnlockShown: values[RAW_KEYS.firstTrendUnlockShown],
    lastShownLevel: values[RAW_KEYS.lastShownLevel],
    onboardingComplete: values[RAW_KEYS.onboardingComplete],
    returnGuidanceDismissedDate: values[RAW_KEYS.returnGuidanceDismissedDate],
    themePreference: values[RAW_KEYS.themePreference],
  };
}

function getBackupFlags(rawState) {
  return {
    firstSwipeHintDismissed: rawState.firstSwipeHintDismissed === "true",
    firstTrendUnlockShown: rawState.firstTrendUnlockShown === "true",
    onboardingComplete: rawState.onboardingComplete === "true",
    returnGuidanceDismissedDate: isValidDateKey(rawState.returnGuidanceDismissedDate)
      ? rawState.returnGuidanceDismissedDate
      : "",
  };
}

async function saveAppearance(appearance) {
  await AsyncStorage.setItem(
    RAW_KEYS.themePreference,
    normalizeThemePreference(appearance?.themePreference)
  );
}

async function saveFlags(flags) {
  const updates = [
    [RAW_KEYS.firstSwipeHintDismissed, flags.firstSwipeHintDismissed ? "true" : "false"],
    [RAW_KEYS.firstTrendUnlockShown, flags.firstTrendUnlockShown ? "true" : "false"],
    [RAW_KEYS.onboardingComplete, flags.onboardingComplete ? "true" : "false"],
  ];

  if (flags.returnGuidanceDismissedDate) {
    updates.push([
      RAW_KEYS.returnGuidanceDismissedDate,
      flags.returnGuidanceDismissedDate,
    ]);
  } else {
    await AsyncStorage.removeItem(RAW_KEYS.returnGuidanceDismissedDate);
  }

  await AsyncStorage.multiSet(updates);
}

function parseBackupInput(input) {
  if (typeof input !== "string" || !input.trim()) {
    return {
      error: "Backup JSON is empty.",
      ok: false,
    };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(input),
    };
  } catch (error) {
    logStorageError("Could not parse app backup.", error);

    return {
      error: "Backup JSON could not be parsed.",
      ok: false,
    };
  }
}

function parseStoredJson(rawValue, fallbackValue) {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

function getMetadataFromBackup(backup, data, warnings = []) {
  const safeData = data || {};
  const habits = Array.isArray(safeData.habits) ? safeData.habits : [];
  const exportedAt =
    typeof backup.exportedAt === "string" && backup.exportedAt
      ? backup.exportedAt
      : "Unknown";

  return {
    app: typeof backup.app === "string" ? backup.app : BACKUP_APP_NAME,
    appVersion:
      typeof backup.appVersion === "string" && backup.appVersion
        ? backup.appVersion
        : "Unknown",
    exportedAt,
    habitCount: habits.length,
    hasActivityHistory: habits.some(
      (habit) =>
        Array.isArray(habit.completedDates) && habit.completedDates.length > 0
    ),
    hasDailyPlan: Boolean(safeData.dailyPlan),
    hasPreferences: isPlainObject(safeData.preferences),
    version: Number.isFinite(backup.version) ? backup.version : 1,
    warnings,
  };
}

function getEmptyMetadata() {
  return {
    app: BACKUP_APP_NAME,
    appVersion: "Unknown",
    exportedAt: "Unknown",
    habitCount: 0,
    hasActivityHistory: false,
    hasDailyPlan: false,
    hasPreferences: false,
    version: BACKUP_VERSION,
    warnings: [],
  };
}

function createValidationResult({ errors, metadata, warnings = [] }) {
  return {
    data: null,
    errors,
    metadata,
    ok: false,
    version: metadata.version,
    warnings,
  };
}

function hasDuplicateIds(habits) {
  const seenIds = new Set();

  return habits.some((habit) => {
    if (typeof habit.id !== "string") {
      return false;
    }

    if (seenIds.has(habit.id)) {
      return true;
    }

    seenIds.add(habit.id);
    return false;
  });
}

function parseBooleanFlag(value) {
  return value === true || value === "true";
}

function isValidDateKey(dateKey) {
  if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function storageKey(key, purpose, owner, version, dependencies = []) {
  return {
    dependencies,
    key,
    owner,
    purpose,
    version,
  };
}

const migrations = {
  0: (backup) => ({
    ...backup,
    version: 1,
    data: isPlainObject(backup.data)
      ? backup.data
      : {
          habits: Array.isArray(backup.habits) ? backup.habits : [],
        },
  }),
};
