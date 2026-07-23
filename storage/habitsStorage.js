import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_EMOJI,
  DEFAULT_HABIT_FREQUENCY,
} from "../constants/habitOptions";
import { getAppPreferences, setLastShownLevel } from "./appPreferences";
import {
  getGamificationLevelInfo,
  rebuildGamificationFromHabits,
  resetGamification,
} from "./gamificationStorage";
import { isPlainObject, logStorageError } from "./storageUtils";
import {
  cancelHabitReminders,
  hasReminderScheduleChanged,
  scheduleHabitReminder,
} from "../notifications/habitNotifications";
import { getTodayKey, toDateKey, wasCompletedToday } from "../utils/habitStats";

const HABITS_KEY = "habit-tracker:habits";
const HABITS_BACKUP_KEY = "habit-tracker:habits-backup";
export async function getHabits() {
  try {
    const rawHabits = await AsyncStorage.getItem(HABITS_KEY);

    if (!rawHabits) {
      return [];
    }

    try {
      const parsedHabits = JSON.parse(rawHabits);

      return Array.isArray(parsedHabits)
        ? normalizeHabitList(parsedHabits).sort(
            (firstHabit, secondHabit) => firstHabit.order - secondHabit.order
          )
        : [];
    } catch (error) {
      logStorageError("Could not parse saved habits. Backing up raw data.", error);

      try {
        await AsyncStorage.setItem(HABITS_BACKUP_KEY, rawHabits);
      } catch (backupError) {
        logStorageError("Could not back up unreadable habits.", backupError);
      }

      return [];
    }
  } catch (error) {
    logStorageError("Could not read saved habits.", error);
    return [];
  }
}

