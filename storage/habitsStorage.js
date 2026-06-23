import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_HABIT_COLOR } from "../constants/habitOptions";
import { getAppPreferences, setLastShownLevel } from "./appPreferences";
import {
  getGamificationLevelInfo,
  rebuildGamificationFromHabits,
  resetGamification,
} from "./gamificationStorage";
import {
  cancelHabitReminders,
  hasReminderScheduleChanged,
  scheduleHabitReminder,
} from "../notifications/habitNotifications";
import { getTodayKey, toDateKey, wasCompletedToday } from "../utils/habitStats";

const HABITS_KEY = "habit-tracker:habits";
const HABITS_BACKUP_KEY = "habit-tracker:habits-backup";
const DEFAULT_HABIT_EMOJI = "✨";
const DEFAULT_CATEGORY = "Health";
const DEFAULT_FREQUENCY = "Daily";

export async function getHabits() {
  const rawHabits = await AsyncStorage.getItem(HABITS_KEY);

  if (!rawHabits) {
    return [];
  }

  try {
    const parsedHabits = JSON.parse(rawHabits);
    return Array.isArray(parsedHabits)
      ? parsedHabits
          .map((habit, index) => normalizeHabit(habit, index))
          .sort((firstHabit, secondHabit) => firstHabit.order - secondHabit.order)
      : [];
  } catch {
    await AsyncStorage.setItem(HABITS_BACKUP_KEY, rawHabits);
    return [];
  }
}

export async function saveHabits(habits) {
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
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

export async function moveHabit(id, direction) {
  const habits = await getHabits();
  const currentIndex = habits.findIndex((habit) => habit.id === id);

  if (currentIndex === -1) {
    return habits;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= habits.length) {
    return habits;
  }

  const reorderedHabits = [...habits];
  const [habitToMove] = reorderedHabits.splice(currentIndex, 1);
  reorderedHabits.splice(targetIndex, 0, habitToMove);

  const orderedHabits = reorderedHabits.map((habit, index) =>
    normalizeHabit(
      {
        ...habit,
        order: index,
      },
      index
    )
  );

  await saveHabits(orderedHabits);

  return orderedHabits;
}

export async function deleteHabit(id) {
  const habits = await getHabits();
  const habitToDelete = habits.find((habit) => habit.id === id);

  if (habitToDelete) {
    await cancelHabitReminders(habitToDelete);
  }

  const nextHabits = habits.filter((habit) => habit.id !== id);

  await saveHabits(nextHabits);
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
  const parsedData = JSON.parse(jsonText);
  const importedHabits = Array.isArray(parsedData)
    ? parsedData
    : parsedData?.habits;

  if (!Array.isArray(importedHabits)) {
    throw new Error("Backup must include a habits array.");
  }

  const existingHabits = await getHabits();
  await cancelRemindersForHabits(existingHabits);

  const normalizedHabits = [];

  for (const habit of importedHabits) {
    const normalizedHabit = normalizeHabit({
      ...habit,
      id: habit.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: habit.createdAt || new Date().toISOString(),
    });
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
  return {
    ...habit,
    name: habit.name || "",
    emoji: habit.emoji || DEFAULT_HABIT_EMOJI,
    category: habit.category || DEFAULT_CATEGORY,
    color: habit.color || DEFAULT_HABIT_COLOR,
    frequency: habit.frequency || DEFAULT_FREQUENCY,
    customDays: Array.isArray(habit.customDays) ? habit.customDays : [],
    reminderTime: habit.reminderTime || "",
    notificationIds: Array.isArray(habit.notificationIds)
      ? habit.notificationIds
      : [],
    order: Number.isFinite(habit.order) ? habit.order : fallbackOrder,
    reminderStatus: habit.reminderStatus || "none",
    completedDates: Array.isArray(habit.completedDates)
      ? habit.completedDates
      : [],
  };
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
