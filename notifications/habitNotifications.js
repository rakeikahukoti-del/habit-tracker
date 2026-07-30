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
const VALID_WEEKDAYS = Object.keys(WEEKDAY_TO_EXPO_DAY);
const SHORT_WEEKDAY_TO_LONG = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const WEEKDAY_SCHEDULE = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKEND_SCHEDULE = ["Sat", "Sun"];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleHabitReminder(
  habit,
  { requestPermission = true } = {}
) {
  if (!habit || typeof habit !== "object") {
    return createReminderResult([], "none");
  }

  const schedule = createReminderSchedule(habit);

  if (!schedule.active) {
    return createReminderResult([], schedule.status);
  }

  const hasPermission = requestPermission
    ? await requestNotificationPermission()
    : await hasNotificationPermission();

  if (!hasPermission) {
    return createReminderResult([], "permission-denied");
  }

  try {
    await ensureAndroidChannel();

    const notificationIds = [];

    for (const request of schedule.requests) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: request.content,
        trigger: request.trigger,
      });

      notificationIds.push(notificationId);
    }

    return createReminderResult(notificationIds, "scheduled");
  } catch {
    return createReminderResult([], "failed");
  }
}

export async function syncHabitReminder(
  habit,
  { enabled = true, requestPermission = true } = {}
) {
  await cancelHabitReminders(habit);

  if (!enabled) {
    return createReminderResult(
      [],
      parseReminderTime(habit?.reminderTime) ? "disabled" : "none"
    );
  }

  return scheduleHabitReminder(habit, { requestPermission });
}

export async function cancelHabitReminders(habit) {
  const notificationIds = Array.isArray(habit.notificationIds)
    ? habit.notificationIds.filter(
        (notificationId) =>
          typeof notificationId === "string" && notificationId.trim().length > 0
      )
    : [];

  for (const notificationId of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Ignore missing or already-cancelled notifications.
    }
  }
}

export async function reconcileNotifications(habits, { enabled = true } = {}) {
  const safeHabits = Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
  const validNotificationIds = new Set(
    safeHabits.flatMap((habit) => getValidNotificationIds(habit))
  );

  await removeInvalidNotifications(validNotificationIds);
  const scheduledNotificationIds = await getScheduledNotificationIds();

  const nextHabits = [];
  let changed = false;

  for (const habit of safeHabits) {
    const validation = validateReminderState(habit, {
      enabled,
      scheduledNotificationIds,
    });

    if (!validation.needsRepair) {
      nextHabits.push(habit);
      continue;
    }

    if (!enabled || validation.expectedCount === 0) {
      nextHabits.push({
        ...habit,
        notificationIds: [],
        reminderStatus: validation.status,
      });
      changed = true;
      continue;
    }

    const reminderResult = await syncHabitReminder(habit, {
      enabled,
      requestPermission: false,
    });
    const nextHabit = {
      ...habit,
      ...reminderResult,
    };

    nextHabits.push(nextHabit);
    changed = true;
  }

  return {
    changed,
    habits: nextHabits,
  };
}

export async function removeInvalidNotifications(validNotificationIds = new Set()) {
  let scheduledNotifications = [];

  try {
    scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return { cancelledCount: 0, duplicateCount: 0, orphanedCount: 0 };
  }

  const seenValidIds = new Set();
  let cancelledCount = 0;
  let duplicateCount = 0;
  let orphanedCount = 0;

  for (const notification of scheduledNotifications) {
    const notificationId = notification?.identifier;

    if (!notificationId || typeof notificationId !== "string") {
      continue;
    }

    const isValid = validNotificationIds.has(notificationId);
    const isDuplicate = isValid && seenValidIds.has(notificationId);

    if (isDuplicate || !isValid) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        cancelledCount += 1;
        duplicateCount += isDuplicate ? 1 : 0;
        orphanedCount += isValid ? 0 : 1;
      } catch {
        // Ignore already-cancelled notifications.
      }
      continue;
    }

    seenValidIds.add(notificationId);
  }

  return { cancelledCount, duplicateCount, orphanedCount };
}