export async function saveHabits(habits) {
  if (!Array.isArray(habits)) {
    const error = new Error("saveHabits expected an array.");

    logStorageError("Refusing to overwrite habits with invalid data.", error);
    throw error;
  }

  try {
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (error) {
    logStorageError("Could not save habits.", error);
    throw error;
  }
}

export async function addHabit({
  name,
  emoji,
  category,
  color,
  frequency,
  customDays,
  reminderTime,
}) {
  const habits = await getHabits();
  const now = new Date().toISOString();
  const newHabitWithoutNotifications = normalizeHabit({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name.trim(),
    emoji,
    category,
    color,
    frequency,
    customDays,
    reminderTime,
    createdAt: now,
    completedDates: [],
    order: getNextTopOrder(habits),
  });
  const reminderResult = await scheduleReminderIfEnabled(
    newHabitWithoutNotifications
  );
  const newHabit = {
    ...newHabitWithoutNotifications,
    ...reminderResult,
  };

  await saveHabits([newHabit, ...habits]);

  return newHabit;
}

export async function updateHabit(updatedHabit) {
  const habits = await getHabits();
  const previousHabit = habits.find((habit) => habit.id === updatedHabit.id);
  let normalizedHabit = normalizeHabit(updatedHabit);

  if (
    previousHabit &&
    hasReminderScheduleChanged(previousHabit, normalizedHabit)
  ) {
    await cancelHabitReminders(previousHabit);
    const reminderResult = await scheduleReminderIfEnabled(normalizedHabit);
    normalizedHabit = {
      ...normalizedHabit,
      ...reminderResult,
    };
  } else if (previousHabit) {
    normalizedHabit = {
      ...normalizedHabit,
      notificationIds: previousHabit.notificationIds,
      reminderStatus: previousHabit.reminderStatus,
    };
  }

  const nextHabits = habits.map((habit) =>
    habit.id === updatedHabit.id ? normalizedHabit : habit
  );

  await saveHabits(nextHabits);
  await rebuildGamificationFromHabits(nextHabits);

  return normalizedHabit;
}

export async function completeHabitForToday(id) {
  const habits = await getHabits();
  const habitToComplete = habits.find((habit) => habit.id === id);

  if (!habitToComplete) {
    return null;
  }

  if (wasCompletedToday(habitToComplete)) {
    return habitToComplete;
  }

  const completedHabit = {
    ...habitToComplete,
    completedDates: [...habitToComplete.completedDates, getTodayKey()],
  };
  const nextHabits = habits.map((habit) =>
    habit.id === id ? completedHabit : habit
  );

  await saveHabits(nextHabits);

  return completedHabit;
}

export async function uncompleteHabitForToday(id) {
  const habits = await getHabits();
  const habitToUpdate = habits.find((habit) => habit.id === id);

  if (!habitToUpdate) {
    return null;
  }

  const todayKey = getTodayKey();

  if (!habitToUpdate.completedDates.includes(todayKey)) {
    return habitToUpdate;
  }

  const updatedHabit = {
    ...habitToUpdate,
    completedDates: habitToUpdate.completedDates.filter(
      (dateKey) => dateKey !== todayKey
    ),
  };
  const nextHabits = habits.map((habit) =>
    habit.id === id ? updatedHabit : habit
  );

  await saveHabits(nextHabits);

  return updatedHabit;
}

export async function saveHabitOrder(orderedHabitIds) {
  const habits = await getHabits();
  const safeOrderedHabitIds = Array.isArray(orderedHabitIds)
    ? orderedHabitIds
    : [];
  const orderLookup = new Map(
    safeOrderedHabitIds.map((habitId, index) => [habitId, index])
  );
  const orderedHabits = habits.map((habit, index) =>
    normalizeHabit(
      {
        ...habit,
        order: orderLookup.has(habit.id) ? orderLookup.get(habit.id) : index,
      },
      index
    )
  );

  await saveHabits(orderedHabits);

  return orderedHabits.sort(
    (firstHabit, secondHabit) => firstHabit.order - secondHabit.order
  );
}

export async function deleteHabit(id) {
  const habits = await getHabits();
  const habitToDelete = habits.find((habit) => habit.id === id);

  if (habitToDelete) {
    await cancelHabitReminders(habitToDelete);
  }

  const nextHabits = habits.filter((habit) => habit.id !== id);

  await saveHabits(nextHabits);
  await rebuildGamificationFromHabits(nextHabits, { includeMessage: false });
}

export async function resetAllHabits() {
  const habits = await getHabits();

  await cancelRemindersForHabits(habits);
  await saveHabits([]);
  await resetGamification();
  await setLastShownLevel(1);
}

export async function seedDemoHabits() {
  const habits = await getHabits();
  const demoHabits = createDemoHabits();

  await cancelRemindersForHabits(habits);
  await saveHabits(demoHabits);
  const gamification = await rebuildGamificationFromHabits(demoHabits);
  await setLastShownLevel(getGamificationLevelInfo(gamification).level);
}

export async function seedMasterDemoHabits() {
  const habits = await getHabits();
  const demoHabits = createMasterDemoHabits();

  await cancelRemindersForHabits(habits);
  await saveHabits(demoHabits);
  const gamification = await rebuildGamificationFromHabits(demoHabits);
  await setLastShownLevel(getGamificationLevelInfo(gamification).level);
}

export async function exportHabitsBackup() {
  const habits = await getHabits();

  return JSON.stringify(
    {
      app: "Momentum",
      exportedAt: new Date().toISOString(),
      habits,
      version: 1,
    },
    null,
    2
  );
}

export async function importHabitsBackup(jsonText) {
  let parsedData;

  try {
    parsedData = JSON.parse(jsonText);
  } catch (error) {
    logStorageError("Could not parse imported habit backup.", error);
    throw new Error("Backup JSON could not be parsed.");
  }

  const importedHabits = Array.isArray(parsedData)
    ? parsedData
    : parsedData?.habits;

  if (!Array.isArray(importedHabits)) {
    throw new Error("Backup must include a habits array.");
  }

  const normalizedBaseHabits = normalizeHabitList(
    importedHabits.filter(isPlainObject)
  );

  if (importedHabits.length > 0 && normalizedBaseHabits.length === 0) {
    throw new Error("Backup does not include any valid habits.");
  }

  const existingHabits = await getHabits();
  const normalizedHabits = [];

  await cancelRemindersForHabits(existingHabits);

  for (const normalizedHabit of normalizedBaseHabits) {
    const reminderResult = await scheduleReminderIfEnabled(normalizedHabit);

    normalizedHabits.push({
      ...normalizedHabit,
      ...reminderResult,
    });
  }

  await saveHabits(normalizedHabits);
  const gamification = await rebuildGamificationFromHabits(normalizedHabits);
  await setLastShownLevel(getGamificationLevelInfo(gamification).level);

  return normalizedHabits;
}

export async function applyDailyReminderPreference(enabled) {
  const habits = await getHabits();

  if (!enabled) {
    for (const habit of habits) {
      await cancelHabitReminders(habit);
    }

    const nextHabits = habits.map((habit) => ({
      ...habit,
      notificationIds: [],
      reminderStatus: habit.reminderTime ? "disabled" : "none",
    }));

    await saveHabits(nextHabits);

    return nextHabits;
  }

  const nextHabits = [];

  for (const habit of habits) {
    await cancelHabitReminders(habit);
    const reminderResult = await scheduleHabitReminder(habit);

    nextHabits.push({
      ...habit,
      ...reminderResult,
    });
  }

  await saveHabits(nextHabits);

  return nextHabits;
}

export function normalizeHabit(habit, fallbackOrder = 0) {
  const safeHabit = isPlainObject(habit) ? habit : {};

  return {
    ...safeHabit,
    id: safeHabit.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: typeof safeHabit.name === "string" ? safeHabit.name : "",
    createdAt: getSafeCreatedAt(safeHabit.createdAt),
    emoji: safeHabit.emoji || DEFAULT_HABIT_EMOJI,
    category: safeHabit.category || DEFAULT_HABIT_CATEGORY,
    color: safeHabit.color || DEFAULT_HABIT_COLOR,
    frequency: safeHabit.frequency || DEFAULT_HABIT_FREQUENCY,
    customDays: Array.isArray(safeHabit.customDays) ? safeHabit.customDays : [],
    reminderTime:
      typeof safeHabit.reminderTime === "string" ? safeHabit.reminderTime : "",
    notificationIds: Array.isArray(safeHabit.notificationIds)
      ? safeHabit.notificationIds
      : [],
    order: Number.isFinite(safeHabit.order) ? safeHabit.order : fallbackOrder,
    reminderStatus: safeHabit.reminderStatus || "none",
    completedDates: getSafeDateKeys(safeHabit.completedDates),
  };
}

function normalizeHabitList(habits) {
  const seenIds = new Set();

  return habits.map((habit, index) => {
    const normalizedHabit = normalizeHabit(habit, index);
    const uniqueId = getUniqueHabitId(normalizedHabit.id, index, seenIds);

    seenIds.add(uniqueId);

    return {
      ...normalizedHabit,
      id: uniqueId,
    };
  });
}

function getUniqueHabitId(id, index, seenIds) {
  let nextId = id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  if (!seenIds.has(nextId)) {
    return nextId;
  }

  let duplicateCount = 1;

  while (seenIds.has(`${nextId}-duplicate-${index}-${duplicateCount}`)) {
    duplicateCount += 1;
  }

  return `${nextId}-duplicate-${index}-${duplicateCount}`;
}

function getSafeCreatedAt(createdAt) {
  if (typeof createdAt !== "string") {
    return new Date().toISOString();
  }

  return Number.isNaN(new Date(createdAt).getTime())
    ? new Date().toISOString()
    : createdAt;
}

function getSafeDateKeys(dateKeys) {
  if (!Array.isArray(dateKeys)) {
    return [];
  }

  return Array.from(
    new Set(
      dateKeys.filter(
        (dateKey) =>
          typeof dateKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
      )
    )
  ).sort();
}

function getNextTopOrder(habits) {
  if (habits.length === 0) {
    return 0;
  }

  return Math.min(...habits.map((habit) => habit.order || 0)) - 1;
}

async function cancelRemindersForHabits(habits) {
  for (const habit of habits) {
    await cancelHabitReminders(habit);
  }
}

async function scheduleReminderIfEnabled(habit) {
  const preferences = await getAppPreferences();

  if (!preferences.enableDailyReminders) {
    return {
      notificationIds: [],
      reminderStatus: habit.reminderTime ? "disabled" : "none",
    };
  }

  return scheduleHabitReminder(habit);
}

function createDemoHabits() {
  const today = new Date();
  const daysAgo = (days) => {
    const date = new Date(today);
    date.setDate(today.getDate() - days);

    return toDateKey(date);
  };

  return [
    normalizeHabit({
      id: "demo-habit-water",
      name: "Drink water",
      emoji: "💧",
      category: "Health",
      color: "#4F8F86",
      frequency: "Daily",
      customDays: [],
      reminderTime: "",
      notificationIds: [],
      createdAt: daysAgo(18),
      completedDates: [0, 1, 2, 3, 5, 6, 8, 9, 10, 12, 14].map(daysAgo),
    }),
    normalizeHabit({
      id: "demo-habit-reading",
      name: "Read 10 pages",
      emoji: "📚",
      category: "Learning",
      color: "#5A6F9F",
      frequency: "Weekdays",
      customDays: [],
      reminderTime: "",
      notificationIds: [],
      createdAt: daysAgo(24),
      completedDates: [0, 1, 4, 5, 6, 7, 8, 11, 13, 15, 18].map(daysAgo),
    }),
    normalizeHabit({
      id: "demo-habit-walk",
      name: "Evening walk",
      emoji: "💪",
      category: "Fitness",
      color: "#A77D43",
      frequency: "Custom",
      customDays: ["Mon", "Wed", "Fri", "Sun"],
      reminderTime: "",
      notificationIds: [],
      createdAt: daysAgo(12),
      completedDates: [0, 2, 4, 7, 9].map(daysAgo),
    }),
  ];
}

function createMasterDemoHabits() {
  const today = new Date();
  const daysAgo = (days) => {
    const date = new Date(today);
    date.setDate(today.getDate() - days);

    return toDateKey(date);
  };
  const fullYear = Array.from({ length: 100 }, (_, index) => index).map(
    daysAgo
  );

  return [
    normalizeHabit({
      id: "master-demo-morning-focus",
      name: "Morning focus",
      emoji: "⚡",
      category: "Productivity",
      color: "#5A6F9F",
      frequency: "Daily",
      customDays: [],
      reminderTime: "",
      notificationIds: [],
      createdAt: daysAgo(130),
      completedDates: fullYear,
    }),
    normalizeHabit({
      id: "master-demo-training",
      name: "Daily training",
      emoji: "💪",
      category: "Fitness",
      color: "#4F829D",
      frequency: "Daily",
      customDays: [],
      reminderTime: "",
      notificationIds: [],
      createdAt: daysAgo(130),
      completedDates: fullYear,
    }),
    normalizeHabit({
      id: "master-demo-reading",
      name: "Read and reflect",
      emoji: "📚",
      category: "Learning",
      color: "#A77D43",
      frequency: "Daily",
      customDays: [],
      reminderTime: "",
      notificationIds: [],
      createdAt: daysAgo(130),
      completedDates: fullYear,
    }),
    normalizeHabit({
      id: "master-demo-recovery",
      name: "Evening reset",
      emoji: "🌙",
      category: "Mindfulness",
      color: "#4F8F86",
      frequency: "Daily",
      customDays: [],
      reminderTime: "",
      notificationIds: [],
      createdAt: daysAgo(130),
      completedDates: fullYear,
    }),
  ];
}
