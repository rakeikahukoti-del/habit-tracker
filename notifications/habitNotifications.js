import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const ANDROID_CHANNEL_ID = "habit-reminders";
const WEEKDAY_TO_EXPO_DAY = {
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
  Sat: 7,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleHabitReminder(habit) {
  if (!habit || typeof habit !== "object") {
    return createReminderResult([], "none");
  }

  const time = parseReminderTime(habit.reminderTime);

  if (!time) {
    return createReminderResult([], "none");
  }

  const triggers = getReminderTriggers(habit, time);

  if (triggers.length === 0) {
    return createReminderResult([], "inactive");
  }

  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    return createReminderResult([], "permission-denied");
  }

  try {
    await ensureAndroidChannel();

    const notificationIds = [];

    for (const trigger of triggers) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${habit.emoji || "✨"} ${habit.name}`,
          body: "Time for your Momentum habit.",
          data: { habitId: habit.id },
        },
        trigger,
      });

      notificationIds.push(notificationId);
    }

    return createReminderResult(notificationIds, "scheduled");
  } catch {
    return createReminderResult([], "failed");
  }
}

export async function cancelHabitReminders(habit) {
  const notificationIds = Array.isArray(habit.notificationIds)
    ? habit.notificationIds
    : [];

  for (const notificationId of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Ignore missing or already-cancelled notifications.
    }
  }
}

export function hasReminderScheduleChanged(previousHabit, nextHabit) {
  return (
    previousHabit.reminderTime !== nextHabit.reminderTime ||
    previousHabit.frequency !== nextHabit.frequency ||
    previousHabit.name !== nextHabit.name ||
    previousHabit.emoji !== nextHabit.emoji ||
    JSON.stringify(previousHabit.customDays || []) !==
      JSON.stringify(nextHabit.customDays || [])
  );
}

export function parseReminderTime(reminderTime) {
  if (!reminderTime || typeof reminderTime !== "string") {
    return null;
  }

  const match = reminderTime.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);

  if (!match) {
    return null;
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

async function requestNotificationPermission() {
  try {
    const existingPermission = await Notifications.getPermissionsAsync();

    if (
      existingPermission.granted ||
      existingPermission.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }

    const requestedPermission = await Notifications.requestPermissionsAsync();

    return (
      requestedPermission.granted ||
      requestedPermission.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Habit reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function getReminderTriggers(habit, time) {
  if (habit.frequency === "Weekdays") {
    return ["Mon", "Tue", "Wed", "Thu", "Fri"]
      .map((day) => createWeeklyTrigger(day, time))
      .filter(Boolean);
  }

  if (habit.frequency === "Custom") {
    return (habit.customDays || [])
      .map((day) => createWeeklyTrigger(day, time))
      .filter(Boolean);
  }

  return [
    {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
      channelId: ANDROID_CHANNEL_ID,
    },
  ];
}

function createWeeklyTrigger(day, time) {
  const weekday = WEEKDAY_TO_EXPO_DAY[day];

  if (!weekday) {
    return null;
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday,
    hour: time.hour,
    minute: time.minute,
    channelId: ANDROID_CHANNEL_ID,
  };
}

function createReminderResult(notificationIds, reminderStatus) {
  return {
    notificationIds,
    reminderStatus,
  };
}