export function validateReminderState(
  habit,
  { enabled = true, scheduledNotificationIds = null } = {}
) {
  const schedule = createReminderSchedule(habit);
  const notificationIds = getValidNotificationIds(habit);
  const hasMissingScheduledId =
    scheduledNotificationIds instanceof Set &&
    notificationIds.some(
      (notificationId) => !scheduledNotificationIds.has(notificationId)
    );

  if (!schedule.active) {
    return {
      expectedCount: 0,
      needsRepair:
        notificationIds.length > 0 ||
        habit?.reminderStatus !== schedule.status,
      status: schedule.status,
    };
  }

  if (!enabled) {
    return {
      expectedCount: 0,
      needsRepair:
        notificationIds.length > 0 || habit?.reminderStatus !== "disabled",
      status: "disabled",
    };
  }

  return {
    expectedCount: schedule.requests.length,
    needsRepair:
      habit?.reminderStatus !== "scheduled" ||
      notificationIds.length !== schedule.requests.length ||
      hasMissingScheduledId,
    status: "scheduled",
  };
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

export function createReminderSchedule(habit) {
  if (!habit || typeof habit !== "object") {
    return createInactiveSchedule("none");
  }

  const time = parseReminderTime(habit.reminderTime);

  if (!time) {
    return createInactiveSchedule("none");
  }

  const triggers = getReminderTriggers(habit, time);

  if (triggers.length === 0) {
    return createInactiveSchedule("inactive");
  }

  return {
    active: true,
    preview: getReminderPreview(habit),
    requests: triggers.map((trigger, index) => {
      const key = createReminderRequestKey(habit, trigger, index);

      return {
        content: getReminderContent(habit, key),
        key,
        trigger,
      };
    }),
    status: "scheduled",
  };
}

export function getReminderPreview(habit) {
  const time = parseReminderTime(habit?.reminderTime);

  if (!time) {
    return "No reminder set";
  }

  const days = getReminderDays(habit);
  const timeLabel = formatReminderTime(time);

  if (days.length === 0) {
    return "No scheduled reminder days";
  }

  if (days.length === 7) {
    return `Every day at ${timeLabel}`;
  }

  if (isSameDaySet(days, WEEKDAY_SCHEDULE)) {
    return `Every weekday at ${timeLabel}`;
  }

  if (isSameDaySet(days, WEEKEND_SCHEDULE)) {
    return `Every weekend at ${timeLabel}`;
  }

  return `Every ${formatDayList(days)} at ${timeLabel}`;
}

export function getReminderContent(habit, reminderKey = "") {
  const name =
    typeof habit?.name === "string" && habit.name.trim()
      ? habit.name.trim()
      : "habit";

  return {
    title: "Momentum",
    body: `Time for your ${name} habit.`,
    data: { habitId: habit?.id || "", reminderKey },
  };
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

export async function getNotificationPermissionState() {
  try {
    const permission = await Notifications.getPermissionsAsync();

    if (
      permission.granted ||
      permission.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL
    ) {
      return "granted";
    }

    if (permission.canAskAgain === false) {
      return "blocked";
    }

    return "not-requested";
  } catch {
    return "unavailable";
  }
}

export function getNotificationPermissionMessage(state) {
  if (state === "granted") {
    return "Habit reminders can be scheduled on this device.";
  }

  if (state === "blocked") {
    return "Notifications are off for Momentum. You can enable them in device settings.";
  }

  if (state === "unavailable") {
    return "Notifications are unavailable in this environment.";
  }

  return "Momentum asks permission only when you save a habit with a reminder.";
}

export function getReminderDays(habit) {
  if (habit?.frequency === "Weekdays") {
    return WEEKDAY_SCHEDULE;
  }

  if (habit?.frequency === "Weekends") {
    return WEEKEND_SCHEDULE;
  }

  if (habit?.frequency === "Custom") {
    return getUniqueValidWeekdays(habit.customDays);
  }

  return VALID_WEEKDAYS;
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

async function hasNotificationPermission() {
  try {
    const permission = await Notifications.getPermissionsAsync();

    return (
      permission.granted ||
      permission.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

async function getScheduledNotificationIds() {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    return new Set(
      scheduledNotifications
        .map((notification) => notification?.identifier)
        .filter(
          (notificationId) =>
            typeof notificationId === "string" &&
            notificationId.trim().length > 0
        )
    );
  } catch {
    return null;
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
    return WEEKDAY_SCHEDULE
      .map((day) => createWeeklyTrigger(day, time))
      .filter(Boolean);
  }

  if (habit.frequency === "Weekends") {
    return WEEKEND_SCHEDULE
      .map((day) => createWeeklyTrigger(day, time))
      .filter(Boolean);
  }

  if (habit.frequency === "Custom") {
    return getUniqueValidWeekdays(habit.customDays)
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

export function getUniqueValidWeekdays(days) {
  if (!Array.isArray(days)) {
    return [];
  }

  return Array.from(
    new Set(days.filter((day) => VALID_WEEKDAYS.includes(day)))
  );
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

function createReminderRequestKey(habit, trigger, index) {
  const habitId = habit?.id || "habit";
  const schedulePart =
    trigger.type === Notifications.SchedulableTriggerInputTypes.WEEKLY
      ? `weekday-${trigger.weekday}`
      : `daily-${index}`;

  return `${habitId}:${schedulePart}:${trigger.hour}:${trigger.minute}`;
}

function createInactiveSchedule(status) {
  return {
    active: false,
    preview:
      status === "inactive" ? "No scheduled reminder days" : "No reminder set",
    requests: [],
    status,
  };
}

function createReminderResult(notificationIds, reminderStatus) {
  return {
    notificationIds,
    reminderStatus,
  };
}

function formatReminderTime(time) {
  const period = time.hour >= 12 ? "PM" : "AM";
  const hour12 = time.hour % 12 || 12;
  const minute = String(time.minute).padStart(2, "0");

  return `${hour12}:${minute} ${period}`;
}

function formatDayList(days) {
  const labels = days.map((day) => SHORT_WEEKDAY_TO_LONG[day] || day);

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function isSameDaySet(days, expectedDays) {
  return (
    days.length === expectedDays.length &&
    expectedDays.every((day) => days.includes(day))
  );
}

function getValidNotificationIds(habit) {
  return Array.isArray(habit?.notificationIds)
    ? habit.notificationIds.filter(
        (notificationId) =>
          typeof notificationId === "string" && notificationId.trim().length > 0
      )
    : [];
}
