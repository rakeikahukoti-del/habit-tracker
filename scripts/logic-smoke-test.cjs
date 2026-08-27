const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const babel = require("@babel/core");

function loadModule(filePath, customRequire = require) {
  const source = fs.readFileSync(filePath, "utf8");
  const { code } = babel.transformSync(source, {
    filename: filePath,
    presets: ["babel-preset-expo"],
  });
  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    require: customRequire,
    console,
    Date,
    JSON,
    Math,
    Map,
    Number,
    RegExp,
    Set,
    String,
    Array,
    Object,
  };

  vm.runInNewContext(code, context, { filename: filePath });

  return module.exports;
}

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function assertJsonEqual(actual, expected, message) {
  assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected), message);
}

const asyncStorageStore = {};
const asyncStorageFailures = {
  get: false,
  partialMultiSetAfter: null,
  set: false,
};
const asyncStorageMock = {
  getItem: async (key) => {
    if (asyncStorageFailures.get) {
      throw new Error("get failed");
    }

    return asyncStorageStore[key] ?? null;
  },
  multiGet: async (keys) => {
    if (asyncStorageFailures.get) {
      throw new Error("get failed");
    }

    return keys.map((key) => [key, asyncStorageStore[key] ?? null]);
  },
  multiSet: async (entries) => {
    if (asyncStorageFailures.set) {
      throw new Error("set failed");
    }

    if (Number.isInteger(asyncStorageFailures.partialMultiSetAfter)) {
      const entriesToWrite = entries.slice(
        0,
        asyncStorageFailures.partialMultiSetAfter
      );

      asyncStorageFailures.partialMultiSetAfter = null;
      entriesToWrite.forEach(([key, value]) => {
        asyncStorageStore[key] = value;
      });

      throw new Error("partial set failed");
    }

    entries.forEach(([key, value]) => {
      asyncStorageStore[key] = value;
    });
  },
  multiRemove: async (keys) => {
    keys.forEach((key) => {
      delete asyncStorageStore[key];
    });
  },
  removeItem: async (key) => {
    delete asyncStorageStore[key];
  },
  setItem: async (key, value) => {
    if (asyncStorageFailures.set) {
      throw new Error("set failed");
    }

    asyncStorageStore[key] = value;
  },
};

const notificationState = {
  cancelled: [],
  permissions: { granted: true, canAskAgain: true },
  permissionRequests: 0,
  scheduled: [],
  shouldScheduleThrow: false,
};
const expoNotificationsMock = {
  AndroidImportance: { DEFAULT: "default" },
  IosAuthorizationStatus: { PROVISIONAL: "provisional" },
  SchedulableTriggerInputTypes: {
    DAILY: "daily",
    WEEKLY: "weekly",
  },
  cancelScheduledNotificationAsync: async (notificationId) => {
    notificationState.cancelled.push(notificationId);
    notificationState.scheduled = notificationState.scheduled.filter(
      (item) => item.id !== notificationId
    );
  },
  getAllScheduledNotificationsAsync: async () =>
    notificationState.scheduled.map((item) => ({
      identifier: item.id,
      content: item.request.content,
      trigger: item.request.trigger,
    })),
  getPermissionsAsync: async () => notificationState.permissions,
  requestPermissionsAsync: async () => {
    notificationState.permissionRequests += 1;

    return notificationState.permissions;
  },
  scheduleNotificationAsync: async (request) => {
    if (notificationState.shouldScheduleThrow) {
      throw new Error("schedule failed");
    }

    const id = `notification-${notificationState.scheduled.length + 1}`;

    notificationState.scheduled.push({ id, request });

    return id;
  },
  setNotificationChannelAsync: async () => {},
  setNotificationHandler: () => {},
};

function resetStorage() {
  asyncStorageFailures.get = false;
  asyncStorageFailures.partialMultiSetAfter = null;
  asyncStorageFailures.set = false;
  appPreferencesMockState.enableDailyReminders = false;
  Object.keys(asyncStorageStore).forEach((key) => {
    delete asyncStorageStore[key];
  });
}

function resetNotifications() {
  notificationState.cancelled = [];
  notificationState.permissions = { granted: true, canAskAgain: true };
  notificationState.permissionRequests = 0;
  notificationState.scheduled = [];
  notificationState.shouldScheduleThrow = false;
}

function dateKeyForOffset(offset) {
  const date = new Date();

  date.setDate(date.getDate() + offset);

  return habitStats.toDateKey(date);
}

function getPreviousScheduledDateKeys(count, allowedWeekdays) {
  const keys = [];
  const cursor = new Date();

  cursor.setDate(cursor.getDate() - 1);

  while (keys.length < count) {
    if (allowedWeekdays.includes(getWeekdayLabel(cursor))) {
      keys.push(habitStats.toDateKey(cursor));
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return keys.reverse();
}

function countScheduledDaysInLastDays(numberOfDays, allowedWeekdays) {
  let count = 0;

  for (let offset = -(numberOfDays - 1); offset <= 0; offset += 1) {
    const date = new Date();

    date.setDate(date.getDate() + offset);

    if (allowedWeekdays.includes(getWeekdayLabel(date))) {
      count += 1;
    }
  }

  return count;
}

function getWeekdayLabel(date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

const storageUtils = {
  isPlainObject: (value) =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value),
  logStorageError: () => {},
  createExclusiveQueue: () => {
    let queueTail = Promise.resolve();

    return function runExclusive(task) {
      const result = queueTail.catch(() => {}).then(task);

      queueTail = result.catch(() => {});

      return result;
    };
  },
};
const habitStats = loadModule("utils/habitStats.js");
const gamificationLogic = loadModule("utils/gamification.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const rankDisplay = loadModule("utils/rankDisplay.js");
const progressionMilestones = loadModule("utils/progressionMilestones.js", (moduleName) => {
  if (moduleName === "./gamification") {
    return gamificationLogic;
  }

  if (moduleName === "./rankDisplay") {
    return rankDisplay;
  }

  return require(moduleName);
});
const weeklyReview = loadModule("utils/weeklyReview.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const dailyPlanning = loadModule("utils/dailyPlanning.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const homeHabitActions = loadModule("utils/homeHabitActions.js", (moduleName) => {
  if (moduleName === "./gamification") {
    return gamificationLogic;
  }

  if (moduleName === "./habitStats") {
    return habitStats;
  }

  if (moduleName === "./weeklyReview") {
    return weeklyReview;
  }

  if (moduleName === "./rankDisplay") {
    return rankDisplay;
  }

  if (moduleName === "./dailyPlanning") {
    return dailyPlanning;
  }

  return require(moduleName);
});
const analyticsReadiness = loadModule("utils/analyticsReadiness.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const themePreferences = loadModule("utils/themePreferences.js");
const interactionFeedback = loadModule("utils/interactionFeedback.js");
const calendarMonth = loadModule("utils/calendarMonth.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const activityHistory = loadModule("utils/activityHistory.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const designColors = loadModule("src/design/colors.js");
const legacyThemeAdapter = loadModule("src/design/legacyThemeAdapter.js", (moduleName) => {
  if (moduleName === "./colors") {
    return designColors;
  }

  return require(moduleName);
});
const appColors = loadModule("constants/colors.js", (moduleName) => {
  if (moduleName === "../src/design/legacyThemeAdapter") {
    return legacyThemeAdapter;
  }

  return require(moduleName);
});
const appAssets = loadModule("constants/assets.js", (moduleName) => {
  if (moduleName.endsWith(".png")) {
    return require("path").resolve("constants", moduleName);
  }

  return require(moduleName);
});
const achievementConstants = loadModule("constants/achievements.js");
const achievementProgress = loadModule("utils/achievementProgress.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const firstUseExperience = loadModule("utils/firstUseExperience.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const returnExperience = loadModule("utils/returnExperience.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  if (moduleName === "./weeklyReview") {
    return weeklyReview;
  }

  return require(moduleName);
});
const personalRecords = loadModule("utils/personalRecords.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const insightsDashboard = loadModule("utils/insightsDashboard.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  if (moduleName === "./personalRecords") {
    return personalRecords;
  }

  return require(moduleName);
});
const analyticsPresentation = loadModule("utils/analyticsPresentation.js");
const habitOptions = loadModule("constants/habitOptions.js");
const habitTemplates = loadModule("utils/habitTemplates.js", (moduleName) => {
  if (moduleName === "../constants/habitOptions") {
    return habitOptions;
  }

  return require(moduleName);
});
const habitNotifications = loadModule("notifications/habitNotifications.js", (moduleName) => {
  if (moduleName === "react-native") {
    return { Platform: { OS: "ios" } };
  }

  if (moduleName === "expo-notifications") {
    return expoNotificationsMock;
  }

  return require(moduleName);
});
const appPreferencesStorage = loadModule("storage/appPreferences.js", (moduleName) => {
  if (moduleName === "@react-native-async-storage/async-storage") {
    return { __esModule: true, default: asyncStorageMock };
  }

  if (moduleName === "./storageUtils") {
    return storageUtils;
  }

  return require(moduleName);
});
const settingsPresentation = loadModule(
  "utils/settingsPresentation.js",
  (moduleName) => {
    if (moduleName === "../notifications/habitNotifications") {
      return habitNotifications;
    }

    return require(moduleName);
  }
);
const gamificationStorage = loadModule("storage/gamificationStorage.js", (moduleName) => {
  if (moduleName === "@react-native-async-storage/async-storage") {
    return { __esModule: true, default: asyncStorageMock };
  }

  if (moduleName === "../utils/habitStats") {
    return habitStats;
  }

  if (moduleName === "../utils/gamification") {
    return gamificationLogic;
  }

  if (moduleName === "./storageUtils") {
    return storageUtils;
  }

  return require(moduleName);
});
const appPreferencesMockState = {
  enableDailyReminders: false,
};
const appPreferencesMock = {
  getAppPreferences: async () => ({
    enableDailyReminders: appPreferencesMockState.enableDailyReminders,
  }),
  setLastShownLevel: async (level) => {
    asyncStorageStore["habit-tracker:last-shown-level"] = String(level);
  },
};
const habitsStorage = loadModule("storage/habitsStorage.js", (moduleName) => {
  if (moduleName === "@react-native-async-storage/async-storage") {
    return { __esModule: true, default: asyncStorageMock };
  }

  if (moduleName === "../constants/habitOptions") {
    return habitOptions;
  }

  if (moduleName === "./appPreferences") {
    return appPreferencesMock;
  }

  if (moduleName === "./gamificationStorage") {
    return gamificationStorage;
  }

  if (moduleName === "./storageUtils") {
    return storageUtils;
  }

  if (moduleName === "../notifications/habitNotifications") {
    return habitNotifications;
  }

  if (moduleName === "../utils/habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const dailyPlanStorage = loadModule("storage/dailyPlanStorage.js", (moduleName) => {
  if (moduleName === "@react-native-async-storage/async-storage") {
    return { __esModule: true, default: asyncStorageMock };
  }

  if (moduleName === "../utils/habitStats") {
    return habitStats;
  }

  if (moduleName === "../utils/dailyPlanning") {
    return dailyPlanning;
  }

  if (moduleName === "./storageUtils") {
    return storageUtils;
  }

  return require(moduleName);
});
const appBackup = loadModule("storage/appBackup.js", (moduleName) => {
  if (moduleName === "@react-native-async-storage/async-storage") {
    return { __esModule: true, default: asyncStorageMock };
  }

  if (moduleName === "../package.json") {
    return { version: "1.0.0" };
  }

  if (moduleName === "../utils/dailyPlanning") {
    return dailyPlanning;
  }

  if (moduleName === "../utils/gamification") {
    return gamificationLogic;
  }

  if (moduleName === "../utils/themePreferences") {
    return themePreferences;
  }

  if (moduleName === "./appPreferences") {
    return appPreferencesStorage;
  }

  if (moduleName === "./dailyPlanStorage") {
    return dailyPlanStorage;
  }

  if (moduleName === "./gamificationStorage") {
    return gamificationStorage;
  }

  if (moduleName === "./habitsStorage") {
    return habitsStorage;
  }

  if (moduleName === "./storageUtils") {
    return storageUtils;
  }

  return require(moduleName);
});
const habitCompletionActions = loadModule("utils/habitCompletionActions.js", (moduleName) => {
  if (moduleName === "../storage/gamificationStorage") {
    return gamificationStorage;
  }

  if (moduleName === "../storage/habitsStorage") {
    return habitsStorage;
  }

  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
// No imports - plain trig helpers on numbers/arrays (Phase 9 rank-medal
// conversion; shared by BadgeFrame.js and RankMedalFrame.js).
const frameGeometry = loadModule("components/progression/frameGeometry.js");
const designMotion = loadModule("src/design/motion.js");
const badgeUnlockTiming = loadModule("utils/badgeUnlockTiming.js", (moduleName) => {
  if (moduleName === "../src/design") {
    return designMotion;
  }

  return require(moduleName);
});

test("date keys and active streaks stay local-date safe", () => {
  assert.match(habitStats.getTodayKey(), /^\d{4}-\d{2}-\d{2}$/);
  assert.strictEqual(habitStats.getCurrentStreak([]), 0);
  assert.strictEqual(
    habitStats.getCurrentStreak([dateKeyForOffset(-2), dateKeyForOffset(-1)]),
    2,
    "active streak should continue from yesterday before today's completion"
  );
  assert.strictEqual(
    habitStats.getCurrentStreak([dateKeyForOffset(-3), dateKeyForOffset(-1)]),
    1,
    "a missed day should break the active streak"
  );
  assert.strictEqual(
    habitStats.getBestStreak(["2024-02-28", "2024-02-29", "2024-03-01"]),
    3,
    "leap-year streaks should bridge February 29"
  );
  assert.strictEqual(
    habitStats.getBestStreak(["2025-12-31", "2026-01-01"]),
    2,
    "streaks should bridge year boundaries"
  );
});

test("calendar month helper handles leap years, blanks, today, and future days", () => {
  const days = calendarMonth.getCalendarMonthDays(
    { completedDates: ["2024-02-29"] },
    new Date(2024, 1, 1),
    new Date(2024, 1, 20)
  );
  const realDays = days.filter((day) => !day.isBlank);

  assert.strictEqual(days.filter((day) => day.isBlank).length, 4);
  assert.strictEqual(realDays.length, 29);
  assert.strictEqual(realDays[19].dateKey, "2024-02-20");
  assert.strictEqual(realDays[19].isToday, true);
  assert.strictEqual(realDays[20].isFuture, true);
  assert.strictEqual(
    realDays.find((day) => day.dateKey === "2024-02-29").completed,
    true
  );
  assert.strictEqual(
    calendarMonth.isCurrentOrFutureMonth(
      new Date(2024, 2, 1),
      new Date(2024, 1, 20)
    ),
    true
  );
  assert.strictEqual(
    calendarMonth.isCurrentOrFutureMonth(
      new Date(2024, 0, 1),
      new Date(2024, 1, 20)
    ),
    false
  );
});

test("activity history years include current and valid historic data only", () => {
  const years = activityHistory.getAvailableActivityYears(
    [
      {
        completedDates: ["2024-02-29", "not-a-date", "2027-01-01"],
        createdAt: "2025-01-10T12:00:00.000Z",
      },
    ],
    new Date(2026, 6, 15)
  );

  assertJsonEqual(years, [2026, 2025, 2024]);
});

test("activity heatmap handles leap years, future days, and schedule states", () => {
  const habits = [
    {
      completedDates: ["2024-02-29", "2024-02-29", "bad"],
      createdAt: "2024-02-28",
      frequency: "Daily",
      id: "daily",
      name: "Daily",
    },
    {
      completedDates: [],
      createdAt: "2024-02-28",
      customDays: ["Fri"],
      frequency: "Custom",
      id: "friday",
      name: "Friday",
    },
  ];
  const days = activityHistory.getYearActivityDays(
    habits,
    2024,
    new Date(2024, 1, 29)
  );

  assert.strictEqual(days.length, 366);
  assert.strictEqual(
    days.find((day) => day.dateKey === "2024-02-27").state,
    "beforeTracking"
  );
  assert.strictEqual(
    days.find((day) => day.dateKey === "2024-02-29").state,
    "scheduledComplete"
  );
  assert.strictEqual(
    days.find((day) => day.dateKey === "2024-03-01").state,
    "future"
  );
});

test("activity history uses scheduled opportunities for partial and perfect days", () => {
  const habits = [
    {
      completedDates: ["2026-07-13"],
      createdAt: "2026-07-01",
      frequency: "Weekdays",
      id: "workout",
      name: "Workout",
    },
    {
      completedDates: [],
      createdAt: "2026-07-01",
      customDays: ["Mon"],
      frequency: "Custom",
      id: "read",
      name: "Read",
    },
  ];
  const monday = activityHistory.getDayActivitySummary(
    habits,
    "2026-07-13",
    new Date(2026, 6, 15)
  );
  const sunday = activityHistory.getDayActivitySummary(
    habits,
    "2026-07-12",
    new Date(2026, 6, 15)
  );

  assert.strictEqual(monday.scheduledCount, 2);
  assert.strictEqual(monday.completedCount, 1);
  assert.strictEqual(monday.completionRate, 50);
  assert.strictEqual(monday.state, "scheduledPartial");
  assert.strictEqual(activityHistory.getHeatmapIntensity(monday), "partial");
  assert.strictEqual(sunday.state, "unscheduled");
});

test("activity month summary excludes future dates and reports valid insights", () => {
  const habits = [
    {
      completedDates: ["2026-06-01", "2026-07-01", "2026-07-02"],
      createdAt: "2026-06-01",
      frequency: "Daily",
      id: "daily",
      name: "Daily",
    },
    {
      completedDates: ["2026-07-01"],
      createdAt: "2026-06-01",
      customDays: ["Wed"],
      frequency: "Custom",
      id: "custom",
      name: "Custom",
    },
  ];
  const summary = activityHistory.getMonthActivitySummary(
    habits,
    new Date(2026, 6, 1),
    new Date(2026, 6, 2)
  );

  assert.strictEqual(summary.completedCount, 3);
  assert.strictEqual(summary.possibleCount, 3);
  assert.strictEqual(summary.completionRate, 100);
  assert.strictEqual(summary.perfectDays, 2);
  assert.strictEqual(summary.activeDays, 2);
  assert.strictEqual(summary.strongestHabit.name, "Daily");
  assert.strictEqual(summary.mostImprovedHabit.name, "Custom");
});

test("activity accessibility labels describe day state without relying on color", () => {
  const label = activityHistory.getActivityDayAccessibilityLabel({
    completedCount: 3,
    completionRate: 100,
    dateKey: "2026-07-14",
    isPerfectDay: true,
    scheduledCount: 3,
    state: "scheduledComplete",
  });

  assert.match(label, /2026/);
  assert.match(label, /perfect day/);
  assert.match(label, /3 of 3 scheduled habits completed/);
  assert.strictEqual(
    activityHistory.getHabitDayState(
      {
        completedDates: ["2026-07-14"],
        createdAt: "2026-07-01",
        frequency: "Daily",
      },
      "2026-07-14",
      new Date(2026, 6, 15)
    ).state,
    "complete"
  );
});

test("habit stats ignore invalid, duplicate, and future completions", () => {
  assert.strictEqual(
    habitStats.getBestStreak([
      "2026-01-01",
      "2026-01-02",
      "2026-01-02",
      "not-a-date",
      "2026-99-99",
      "2026-01-04",
      "2026-01-05",
      "2026-01-06",
    ]),
    3
  );
  assert.strictEqual(
    habitStats.wasCompletedToday({
      completedDates: [habitStats.getTodayKey(), habitStats.getTodayKey(), "bad"],
    }),
    true
  );
  assert.strictEqual(
    habitStats.getHabitPerformance(
      {
        completedDates: [habitStats.getTodayKey(), dateKeyForOffset(1)],
        createdAt: habitStats.getTodayKey(),
        frequency: "Daily",
      },
      "week"
    ).completedCount,
    1,
    "future completions should not be counted in current analytics periods"
  );
});

test("scheduled streak and analytics respect weekdays, custom days, and creation date", () => {
  const previousWeekdays = getPreviousScheduledDateKeys(2, [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
  ]);
  const customDays = ["Mon", "Wed", "Fri"];
  const previousCustomDays = getPreviousScheduledDateKeys(2, customDays);

  assert.strictEqual(
    habitStats.getCurrentStreak(previousWeekdays, { frequency: "Weekdays" }),
    2,
    "weekday streaks should skip unscheduled weekend days"
  );
  assert.strictEqual(
    habitStats.getBestStreak(previousWeekdays, { frequency: "Weekdays" }),
    2,
    "best streaks should count consecutive scheduled weekdays"
  );
  assert.strictEqual(
    habitStats.getCurrentStreak(previousCustomDays, {
      customDays,
      frequency: "Custom",
    }),
    2,
    "custom streaks should skip days outside the custom schedule"
  );

  const weekdayHabit = {
    completedDates: previousWeekdays,
    createdAt: dateKeyForOffset(-29),
    frequency: "Weekdays",
  };
  const weekdayPerformance = habitStats.getHabitPerformance(weekdayHabit, "week");

  assert.strictEqual(
    weekdayPerformance.possibleCount,
    countScheduledDaysInLastDays(7, ["Mon", "Tue", "Wed", "Thu", "Fri"]),
    "weekday analytics should count scheduled opportunities only"
  );
  assert.strictEqual(
    habitStats.getHabitPerformance(
      {
        completedDates: [],
        createdAt: habitStats.getTodayKey(),
        frequency: "Daily",
      },
      "month"
    ).possibleCount,
    1,
    "new habits should not be counted as missed before creation"
  );
  assert.strictEqual(
    habitStats.getHabitPerformance(
      { completedDates: [], frequency: "Daily" },
      "month"
    ).possibleCount,
    1,
    "legacy habits without dates should fall back to today for analytics"
  );
});

test("progress overview handles empty data safely", () => {
  const emptyOverview = habitStats.getProgressOverview([], "month", { xp: 0 });

  assert.strictEqual(emptyOverview.habitCount, 0);
  assert.strictEqual(emptyOverview.completionRate, 0);
  assert.strictEqual(emptyOverview.totalXpEarned, 0);
});

test("notification time parsing and weekday normalization are strict", () => {
  assertJsonEqual(habitNotifications.parseReminderTime("09:30"), {
    hour: 9,
    minute: 30,
  });
  assertJsonEqual(habitNotifications.parseReminderTime("23:59"), {
    hour: 23,
    minute: 59,
  });
  assert.strictEqual(habitNotifications.parseReminderTime("24:00"), null);
  assert.strictEqual(habitNotifications.parseReminderTime("09:60"), null);
  assertJsonEqual(
    habitNotifications.getUniqueValidWeekdays(["Mon", "Mon", "Bad", "Fri"]),
    ["Mon", "Fri"]
  );
});

test("notification reminder previews are deterministic and readable", () => {
  assert.strictEqual(
    habitNotifications.getReminderPreview({
      frequency: "Daily",
      reminderTime: "21:00",
    }),
    "Every day at 9:00 PM"
  );
  assert.strictEqual(
    habitNotifications.getReminderPreview({
      frequency: "Weekdays",
      reminderTime: "07:05",
    }),
    "Every weekday at 7:05 AM"
  );
  assert.strictEqual(
    habitNotifications.getReminderPreview({
      customDays: ["Mon", "Thu"],
      frequency: "Custom",
      reminderTime: "18:30",
    }),
    "Every Monday and Thursday at 6:30 PM"
  );
  assert.strictEqual(
    habitNotifications.getReminderPreview({
      customDays: [],
      frequency: "Custom",
      reminderTime: "18:30",
    }),
    "No scheduled reminder days"
  );
});

test("notification scheduling builds the expected trigger types", async () => {
  resetNotifications();

  const dailyResult = await habitNotifications.scheduleHabitReminder({
    id: "habit-daily",
    name: "Daily",
    emoji: "✨",
    frequency: "Daily",
    reminderTime: "08:15",
  });

  assert.strictEqual(dailyResult.reminderStatus, "scheduled");
  assert.strictEqual(notificationState.scheduled.length, 1);
  assert.strictEqual(notificationState.scheduled[0].request.trigger.type, "daily");
  assertJsonEqual(notificationState.scheduled[0].request.content, {
    title: "Momentum",
    body: "Time for your Daily habit.",
    data: {
      habitId: "habit-daily",
      reminderKey: "habit-daily:daily-0:8:15",
    },
  });

  resetNotifications();

  const weekdayResult = await habitNotifications.scheduleHabitReminder({
    id: "habit-weekdays",
    name: "Weekdays",
    frequency: "Weekdays",
    reminderTime: "08:15",
  });

  assert.strictEqual(weekdayResult.reminderStatus, "scheduled");
  assert.strictEqual(notificationState.scheduled.length, 5);
  assertJsonEqual(
    notificationState.scheduled.map((item) => item.request.trigger.weekday),
    [2, 3, 4, 5, 6]
  );

  resetNotifications();

  const weekendResult = await habitNotifications.scheduleHabitReminder({
    id: "habit-weekends",
    name: "Weekends",
    frequency: "Weekends",
    reminderTime: "10:15",
  });

  assert.strictEqual(weekendResult.reminderStatus, "scheduled");
  assert.strictEqual(notificationState.scheduled.length, 2);
  assertJsonEqual(
    notificationState.scheduled.map((item) => item.request.trigger.weekday),
    [7, 1]
  );

  resetNotifications();

  const customResult = await habitNotifications.scheduleHabitReminder({
    id: "habit-custom",
    name: "Custom",
    customDays: ["Sun", "Sun", "Bad", "Tue"],
    frequency: "Custom",
    reminderTime: "21:05",
  });

  assert.strictEqual(customResult.reminderStatus, "scheduled");
  assertJsonEqual(
    notificationState.scheduled.map((item) => item.request.trigger.weekday),
    [1, 3]
  );
});

test("notification reconciliation repairs stale status, disabled reminders, and orphans", async () => {
  resetNotifications();

  notificationState.scheduled = [
    { id: "orphan", request: { content: {}, trigger: {} } },
    { id: "kept", request: { content: {}, trigger: {} } },
    { id: "kept", request: { content: {}, trigger: {} } },
  ];

  const disabledResult = await habitNotifications.reconcileNotifications(
    [
      {
        id: "habit-disabled",
        name: "Disabled",
        notificationIds: ["kept"],
        reminderStatus: "scheduled",
        reminderTime: "08:00",
      },
    ],
    { enabled: false }
  );

  assert.strictEqual(disabledResult.changed, true);
  assertJsonEqual(disabledResult.habits[0].notificationIds, []);
  assert.strictEqual(disabledResult.habits[0].reminderStatus, "disabled");
  assertJsonEqual(notificationState.cancelled, ["orphan", "kept"]);

  resetNotifications();

  const repairedResult = await habitNotifications.reconcileNotifications(
    [
      {
        id: "habit-repair",
        name: "Repair",
        frequency: "Weekdays",
        notificationIds: ["old-id"],
        reminderStatus: "scheduled",
        reminderTime: "08:00",
      },
    ],
    { enabled: true }
  );

  assert.strictEqual(repairedResult.changed, true);
  assert.strictEqual(repairedResult.habits[0].notificationIds.length, 5);
  assert.strictEqual(repairedResult.habits[0].reminderStatus, "scheduled");
  assert.strictEqual(notificationState.permissionRequests, 0);
  assertJsonEqual(notificationState.cancelled, ["old-id"]);
});

test("notification validation catches time and frequency changes without rescheduling healthy reminders", () => {
  const healthyHabit = {
    id: "healthy",
    frequency: "Custom",
    customDays: ["Tue", "Thu"],
    notificationIds: ["one", "two"],
    reminderStatus: "scheduled",
    reminderTime: "06:00",
  };

  assertJsonEqual(habitNotifications.validateReminderState(healthyHabit), {
    expectedCount: 2,
    needsRepair: false,
    status: "scheduled",
  });

  assertJsonEqual(
    habitNotifications.validateReminderState({
      ...healthyHabit,
      customDays: ["Tue"],
    }),
    {
      expectedCount: 1,
      needsRepair: true,
      status: "scheduled",
    }
  );

  assertJsonEqual(
    habitNotifications.validateReminderState({
      ...healthyHabit,
      reminderTime: "",
    }),
    {
      expectedCount: 0,
      needsRepair: true,
      status: "none",
    }
  );
});

test("notification scheduling degrades safely", async () => {
  resetNotifications();

  const noTime = await habitNotifications.scheduleHabitReminder({
    id: "habit-none",
    name: "None",
    reminderTime: "",
  });

  assertJsonEqual(noTime, { notificationIds: [], reminderStatus: "none" });
  assert.strictEqual(notificationState.scheduled.length, 0);

  resetNotifications();
  notificationState.permissions = { granted: false, canAskAgain: false };

  const denied = await habitNotifications.scheduleHabitReminder({
    id: "habit-denied",
    name: "Denied",
    reminderTime: "08:00",
  });

  assertJsonEqual(denied, {
    notificationIds: [],
    reminderStatus: "permission-denied",
  });
  assert.strictEqual(notificationState.scheduled.length, 0);

  resetNotifications();
  notificationState.shouldScheduleThrow = true;

  const failed = await habitNotifications.scheduleHabitReminder({
    id: "habit-failed",
    name: "Failed",
    reminderTime: "08:00",
  });

  assertJsonEqual(failed, { notificationIds: [], reminderStatus: "failed" });

  resetNotifications();
  await habitNotifications.cancelHabitReminders({
    notificationIds: ["first", "", null, "second"],
  });
  assertJsonEqual(notificationState.cancelled, ["first", "second"]);
});

test("gamification rebuild is deterministic and scheduled-perfect-day aware", async () => {
  resetStorage();

  const habits = [
    {
      id: "daily",
      completedDates: ["2026-01-03", "2026-01-05"],
      createdAt: "2026-01-01",
      frequency: "Daily",
    },
    {
      id: "weekdays",
      completedDates: ["2026-01-05"],
      createdAt: "2026-01-01",
      frequency: "Weekdays",
    },
    {
      id: "custom",
      completedDates: ["2026-01-05"],
      createdAt: "2026-01-01",
      customDays: ["Mon"],
      frequency: "Custom",
    },
    {
      id: "future",
      completedDates: [],
      createdAt: "2026-01-10",
      frequency: "Daily",
    },
  ];

  const first = await gamificationStorage.rebuildGamificationFromHabits(habits);

  assert.strictEqual(
    first.xp,
    90,
    "4 completions plus 2 scheduled perfect-day bonuses should equal 90 XP"
  );
  assertJsonEqual(first.perfectDayBonusDates, [
    "2026-01-03",
    "2026-01-05",
  ]);
  assert(first.earnedBadges.includes("first-perfect-day"));
  assert(first.pendingMessages.length > 0);

  const second = await gamificationStorage.rebuildGamificationFromHabits(habits);

  assert.strictEqual(second.xp, first.xp);
  assert.strictEqual(
    second.pendingMessages.length,
    0,
    "rebuilding unchanged history should not queue duplicate reward popups"
  );
});

test("pure gamification rebuild does not mutate input and is deterministic", () => {
  const previousState = {
    earnedBadges: ["first-habit-created"],
    pendingMessages: [],
    perfectDayBonusDates: [],
    recentAchievements: [],
    xp: 0,
  };
  const habits = [
    {
      id: "daily",
      completedDates: ["2026-01-01"],
      createdAt: "2026-01-01",
      frequency: "Daily",
    },
  ];
  const originalPreviousState = JSON.stringify(previousState);
  const originalHabits = JSON.stringify(habits);
  const first = gamificationLogic.calculateGamificationState({
    habits,
    now: "2026-01-02T00:00:00.000Z",
    previousState,
  });
  const second = gamificationLogic.calculateGamificationState({
    habits,
    now: "2026-01-02T00:00:00.000Z",
    previousState,
  });

  assert.strictEqual(JSON.stringify(first), JSON.stringify(second));
  assert.strictEqual(JSON.stringify(previousState), originalPreviousState);
  assert.strictEqual(JSON.stringify(habits), originalHabits);
  assert.strictEqual(first.state.xp, 35);
  assert.strictEqual(first.xpChanged, true);
  assert.strictEqual(first.newPerfectDayDates.length, 1);
});

test("gamification state normalization handles legacy and corrupted values", () => {
  const normalized = gamificationLogic.normalizeGamificationState({
    earnedBadges: ["perfect-day", "first-completion", "first-completion", 42],
    pendingMessages: [{ id: "message-1", text: "Keep going" }, "bad"],
    perfectDayBonusDates: ["2026-01-01", "bad", "2026-01-01"],
    recentAchievements: [
      { id: "achievement-1", title: "One" },
      { id: "achievement-1", title: "Duplicate" },
      "bad",
    ],
    xp: -20,
  });

  assertJsonEqual(normalized.earnedBadges, [
    "first-perfect-day",
    "first-completion",
  ]);
  assertJsonEqual(normalized.perfectDayBonusDates, ["2026-01-01"]);
  assert.strictEqual(normalized.pendingMessages.length, 1);
  assert.strictEqual(normalized.recentAchievements.length, 1);
  assert.strictEqual(normalized.xp, 0);
});

test("pure award calculation prevents duplicate badges and preserves reward shape", () => {
  const result = gamificationLogic.calculateAwardState({
    badgesToAdd: ["first-habit-created", "first-habit-created"],
    now: "2026-01-02T00:00:00.000Z",
    previousState: {
      earnedBadges: ["first-habit-created"],
      pendingMessages: [],
      perfectDayBonusDates: [],
      recentAchievements: [],
      xp: 0,
    },
  });

  assertJsonEqual(result.gamification.earnedBadges, ["first-habit-created"]);
  assert.strictEqual(result.badgeUnlocks.length, 0);
  assert.strictEqual(result.achievements.length, 0);
});

test("award messages preserve level and perfect-day presentation metadata", () => {
  const levelResult = gamificationLogic.calculateAwardState({
    messages: ["+10 XP for completing Read."],
    now: "2026-01-02T08:00:00.000Z",
    previousState: {
      earnedBadges: [],
      pendingMessages: [],
      perfectDayBonusDates: [],
      recentAchievements: [],
      xp: 90,
    },
    todayKey: "2026-01-02",
    xpToAdd: 10,
  });
  const perfectDayResult = gamificationLogic.calculateAwardState({
    messages: [
      "+10 XP for completing Read.",
      "Perfect day! +25 bonus XP.",
    ],
    now: "2026-01-03T08:00:00.000Z",
    perfectDayBonusDate: "2026-01-03",
    previousState: {
      earnedBadges: [],
      pendingMessages: [],
      perfectDayBonusDates: [],
      recentAchievements: [],
      xp: 0,
    },
    todayKey: "2026-01-03",
    xpToAdd: 35,
  });

  assert.strictEqual(levelResult.gamification.pendingMessages[1].type, "level");
  assert.strictEqual(levelResult.gamification.pendingMessages[1].level, 2);
  assert.strictEqual(
    perfectDayResult.gamification.pendingMessages[1].type,
    "perfect-day"
  );
});

test("gamification ignores invalid dates and preserves rank thresholds", async () => {
  resetStorage();

  const gamification = await gamificationStorage.rebuildGamificationFromHabits(
    [
      {
        completedDates: ["2026-01-01", "2026-01-01", "2026-99-99"],
        createdAt: "2026-01-01",
        frequency: "Daily",
      },
    ],
    { includeMessage: false }
  );

  assert.strictEqual(
    gamification.xp,
    35,
    "gamification should ignore impossible and duplicate date keys"
  );

  const levelInfo = gamificationStorage.getGamificationLevelInfo({ xp: 3900 });

  assert.strictEqual(levelInfo.level, 40);
  assert.strictEqual(gamificationStorage.getRankForLevel(levelInfo.level), "Master");
});

test("gamification persistence orchestrator loads, calculates, and saves once", async () => {
  resetStorage();
  asyncStorageStore["habit-tracker:gamification"] = JSON.stringify({
    earnedBadges: [],
    pendingMessages: [],
    perfectDayBonusDates: [],
    recentAchievements: [],
    xp: 0,
  });

  const result = await gamificationStorage.rebuildGamificationFromHabits(
    [
      {
        id: "daily",
        completedDates: ["2026-01-01"],
        createdAt: "2026-01-01",
        frequency: "Daily",
      },
    ],
    { includeMessage: false }
  );
  const saved = JSON.parse(asyncStorageStore["habit-tracker:gamification"]);

  assert.strictEqual(result.xp, 35);
  assert.strictEqual(saved.xp, 35);
  assertJsonEqual(Object.keys(saved).sort(), [
    "earnedBadges",
    "pendingMessages",
    "perfectDayBonusDates",
    "recentAchievements",
    "xp",
  ]);

  asyncStorageFailures.get = true;
  const fallback = await gamificationStorage.getGamification();
  assert.strictEqual(fallback.xp, 0);

  asyncStorageFailures.get = false;
  asyncStorageFailures.set = true;
  await assert.rejects(
    () => gamificationStorage.rebuildGamificationFromHabits([], {
      includeMessage: false,
    }),
    /set failed/
  );
});

test("home habit sorting preserves manual order and completed-to-bottom display order", () => {
  const todayKey = habitStats.getTodayKey();
  const habits = [
    { id: "third", order: 3, completedDates: [] },
    { id: "first", order: 1, completedDates: [todayKey] },
    { id: "missing", completedDates: [] },
    { id: "second", order: 2, completedDates: [] },
  ];
  const originalHabits = JSON.stringify(habits);

  assertJsonEqual(
    homeHabitActions.getVisibleHomeHabits(habits, false).map((habit) => habit.id),
    ["first", "second", "third", "missing"]
  );
  assertJsonEqual(
    homeHabitActions.getVisibleHomeHabits(habits, true).map((habit) => habit.id),
    ["second", "third", "missing", "first"]
  );
  assert.strictEqual(JSON.stringify(habits), originalHabits);
});

test("home summary and reward queue helpers handle empty and duplicate data safely", () => {
  const summary = homeHabitActions.getHomeSummary([], { xp: 3900 });

  assert.strictEqual(summary.completedTodayCount, 0);
  assert.strictEqual(summary.completionLabel, "No habits today");
  assert.strictEqual(summary.levelInfo.level, 40);
  assert.strictEqual(summary.statusMessage, "Add your first habit");
  assert.strictEqual(summary.todayCountLabel, "No habits yet");

  const todayKey = habitStats.getTodayKey();
  const scheduledSummary = homeHabitActions.getHomeSummary(
    [
      { id: "done", completedDates: [todayKey], frequency: "Daily" },
      { id: "open", completedDates: [], frequency: "Daily" },
      {
        customDays: [getWeekdayLabel(new Date(Date.now() + 24 * 60 * 60 * 1000))],
        id: "not-today",
        completedDates: [],
        frequency: "Custom",
      },
    ],
    { xp: 120 }
  );

  assert.strictEqual(scheduledSummary.completedTodayCount, 1);
  assert.strictEqual(scheduledSummary.scheduledTodayCount, 2);
  assert.strictEqual(scheduledSummary.remainingTodayCount, 1);
  assert.strictEqual(scheduledSummary.completionLabel, "50%");
  assert.strictEqual(scheduledSummary.statusMessage, "Complete the final habit");
  assert.strictEqual(scheduledSummary.todayCountLabel, "1/2 today");

  const rewards = homeHabitActions.getQueuedRewardsFromMessages(
    [
      { id: "same", text: "Level up! You reached level 5.", type: "level", level: 5 },
      { id: "same", text: "Duplicate", type: "level", level: 5 },
      { id: "badge", type: "badge", badgeId: "first-completion" },
      { id: "badge-2", type: "badge", badgeId: "three-day-streak" },
      { id: "badge-duplicate", type: "badge", badgeId: "first-completion" },
      { id: "message", text: "Nice work.", type: "message" },
    ],
    { xp: 400 },
    {
      showBadgePopups: true,
      showLevelUpPopup: true,
    }
  );

  assert.strictEqual(rewards.levelUp.level, 5);
  assert.strictEqual(rewards.badgeUnlock.id, "first-completion");
  assertJsonEqual(
    rewards.badgeUnlocks.map((badge) => badge.id),
    ["first-completion", "three-day-streak"]
  );
  assert.strictEqual(rewards.celebration, "Nice work.");
});

test("reward presentation order and announcements remain deterministic", () => {
  const rewards = {
    badgeUnlock: {
      description: "Complete any habit for the first time.",
      label: "First Completion",
    },
    celebration: "Progress updated.",
    completionReward: {
      habitName: "Read",
      rankProgress: 35,
      streak: 4,
      xpEarned: 10,
    },
    levelUp: { level: 2, rank: "Bronze" },
    perfectDay: { title: "Perfect Day" },
  };

  assert.strictEqual(
    homeHabitActions.getActiveRewardType(rewards),
    "completion"
  );
  assert.strictEqual(
    homeHabitActions.getActiveRewardType({
      ...rewards,
      completionReward: null,
    }),
    "perfect-day"
  );
  assert.strictEqual(
    homeHabitActions.getActiveRewardType({
      ...rewards,
      completionReward: null,
      perfectDay: null,
    }),
    "level-up"
  );
  assert.strictEqual(
    homeHabitActions.getRewardAccessibilityAnnouncement(
      "badge",
      rewards
    ),
    "Achievement unlocked. First Completion. Complete any habit for the first time."
  );
});

test("rapid completion and undo requests are serialized per habit", async () => {
  resetStorage();

  const todayKey = habitStats.getTodayKey();

  await habitsStorage.saveHabits([
    {
      completedDates: [],
      createdAt: todayKey,
      frequency: "Daily",
      id: "rapid-action",
      name: "Rapid Action",
      order: 0,
    },
  ]);
  await gamificationStorage.rebuildGamificationFromHabits([], {
    includeMessage: false,
  });

  const completionResults = await Promise.all([
    habitCompletionActions.completeHabitTodayWithRewards("rapid-action"),
    habitCompletionActions.completeHabitTodayWithRewards("rapid-action"),
  ]);
  const completedState = await gamificationStorage.getGamification();

  assertJsonEqual(
    completionResults.map((result) => result.changed),
    [true, false]
  );
  assert.strictEqual(completedState.xp, 35);

  const undoResults = await Promise.all([
    habitCompletionActions.undoHabitTodayWithRewards("rapid-action"),
    habitCompletionActions.undoHabitTodayWithRewards("rapid-action"),
  ]);

  assertJsonEqual(
    undoResults.map((result) => result.changed),
    [true, false]
  );
  assert.strictEqual(
    (await habitsStorage.getHabits())[0].completedDates.includes(todayKey),
    false
  );
});

test("concurrent completion writes to different habits do not drop updates", async () => {
  resetStorage();

  const todayKey = habitStats.getTodayKey();

  await habitsStorage.saveHabits([
    {
      completedDates: [],
      createdAt: todayKey,
      frequency: "Daily",
      id: "concurrent-habit-a",
      name: "Concurrent Habit A",
      order: 0,
    },
    {
      completedDates: [],
      createdAt: todayKey,
      frequency: "Daily",
      id: "concurrent-habit-b",
      name: "Concurrent Habit B",
      order: 1,
    },
  ]);

  await Promise.all([
    habitsStorage.completeHabitForToday("concurrent-habit-a"),
    habitsStorage.completeHabitForToday("concurrent-habit-b"),
  ]);

  const habitsAfterCompletion = await habitsStorage.getHabits();
  const habitA = habitsAfterCompletion.find(
    (habit) => habit.id === "concurrent-habit-a"
  );
  const habitB = habitsAfterCompletion.find(
    (habit) => habit.id === "concurrent-habit-b"
  );

  assert.strictEqual(habitA.completedDates.includes(todayKey), true);
  assert.strictEqual(habitB.completedDates.includes(todayKey), true);

  await Promise.all([
    habitsStorage.uncompleteHabitForToday("concurrent-habit-a"),
    habitsStorage.uncompleteHabitForToday("concurrent-habit-b"),
  ]);

  const habitsAfterUndo = await habitsStorage.getHabits();

  assertJsonEqual(
    habitsAfterUndo.map((habit) => habit.completedDates.includes(todayKey)),
    [false, false]
  );
});

test("stored reward messages can only be consumed once during overlapping loads", async () => {
  resetStorage();

  const todayKey = habitStats.getTodayKey();

  await habitsStorage.saveHabits([
    {
      completedDates: [],
      createdAt: todayKey,
      frequency: "Daily",
      id: "reward-consumption",
      name: "Reward Consumption",
      order: 0,
    },
  ]);
  await gamificationStorage.rebuildGamificationFromHabits([], {
    includeMessage: false,
  });
  await habitCompletionActions.completeHabitTodayWithRewards(
    "reward-consumption"
  );

  const consumedMessages = await Promise.all([
    gamificationStorage.consumeGamificationMessages(),
    gamificationStorage.consumeGamificationMessages(),
  ]);

  assert.ok(consumedMessages[0].length > 0);
  assertJsonEqual(consumedMessages[1], []);
  assertJsonEqual(
    (await gamificationStorage.getGamification()).pendingMessages,
    []
  );
});

test("analytics readiness separates building data from meaningful trends", () => {
  const building = analyticsReadiness.getAnalyticsReadiness([
    {
      id: "habit-one",
      completedDates: ["2026-01-01", "2026-01-02"],
    },
  ]);

  assert.strictEqual(building.habitCount, 1);
  assert.strictEqual(building.totalCompletions, 2);
  assert.strictEqual(building.activeDays, 2);
  assert.strictEqual(building.isBuilding, true);
  assert.strictEqual(building.ready, false);
  assert.strictEqual(
    analyticsReadiness.shouldShowFirstTrendUnlock(building, false),
    false
  );

  const ready = analyticsReadiness.getAnalyticsReadiness([
    {
      id: "habit-one",
      completedDates: [
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-04",
      ],
    },
    {
      id: "habit-two",
      completedDates: ["2026-01-02", "2026-01-04", "bad-date"],
    },
  ]);

  assert.strictEqual(ready.totalCompletions, 6);
  assert.strictEqual(ready.activeDays, 4);
  assert.strictEqual(ready.isBuilding, false);
  assert.strictEqual(ready.ready, true);
  assert.strictEqual(ready.progress, 100);
  assert.strictEqual(
    analyticsReadiness.shouldShowFirstTrendUnlock(ready, false),
    true
  );
  assert.strictEqual(
    analyticsReadiness.shouldShowFirstTrendUnlock(ready, true),
    false
  );
});

test("habit analytics readiness handles sparse history and schedules", () => {
  const now = new Date(2026, 0, 10);
  const empty = analyticsReadiness.getHabitAnalyticsReadiness(
    {
      completedDates: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      frequency: "Daily",
    },
    now
  );

  assert.strictEqual(empty.state, "empty");
  assert.strictEqual(empty.totalCompletions, 0);
  assert.strictEqual(
    analyticsReadiness.getHabitAnalyticsGuidance(empty),
    "Complete this habit once to start building insight."
  );

  const building = analyticsReadiness.getHabitAnalyticsReadiness(
    {
      completedDates: [
        "2026-01-05",
        "2026-01-05",
        "2026-01-06",
        "2026-01-12",
      ],
      createdAt: "2026-01-01T00:00:00.000Z",
      customDays: ["Mon"],
      frequency: "Custom",
    },
    now
  );

  assert.strictEqual(building.state, "building");
  assert.strictEqual(building.totalCompletions, 1);
  assert.strictEqual(building.activeDays, 1);
  assert.strictEqual(building.remainingCompletions, 3);
  assert.strictEqual(building.remainingActiveDays, 2);
  assert.match(
    analyticsReadiness.getHabitAnalyticsGuidance(building),
    /3 more completions/
  );

  const ready = analyticsReadiness.getHabitAnalyticsReadiness(
    {
      completedDates: [
        "2026-01-06",
        "2026-01-07",
        "2026-01-08",
        "2026-01-09",
      ],
      createdAt: "2026-01-01T00:00:00.000Z",
      frequency: "Weekdays",
    },
    now
  );

  assert.strictEqual(ready.state, "ready");
  assert.strictEqual(ready.ready, true);
  assert.strictEqual(ready.totalCompletions, 4);
  assert.strictEqual(ready.activeDays, 4);
  assert.match(
    analyticsReadiness.getHabitAnalyticsGuidance(ready),
    /next scheduled day/
  );
});

test("weekly review summarizes schedule-aware current week data", () => {
  const now = new Date(2026, 0, 8);
  const review = weeklyReview.getWeeklyReview(
    [
      {
        completedDates: [
          "2025-12-29",
          "2025-12-30",
          "2026-01-05",
          "2026-01-06",
          "2026-01-07",
          "2026-01-20",
        ],
        createdAt: "2025-12-01T00:00:00.000Z",
        frequency: "Daily",
        id: "daily",
        name: "Daily",
      },
      {
        completedDates: ["2025-12-29", "2026-01-05", "2026-01-05"],
        createdAt: "2025-12-01T00:00:00.000Z",
        frequency: "Weekdays",
        id: "weekday",
        name: "Weekday",
      },
    ],
    now
  );

  assert.strictEqual(review.completedCount, 4);
  assert.strictEqual(review.possibleCount, 8);
  assert.strictEqual(review.completionRate, 50);
  assert.strictEqual(review.activeDays, 3);
  assert.strictEqual(review.bestHabit.name, "Daily");
  assert.strictEqual(review.focusHabit.name, "Weekday");
  assert.strictEqual(review.comparison.available, true);
  assert.strictEqual(review.comparison.delta, 12);
  assert.strictEqual(
    review.comparison.label,
    "Up 12% from the same days last week."
  );
  assertJsonEqual(
    review.breakdown.map((habit) => ({
      name: habit.name,
      status: habit.status,
    })),
    [
      { name: "Weekday", status: "On track" },
      { name: "Daily", status: "One scheduled completion remaining" },
    ]
  );
});

test("weekly review handles sparse schedules without invented comparison", () => {
  const review = weeklyReview.getWeeklyReview(
    [
      {
        completedDates: ["2026-01-05"],
        createdAt: "2026-01-01T00:00:00.000Z",
        customDays: ["Mon"],
        frequency: "Custom",
        id: "custom",
        name: "Custom",
      },
    ],
    new Date(2026, 0, 8)
  );

  assert.strictEqual(review.completedCount, 1);
  assert.strictEqual(review.possibleCount, 1);
  assert.strictEqual(review.completionRate, 100);
  assert.strictEqual(review.comparison.available, false);
  assert.strictEqual(review.context, "1 of 1 scheduled habits completed this week.");
  assert.strictEqual(review.breakdown[0].status, "Complete (last 7 days)");
});

test("habit weekly pattern and next scheduled opportunity are deterministic", () => {
  const todayHabit = {
    completedDates: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    frequency: "Daily",
  };
  const completedTodayHabit = {
    completedDates: ["2026-01-08"],
    createdAt: "2026-01-01T00:00:00.000Z",
    frequency: "Daily",
  };
  const customHabit = {
    completedDates: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    customDays: ["Mon"],
    frequency: "Custom",
  };
  const noCustomDaysHabit = {
    completedDates: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    customDays: [],
    frequency: "Custom",
  };
  const now = new Date(2026, 0, 8);

  assert.strictEqual(
    weeklyReview.getNextScheduledOpportunity(todayHabit, now).label,
    "Scheduled today"
  );
  assert.strictEqual(
    weeklyReview.getNextScheduledOpportunity(completedTodayHabit, now).label,
    "Next scheduled tomorrow"
  );
  assert.strictEqual(
    weeklyReview.getNextScheduledOpportunity(customHabit, now).dateKey,
    "2026-01-12"
  );
  assert.strictEqual(
    weeklyReview.getNextScheduledOpportunity(noCustomDaysHabit, now).label,
    "No scheduled days configured"
  );

  const pattern = weeklyReview.getHabitWeeklyPattern(completedTodayHabit, now);

  assert.strictEqual(pattern.completedCount, 1);
  assert.strictEqual(pattern.possibleCount, 4);
  assert.strictEqual(pattern.completionRate, 25);
  assert.strictEqual(pattern.nextScheduled.label, "Next scheduled tomorrow");
  assert.strictEqual(pattern.status, "On track");
});

test("weekly review breakdown sorts attention, progress, complete, then unscheduled", () => {
  const review = weeklyReview.getWeeklyReview(
    [
      {
        completedDates: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        frequency: "Daily",
        id: "attention",
        name: "Attention",
      },
      {
        completedDates: ["2026-01-05"],
        createdAt: "2026-01-01T00:00:00.000Z",
        frequency: "Daily",
        id: "progress",
        name: "Progress",
      },
      {
        completedDates: ["2026-01-05", "2026-01-06"],
        createdAt: "2026-01-01T00:00:00.000Z",
        customDays: ["Mon", "Tue"],
        frequency: "Custom",
        id: "complete",
        name: "Complete",
      },
      {
        completedDates: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        customDays: ["Sun"],
        frequency: "Custom",
        id: "unscheduled",
        name: "Unscheduled",
      },
    ],
    new Date(2026, 0, 6)
  );

  assertJsonEqual(
    review.breakdown.map((habit) => [habit.name, habit.status]),
    [
      ["Attention", "No completions in the last 7 days"],
      ["Progress", "One scheduled completion remaining"],
      ["Complete", "Complete (last 7 days)"],
      ["Unscheduled", "No scheduled days in the last 7 days"],
    ]
  );
});

test("ROLLING_WEEK_WINDOW gives getWeeklyReview a fixed 7-day window and window-agnostic wording", () => {
  // Tuesday, so the default (calendar-week-to-date) window is only 2 days
  // (Mon+Tue) - deliberately picked to make the rolling window's fixed
  // 7-day span (Dec 31 - Jan 6) visibly different in possibleCount, not
  // just differently worded.
  const now = new Date(2026, 0, 6);
  const habits = [
    {
      completedDates: [
        "2025-12-31",
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-04",
        "2026-01-05",
        "2026-01-06",
      ],
      createdAt: "2025-12-01T00:00:00.000Z",
      frequency: "Daily",
      id: "daily",
      name: "Daily",
    },
  ];

  const rolling = weeklyReview.getWeeklyReview(
    habits,
    now,
    weeklyReview.ROLLING_WEEK_WINDOW
  );

  assert.strictEqual(rolling.possibleCount, 7, "fixed 7-day window regardless of weekday");
  assert.strictEqual(rolling.completedCount, 7);
  assert.strictEqual(rolling.dateRange, "Dec 31, 2025 - Jan 6, 2026");
  assert.strictEqual(rolling.comparison.available, true);
  assert.doesNotMatch(
    rolling.comparison.label,
    /same days last week/,
    "rolling comparison must not claim a weekday alignment it doesn't have"
  );
  assert.match(rolling.comparison.label, /vs last week/);
  assert.strictEqual(rolling.breakdown[0].status, "Complete (last 7 days)");
});

test("ROLLING_WEEK_WINDOW does not change getWeeklyReview's default callers or getHabitWeeklyPattern", () => {
  // Same Tuesday `now` as the rolling-window test above (so the calendar
  // week-to-date window is still just Mon+Jan6), run through every other
  // call path that shares weeklyReview.js's internals, to verify the
  // isolation this thread required: homeHabitActions.js (Home) and
  // useHabitAnalyticsController.js's getHabitWeeklyPattern (per-habit
  // drill-down) must see byte-identical output to before this change.
  const now = new Date(2026, 0, 6);
  const habits = [
    {
      completedDates: [
        "2025-12-31",
        "2026-01-02",
        "2026-01-05",
        "2026-01-06",
      ],
      createdAt: "2025-12-01T00:00:00.000Z",
      frequency: "Daily",
      id: "daily",
      name: "Daily",
    },
  ];

  const defaultReview = weeklyReview.getWeeklyReview(habits, now);

  assert.strictEqual(defaultReview.possibleCount, 2, "unchanged week-to-date window");
  assert.strictEqual(defaultReview.completedCount, 2);
  assert.strictEqual(defaultReview.comparison.available, false);
  assert.strictEqual(
    defaultReview.comparison.label,
    "Comparison needs more scheduled data."
  );

  const pattern = weeklyReview.getHabitWeeklyPattern(habits[0], now);

  assert.strictEqual(pattern.possibleCount, 2, "getHabitWeeklyPattern stays week-to-date");
  assert.strictEqual(pattern.completedCount, 2);
  assert.strictEqual(pattern.status, "Complete (last 7 days)");

  // homeHabitActions.getHomeSummary's `weeklyContext` field is a direct,
  // untransformed pass-through of `getWeeklyReview(safeHabits).context`
  // (see utils/homeHabitActions.js) - getHomeSummary itself has no `now`
  // parameter to inject a synthetic date through, so it can't be asserted
  // here deterministically. `defaultReview` above already proves
  // getWeeklyReview's default (no-options) path is unchanged, and the
  // pre-existing "home summary and reward queue helpers..." test (run as
  // part of this same suite) is the explicit confirmation that Home's own
  // wrapper still passes untouched.
});

test("first trend unlock persistence is safe and backward-compatible", async () => {
  resetStorage();

  assert.strictEqual(await appPreferencesStorage.hasShownFirstTrendUnlock(), false);

  await appPreferencesStorage.setFirstTrendUnlockShown();

  assert.strictEqual(await appPreferencesStorage.hasShownFirstTrendUnlock(), true);

  asyncStorageFailures.get = true;
  assert.strictEqual(await appPreferencesStorage.hasShownFirstTrendUnlock(), false);
  asyncStorageFailures.get = false;
});

test("onboarding and first swipe hint persistence are safe", async () => {
  resetStorage();

  assert.strictEqual(await appPreferencesStorage.hasCompletedOnboarding(), false);
  await appPreferencesStorage.completeOnboarding();
  assert.strictEqual(await appPreferencesStorage.hasCompletedOnboarding(), true);
  await appPreferencesStorage.resetOnboarding();
  assert.strictEqual(await appPreferencesStorage.hasCompletedOnboarding(), false);

  assert.strictEqual(await appPreferencesStorage.hasDismissedFirstSwipeHint(), false);
  await appPreferencesStorage.dismissFirstSwipeHint();
  assert.strictEqual(await appPreferencesStorage.hasDismissedFirstSwipeHint(), true);
  assert.strictEqual(await appPreferencesStorage.getReturnGuidanceDismissedDate(), "");
  await appPreferencesStorage.dismissReturnGuidance("2026-01-05");
  assert.strictEqual(
    await appPreferencesStorage.getReturnGuidanceDismissedDate(),
    "2026-01-05"
  );

  asyncStorageFailures.get = true;
  assert.strictEqual(await appPreferencesStorage.hasCompletedOnboarding(), false);
  assert.strictEqual(await appPreferencesStorage.hasDismissedFirstSwipeHint(), false);
  assert.strictEqual(await appPreferencesStorage.getReturnGuidanceDismissedDate(), "");
  asyncStorageFailures.get = false;
});

test("last shown level and guidance dates recover from malformed storage", async () => {
  resetStorage();

  assert.strictEqual(await appPreferencesStorage.getLastShownLevel(), 1);

  for (const invalidLevel of ["", "0", "-2", "not-a-level"]) {
    asyncStorageStore["momentum:last-shown-level"] = invalidLevel;
    assert.strictEqual(await appPreferencesStorage.getLastShownLevel(), 1);
  }

  asyncStorageStore["momentum:last-shown-level"] = "4.9";
  assert.strictEqual(await appPreferencesStorage.getLastShownLevel(), 4);

  asyncStorageStore["momentum:return-guidance-dismissed-date"] = "2026-02-29";
  assert.strictEqual(
    await appPreferencesStorage.getReturnGuidanceDismissedDate(),
    ""
  );
  asyncStorageStore["momentum:return-guidance-dismissed-date"] = "2028-02-29";
  assert.strictEqual(
    await appPreferencesStorage.getReturnGuidanceDismissedDate(),
    "2028-02-29"
  );
});

test("app preferences reset to defaults while preserving legacy compatibility", async () => {
  resetStorage();
  await appPreferencesStorage.saveAppPreferences({
    ...appPreferencesStorage.defaultAppPreferences,
    enableDailyReminders: false,
    moveCompletedToBottom: true,
    showProgressCard: false,
  });

  assert.strictEqual(
    JSON.parse(asyncStorageStore["momentum:app-preferences"]).showProgressCard,
    false
  );
  assert.strictEqual(asyncStorageStore["momentum:move-completed-to-bottom"], "true");

  const resetPreferences = await appPreferencesStorage.resetAppPreferences();

  assertJsonEqual(resetPreferences, appPreferencesStorage.defaultAppPreferences);
  assert.strictEqual(asyncStorageStore["momentum:move-completed-to-bottom"], "false");
});

test("individual app preferences persist safely and reject unknown keys", async () => {
  resetStorage();

  const updatedPreferences = await appPreferencesStorage.setAppPreference(
    "showProgressCard",
    false
  );

  assert.strictEqual(updatedPreferences.showProgressCard, false);
  assert.strictEqual(updatedPreferences.enableDailyReminders, true);
  assert.strictEqual(
    JSON.parse(asyncStorageStore["momentum:app-preferences"]).showProgressCard,
    false
  );

  await assert.rejects(
    () => appPreferencesStorage.setAppPreference("unknownPreference", true),
    /Unknown app preference/
  );

  asyncStorageStore["momentum:app-preferences"] = "{invalid";
  asyncStorageStore["momentum:move-completed-to-bottom"] = "true";

  const recoveredPreferences = await appPreferencesStorage.getAppPreferences();

  assert.strictEqual(recoveredPreferences.moveCompletedToBottom, true);
  assert.strictEqual(
    recoveredPreferences.showProgressCard,
    appPreferencesStorage.defaultAppPreferences.showProgressCard
  );
});

test("settings presentation keeps labels, reminders, and confirmations clear", () => {
  assert.strictEqual(
    settingsPresentation.getSettingsRowAccessibilityLabel({
      description: "Choose an appearance.",
      title: "Appearance",
      value: "Dark",
    }),
    "Appearance, Dark, Choose an appearance."
  );
  assert.strictEqual(
    settingsPresentation.getNotificationPermissionLabel("blocked"),
    "Blocked"
  );
  assertJsonEqual(settingsPresentation.getReminderSettingsSummary(null), {
    description: "Add a reminder time to a habit to schedule reminders.",
    value: "0",
  });
  assertJsonEqual(
    settingsPresentation.getReminderSettingsSummary([
      {
        frequency: "Daily",
        notificationIds: ["first"],
        reminderStatus: "scheduled",
        reminderTime: "08:00",
      },
      {
        frequency: "Weekdays",
        notificationIds: ["two", "three", "four", "five", "six"],
        reminderStatus: "scheduled",
        reminderTime: "09:00",
      },
    ]),
    {
      description:
        "Every day at 8:00 AM. 2 habit reminders enabled.",
      value: "6",
    }
  );

  const resetCopy = settingsPresentation.getSettingsConfirmation("reset-data");

  assert.match(resetCopy.title, /Reset all data/);
  assert.match(resetCopy.message, /permanently removes/);
  assert.strictEqual(resetCopy.confirmLabel, "Reset");
  assert.strictEqual(
    settingsPresentation.getSettingsConfirmation("unknown"),
    null
  );
});

test("first swipe hint eligibility is action-based and one-time", () => {
  const todayKey = "2026-01-05";
  const freshHabit = {
    completedDates: [],
    createdAt: todayKey,
    frequency: "Daily",
    id: "first",
  };
  const completedHabit = {
    ...freshHabit,
    completedDates: [todayKey],
  };
  const unscheduledHabit = {
    ...freshHabit,
    customDays: ["Tue"],
    frequency: "Custom",
  };

  assert.strictEqual(
    firstUseExperience.getFirstSwipeHintState({
      dismissed: false,
      habits: [freshHabit],
      swipeEnabled: true,
      todayKey,
    }).shouldShow,
    true
  );
  assert.strictEqual(
    firstUseExperience.getFirstSwipeHintState({
      dismissed: true,
      habits: [freshHabit],
      swipeEnabled: true,
      todayKey,
    }).shouldShow,
    false,
    "manual dismissal should suppress future first-swipe hints"
  );
  assert.strictEqual(
    firstUseExperience.getFirstSwipeHintState({
      dismissed: false,
      habits: [completedHabit],
      swipeEnabled: true,
      todayKey,
    }).shouldShow,
    false,
    "first completion should suppress future first-swipe hints"
  );
  assert.strictEqual(
    firstUseExperience.getFirstSwipeHintState({
      dismissed: false,
      habits: [unscheduledHabit],
      swipeEnabled: true,
      todayKey,
    }).shouldShow,
    false,
    "no actionable habits today should hide the first-swipe hint"
  );
  assert.strictEqual(
    firstUseExperience.getFirstSwipeHintState({
      dismissed: false,
      habits: [freshHabit],
      swipeEnabled: false,
      todayKey,
    }).shouldShow,
    false,
    "disabled swipe preference should hide swipe guidance"
  );
});

test("first-use progress copy explains sparse first-week analytics", () => {
  assert.strictEqual(
    firstUseExperience.getFirstWeekProgressMessage({
      habitCount: 0,
      readiness: { state: "empty" },
    }),
    "Create one habit to start building your first week."
  );
  assert.strictEqual(
    firstUseExperience.getFirstWeekProgressMessage({
      habitCount: 1,
      readiness: { isBuilding: true, state: "building" },
    }),
    "Momentum is building your first trend from the habits you complete."
  );
  assert.strictEqual(
    firstUseExperience.getFirstWeekProgressMessage({
      habitCount: 1,
      readiness: { isBuilding: false, state: "ready" },
    }),
    "Your first-week trend is ready."
  );
});

test("first completion reward is not duplicated after recalculation", () => {
  const habit = {
    completedDates: ["2026-01-05"],
    createdAt: "2026-01-05",
    frequency: "Daily",
    id: "first",
  };
  const previousState = {
    earnedBadges: [
      "first-habit-created",
      "first-completion",
      "first-perfect-day",
    ],
    pendingMessages: [],
    perfectDayBonusDates: ["2026-01-05"],
    recentAchievements: [],
    xp: 35,
  };
  const recalculated = gamificationLogic.calculateGamificationState({
    habits: [habit],
    includeMessage: true,
    now: "2026-01-05T12:00:00.000Z",
    previousState,
  });

  assert.strictEqual(recalculated.newBadgeUnlocks.length, 0);
  assert.strictEqual(
    recalculated.state.earnedBadges.filter((id) => id === "first-completion").length,
    1
  );
  assert.strictEqual(
    recalculated.state.pendingMessages.some(
      (message) => message.badgeId === "first-completion"
    ),
    false
  );
});

test("first-day completion state stays restrained and accurate", () => {
  const todayKey = habitStats.getTodayKey();
  const summary = homeHabitActions.getHomeSummary(
    [
      {
        completedDates: [todayKey],
        createdAt: todayKey,
        frequency: "Daily",
        id: "first",
      },
    ],
    { xp: 35 }
  );

  assert.strictEqual(summary.completedTodayCount, 1);
  assert.strictEqual(summary.remainingTodayCount, 0);
  assert.strictEqual(summary.statusMessage, "Today is complete");
  assert.strictEqual(summary.todayXp, 35);
});

test("return guidance distinguishes scheduled and unscheduled inactivity", () => {
  const dailyReturn = returnExperience.getReturnExperienceState({
    habits: [
      {
        completedDates: ["2026-01-06"],
        createdAt: "2026-01-01",
        frequency: "Daily",
        id: "daily",
      },
    ],
    todayKey: "2026-01-08",
  });

  assert.strictEqual(dailyReturn.shouldShow, true);
  assert.strictEqual(dailyReturn.state, "scheduled-return");
  assert.strictEqual(dailyReturn.inactiveCalendarDays, 1);
  assert.strictEqual(dailyReturn.missedScheduledOpportunities, 1);
  assert.strictEqual(dailyReturn.actionableHabitCount, 1);
  assert.strictEqual(dailyReturn.message, "Welcome back. Start with one habit today.");

  const weekdayReturn = returnExperience.getReturnExperienceState({
    habits: [
      {
        completedDates: ["2026-01-02"],
        createdAt: "2026-01-01",
        frequency: "Weekdays",
        id: "weekday",
      },
    ],
    todayKey: "2026-01-05",
  });

  assert.strictEqual(weekdayReturn.shouldShow, true);
  assert.strictEqual(weekdayReturn.state, "unscheduled-return");
  assert.strictEqual(weekdayReturn.missedScheduledOpportunities, 0);
  assert.strictEqual(
    weekdayReturn.message,
    "Welcome back. One habit is available today."
  );
});

test("return guidance suppresses new users, empty habits, dismissed days, and future completions", () => {
  assert.strictEqual(
    returnExperience.getReturnExperienceState({
      habits: [],
      todayKey: "2026-01-08",
    }).shouldShow,
    false
  );
  assert.strictEqual(
    returnExperience.getReturnExperienceState({
      habits: [{ completedDates: [], createdAt: "2026-01-08", frequency: "Daily" }],
      todayKey: "2026-01-08",
    }).shouldShow,
    false
  );
  assert.strictEqual(
    returnExperience.getReturnExperienceState({
      dismissedDate: "2026-01-08",
      habits: [
        {
          completedDates: ["2026-01-05"],
          createdAt: "2026-01-01",
          frequency: "Daily",
        },
      ],
      todayKey: "2026-01-08",
    }).shouldShow,
    false
  );
  assert.strictEqual(
    returnExperience.getReturnExperienceState({
      habits: [
        {
          completedDates: ["2026-01-09", "bad"],
          createdAt: "2026-01-01",
          frequency: "Daily",
        },
      ],
      todayKey: "2026-01-08",
    }).shouldShow,
    false,
    "future and invalid completions should not create return guidance"
  );
});

test("return guidance reports next scheduled day without counting future opportunities as missed", () => {
  const state = returnExperience.getReturnExperienceState({
    habits: [
      {
        completedDates: ["2026-01-05"],
        createdAt: "2026-01-01",
        customDays: ["Thu"],
        frequency: "Custom",
      },
    ],
    todayKey: "2026-01-07",
  });

  assert.strictEqual(state.shouldShow, true);
  assert.strictEqual(state.missedScheduledOpportunities, 0);
  assert.strictEqual(state.actionableHabitCount, 0);
  assert.strictEqual(state.nextScheduledOpportunity.dateKey, "2026-01-08");
  assert.strictEqual(
    state.message,
    "Welcome back. Your next scheduled habit is tomorrow."
  );
});

test("habit recovery context preserves best streak while current streak resets", () => {
  const habit = {
    completedDates: ["2026-01-01", "2026-01-02", "2026-01-03"],
    createdAt: "2026-01-01",
    frequency: "Daily",
  };
  const context = returnExperience.getHabitRecoveryContext(habit, "2026-01-08");

  assert.strictEqual(habitStats.getCurrentStreak(habit.completedDates, habit), 0);
  assert.strictEqual(habitStats.getBestStreak(habit.completedDates, habit), 3);
  assert.strictEqual(context.lastCompletedDateKey, "2026-01-03");
  assert.strictEqual(context.nextScheduledOpportunity.dateKey, "2026-01-08");
});

test("inactivity recalculation preserves existing XP, rank, and earned achievements", () => {
  const previousState = {
    earnedBadges: [
      "first-habit-created",
      "first-completion",
      "first-perfect-day",
    ],
    pendingMessages: [],
    perfectDayBonusDates: ["2026-01-01"],
    recentAchievements: [],
    xp: 35,
  };
  const result = gamificationLogic.calculateGamificationState({
    habits: [
      {
        completedDates: ["2026-01-01"],
        createdAt: "2026-01-01",
        frequency: "Daily",
      },
    ],
    includeMessage: true,
    now: "2026-01-08T12:00:00.000Z",
    previousState,
  });

  assert.strictEqual(result.state.xp, previousState.xp);
  assert(result.state.earnedBadges.includes("first-habit-created"));
  assert(result.state.earnedBadges.includes("first-completion"));
  assert.strictEqual(gamificationLogic.getRankForLevel(1), "Bronze");
});

test("rank milestone helper finds the nearest rank target", () => {
  assertJsonEqual(
    progressionMilestones.getNextRankMilestone(
      { currentLevelXp: 50, level: 4 },
      gamificationLogic.rankMilestones
    ),
    {
      label: "Silver",
      level: 5,
      text: "50 XP to Silver",
      type: "rank",
      xpRemaining: 50,
    }
  );
  assertJsonEqual(
    progressionMilestones.getNextRankMilestone(
      { currentLevelXp: 0, level: 40 },
      gamificationLogic.rankMilestones
    ),
    {
      label: "Master",
      level: 40,
      text: "Maximum rank reached",
      type: "complete",
      xpRemaining: 0,
    }
  );
});

test("visible rank display shows Diamond now that it has medal art", () => {
  assert.strictEqual(gamificationLogic.getRankForLevel(25), "Diamond");
  assert.strictEqual(rankDisplay.getVisibleRank("Diamond"), "Diamond");
  assertJsonEqual(rankDisplay.ACTIVE_RANK_LABELS, [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Master",
  ]);
  assertJsonEqual(
    rankDisplay
      .getVisibleRankMilestones(gamificationLogic.rankMilestones)
      .map((rankItem) => rankItem.label),
    ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"]
  );
  assert.strictEqual(
    progressionMilestones.getNextRankMilestone(
      { currentLevelXp: 0, level: 25 },
      gamificationLogic.rankMilestones
    ).label,
    "Master"
  );
});

test("appearance preferences support Light, Dark, and System with safe legacy migration", () => {
  assertJsonEqual(
    themePreferences.appearanceOptions.map((option) => option.value),
    ["light", "dark", "system"]
  );
  assertJsonEqual(Object.keys(appColors.themes).sort(), ["dark", "light"]);
  assert.strictEqual(themePreferences.isSupportedThemePreference("light"), true);
  assert.strictEqual(themePreferences.isSupportedThemePreference("dark"), true);
  assert.strictEqual(themePreferences.isSupportedThemePreference("system"), true);
  assert.strictEqual(themePreferences.normalizeThemePreference(null), "light");
  assert.strictEqual(themePreferences.normalizeThemePreference(""), "light");
  assert.strictEqual(themePreferences.normalizeThemePreference("system", "light"), "light");
  assert.strictEqual(themePreferences.normalizeThemePreference("system", "dark"), "dark");
  assert.strictEqual(themePreferences.normalizeThemePreference("bronze"), "light");
  assert.strictEqual(themePreferences.normalizeThemePreference("silver"), "dark");
  assert.strictEqual(themePreferences.normalizeThemePreference("gold"), "dark");
  assert.strictEqual(themePreferences.normalizeThemePreference("platinum"), "dark");
  assert.strictEqual(themePreferences.normalizeThemePreference("diamond"), "dark");
  assert.strictEqual(themePreferences.normalizeThemePreference("master"), "dark");
  assert.strictEqual(themePreferences.normalizeThemePreference("unknown"), "dark");
});

test("habit order normalization repairs missing, duplicate, and explicit order values", () => {
  const normalized = habitsStorage.normalizeHabitOrder([
    { id: "third", name: "Third", order: 9, completedDates: [] },
    { id: "first", name: "First", order: 1, completedDates: [] },
    { id: "duplicate", name: "Duplicate", order: 1, completedDates: [] },
    { id: "missing", name: "Missing", completedDates: [] },
  ]);

  assertJsonEqual(
    normalized.map((habit) => habit.id),
    ["duplicate", "first", "missing", "third"]
  );
  assertJsonEqual(
    normalized.map((habit) => habit.order),
    [0, 1, 2, 3]
  );

  const explicit = habitsStorage.normalizeHabitOrder(normalized, [
    "missing",
    "missing",
    "unknown",
    "first",
  ]);

  assertJsonEqual(
    explicit.map((habit) => habit.id),
    ["missing", "first", "duplicate", "third"]
  );
  assertJsonEqual(
    explicit.map((habit) => habit.order),
    [0, 1, 2, 3]
  );

  assert.strictEqual(
    habitsStorage.normalizeHabit({ name: "   " }).name,
    "Untitled habit",
    "blank imported or corrupted habit names should get a readable fallback"
  );
  assert.strictEqual(
    habitsStorage.normalizeHabit({ name: "  Read  " }).name,
    "Read",
    "habit names should be trimmed during normalization"
  );
});

test("built-in habit templates and routines use stable unique identifiers", () => {
  const templateIds = habitTemplates.builtInHabitTemplates.map(
    (template) => template.id
  );
  const routineIds = habitTemplates.builtInRoutines.map((routine) => routine.id);

  assert.strictEqual(templateIds.length, new Set(templateIds).size);
  assert.strictEqual(routineIds.length, new Set(routineIds).size);
  assert.ok(templateIds.includes("morning-drink-water"));
  assert.ok(routineIds.includes("routine-morning-reset"));
  assert.ok(
    habitTemplates.builtInHabitTemplates.every(
      (template) =>
        !("completedDates" in template) &&
        !("createdAt" in template) &&
        !("xp" in template)
    )
  );
});

test("habit templates convert to safe editable habit drafts", () => {
  const template = habitTemplates.getTemplateById("personal-call-family");
  const draft = habitTemplates.createHabitDraftFromTemplate(template);

  assert.strictEqual(draft.name, "Call family");
  assert.strictEqual(draft.frequency, "Custom");
  assertJsonEqual(draft.customDays, ["Sun"]);
  assert.notStrictEqual(draft.customDays, template.customDays);
  assert.strictEqual(draft.reminderTime, "");
  assert.strictEqual("completedDates" in draft, false);

  draft.customDays.push("Mon");
  assertJsonEqual(template.customDays, ["Sun"]);
});

test("template duplicate detection normalizes names and schedules without blocking", () => {
  const duplicate = habitTemplates.findDuplicateHabitDraft(
    {
      customDays: ["Fri", "Mon"],
      frequency: "Custom",
      name: "  READ   NOTES ",
    },
    [
      {
        customDays: ["Mon", "Fri"],
        frequency: "Custom",
        name: "read notes",
      },
      {
        customDays: [],
        frequency: "Daily",
        name: "Read notes",
      },
    ]
  );

  assert.strictEqual(duplicate.name, "read notes");
  assert.strictEqual(
    habitTemplates.normalizeDuplicateName("  Read   Notes "),
    "read notes"
  );
  assert.strictEqual(
    habitTemplates.findDuplicateHabitDraft(
      { customDays: [], frequency: "Weekdays", name: "Read notes" },
      [{ customDays: [], frequency: "Daily", name: "Read notes" }]
    ),
    null
  );
});

test("routine drafts preserve selected templates and create independent habits", async () => {
  resetStorage();
  const drafts = habitTemplates.createRoutineHabitsFromSelection({
    selectedTemplateIds: [
      "morning-drink-water",
      "morning-drink-water",
      "morning-make-bed",
    ],
  });

  assert.strictEqual(drafts.length, 2);
  assertJsonEqual(
    drafts.map((draft) => draft.name),
    ["Drink water", "Make the bed"]
  );

  const createdHabits = await habitsStorage.addHabitsFromDrafts(drafts);
  const storedHabits = await habitsStorage.getHabits();

  assert.strictEqual(createdHabits.length, 2);
  assert.strictEqual(new Set(createdHabits.map((habit) => habit.id)).size, 2);
  assertJsonEqual(
    storedHabits.map((habit) => habit.name),
    ["Drink water", "Make the bed"]
  );
  assert.ok(storedHabits.every((habit) => habit.completedDates.length === 0));
  assertJsonEqual(
    storedHabits.map((habit) => habit.order),
    [0, 1]
  );
});

test("habit reorder persistence saves normalized order values", async () => {
  resetStorage();
  asyncStorageStore["habit-tracker:habits"] = JSON.stringify([
    { id: "one", name: "One", order: 0, completedDates: [] },
    { id: "two", name: "Two", order: 0, completedDates: [] },
    { id: "three", name: "Three", completedDates: [] },
  ]);

  const reordered = await habitsStorage.saveHabitOrder(["three", "one"]);

  assertJsonEqual(
    reordered.map((habit) => habit.id),
    ["three", "one", "two"]
  );
  assertJsonEqual(
    JSON.parse(asyncStorageStore["habit-tracker:habits"]).map(
      (habit) => habit.order
    ),
    [0, 1, 2]
  );

  const movedFirstToLast = await habitsStorage.saveHabitOrder([
    "two",
    "three",
    "one",
  ]);

  assertJsonEqual(
    movedFirstToLast.map((habit) => habit.id),
    ["two", "three", "one"]
  );

  const movedLastToFirst = await habitsStorage.saveHabitOrder([
    "one",
    "unknown",
    "three",
    "deleted",
    "two",
  ]);

  assertJsonEqual(
    movedLastToFirst.map((habit) => habit.id),
    ["one", "three", "two"]
  );
  assertJsonEqual(
    movedLastToFirst.map((habit) => habit.order),
    [0, 1, 2]
  );
});

test("badges sort by tier progression in stable ascending and descending order", () => {
  const sample = [
    gamificationLogic.getBadgeById("unlock-master"),
    gamificationLogic.getBadgeById("first-completion"),
    gamificationLogic.getBadgeById("unlock-gold"),
    gamificationLogic.getBadgeById("three-day-streak"),
    gamificationLogic.getBadgeById("unlock-diamond"),
  ];
  const ascending = gamificationLogic.sortBadgesByTier(sample, "asc");
  const descending = gamificationLogic.sortBadgesByTier(sample, "desc");

  assertJsonEqual(
    ascending.map((badge) => badge.tier),
    ["Bronze", "Bronze", "Gold", "Diamond", "Master"]
  );
  assertJsonEqual(
    ascending.map((badge) => badge.id),
    [
      "first-completion",
      "three-day-streak",
      "unlock-gold",
      "unlock-diamond",
      "unlock-master",
    ]
  );
  assertJsonEqual(
    descending.map((badge) => badge.tier),
    ["Master", "Diamond", "Gold", "Bronze", "Bronze"]
  );
  assertJsonEqual(
    descending.slice(-2).map((badge) => badge.id),
    ["first-completion", "three-day-streak"]
  );
});

test("visual asset manifest covers brand identifiers", () => {
  assert(appAssets.BRAND_ASSETS.logoDark.endsWith("momentum-logo-dark.png"));
  assert(appAssets.BRAND_ASSETS.logoLight.endsWith("momentum-logo-light.png"));
  assert(
    appAssets
      .getBrandLogoAsset("light")
      .endsWith("momentum-logo-light.png"),
    "Light mode should use the black runtime logo"
  );
  assert(
    appAssets
      .getBrandLogoAsset("dark")
      .endsWith("momentum-logo-dark.png"),
    "Dark mode should use the white runtime logo"
  );
  assert(
    appAssets
      .getBrandLogoAsset(
        themePreferences.normalizeThemePreference("system", "light")
      )
      .endsWith("momentum-logo-light.png"),
    "A system preference resolved to Light should use the black logo"
  );
  assert(
    appAssets
      .getBrandLogoAsset(
        themePreferences.normalizeThemePreference("system", "dark")
      )
      .endsWith("momentum-logo-dark.png"),
    "A system preference resolved to Dark should use the white logo"
  );
  assert(
    appAssets
      .getBrandLogoAsset("unknown")
      .endsWith("momentum-logo-dark.png"),
    "Unknown resolved themes should use the existing dark fallback"
  );
  assert.strictEqual(
    gamificationLogic.rankMilestones[gamificationLogic.rankMilestones.length - 1].label,
    "Master",
    "Master should remain the final rank threshold"
  );
  assertJsonEqual(
    gamificationLogic.rankMilestones.map((rankItem) => rankItem.unlockLevel),
    [1, 5, 10, 15, 25, 40],
    "existing rank thresholds should not change"
  );

  // Phase 9: rank medals converted from assets/ranks/*.png to code-drawn
  // react-native-svg (components/rank/RankMedalFrame.js), the same move
  // Phase 8 made for achievement badges - no raster asset lookup should
  // exist for either.
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(appAssets, "RANK_BADGE_ASSETS"),
    false,
    "rank medals are code-drawn (RankMedalFrame.js) as of Phase 9 - no raster asset map should exist"
  );
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(appAssets, "getRankBadgeAsset"),
    false,
    "rank medals are code-drawn (RankMedalFrame.js) as of Phase 9 - no raster asset lookup should exist"
  );
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(appAssets, "SUPPLIED_RANK_ASSET_ORDER"),
    false,
    "rank medals are code-drawn (RankMedalFrame.js) as of Phase 9 - no supplied-asset order list should exist"
  );
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(appAssets, "getAchievementBadgeAsset"),
    false,
    "achievement badges are code-drawn (BadgeFrame.js) as of Phase 8 - no raster asset lookup should exist"
  );
});

test("every badge group has a dedicated glyph mark", () => {
  // Phase 8: per-badge icon lookup (ACHIEVEMENT_ICON_MAP, keyed by badge
  // id) was replaced by BadgeGroupGlyph.js, keyed by badge.group directly
  // - group is already a field on every badge object (utils/gamification.js's
  // createBadge), so there's no separate id-to-icon table left to test.
  // What still matters: every group a badge actually uses has a glyph, and
  // the group list hasn't silently drifted from the badge data.
  assert.strictEqual(achievementConstants.ACHIEVEMENT_GROUPS.length, 6);

  const usedGroups = new Set(gamificationLogic.badges.map((badge) => badge.group));

  usedGroups.forEach((group) => {
    assert(
      achievementConstants.ACHIEVEMENT_GROUPS.includes(group),
      `badge group "${group}" is missing from ACHIEVEMENT_GROUPS - BadgeGroupGlyph has no mark for it`
    );
  });

  assert.strictEqual(
    achievementConstants.ACHIEVEMENT_GROUPS.length,
    usedGroups.size,
    "ACHIEVEMENT_GROUPS should not carry groups no badge actually uses"
  );

  assert.strictEqual(typeof achievementConstants.getRecentAchievementIconName("badge"), "string");
});

test("achievement progress clamps values and handles locked, unlocked, and unknown badges", () => {
  assertJsonEqual(
    achievementProgress.createProgress(140, 100),
    {
      complete: true,
      max: 100,
      measurable: true,
      percent: 100,
      remaining: 0,
      value: 100,
    }
  );
  assertJsonEqual(
    achievementProgress.createProgress(5, 0),
    {
      complete: false,
      max: 0,
      measurable: false,
      percent: 0,
      remaining: null,
      value: 0,
    }
  );

  const locked = achievementProgress.getAchievementProgress(
    { id: "three-day-streak" },
    { longestStreak: 2 },
    false
  );
  const unlocked = achievementProgress.getAchievementProgress(
    { id: "three-day-streak" },
    { longestStreak: 2 },
    true
  );
  const unknown = achievementProgress.getAchievementProgress(
    { id: "future-badge" },
    {},
    false
  );

  assert.strictEqual(locked.value, 2);
  assert.strictEqual(locked.max, 3);
  assert.strictEqual(locked.complete, false);
  assert.strictEqual(unlocked.value, 3);
  assert.strictEqual(unlocked.complete, true);
  assert.strictEqual(achievementProgress.getAchievementProgressLabel(unlocked), "Unlocked");
  assert.strictEqual(unknown.measurable, false);
  assert.strictEqual(achievementProgress.getAchievementProgressLabel(unknown), "Locked");
});

test("closest achievement selection is deterministic and excludes unlocked badges", () => {
  const sampleBadges = [
    { id: "three-day-streak", label: "Three" },
    { id: "seven-day-streak", label: "Seven" },
    { id: "ten-total-completions", label: "Ten" },
    { id: "first-habit-created", label: "First" },
  ];
  const closest = achievementProgress.getClosestAchievements({
    badges: sampleBadges,
    earnedBadgeIds: new Set(["first-habit-created", "ten-total-completions"]),
    limit: 2,
    snapshot: {
      completionCount: 9,
      hasHabit: 1,
      longestStreak: 2,
    },
  });

  assertJsonEqual(
    closest.map((item) => item.badge.id),
    ["three-day-streak", "seven-day-streak"],
    "closest badges should tie-break by input order after progress and remaining"
  );
  assert.strictEqual(
    closest.some((item) => item.badge.id === "ten-total-completions"),
    false,
    "earned badges should be excluded from closest locked achievements"
  );
});

test("achievement snapshot safely derives progress from habit history", () => {
  const snapshot = achievementProgress.getAchievementSnapshot({
    gamification: { perfectDayBonusDates: ["2026-01-03"] },
    habits: [
      {
        completedDates: ["2026-01-01", "2026-01-01", "bad"],
        frequency: "Daily",
      },
      {
        completedDates: ["2026-01-01", "2026-01-02"],
        frequency: "Daily",
      },
    ],
    level: 6,
  });

  assert.strictEqual(snapshot.completionCount, 3);
  assert.strictEqual(snapshot.hasCompletion, 1);
  assert.strictEqual(snapshot.hasHabit, 1);
  assert.strictEqual(snapshot.highestDailyCompletionCount, 2);
  assert.strictEqual(snapshot.level, 6);
  assert.strictEqual(snapshot.perfectDays, 1);
});

test("personal records ignore duplicate, invalid, and future completion dates", () => {
  const now = new Date(2026, 0, 15);
  const habits = [
    {
      id: "daily",
      name: "Daily",
      completedDates: [
        "2026-01-01",
        "2026-01-02",
        "2026-01-02",
        "bad",
        "2026-01-20",
      ],
      createdAt: "2026-01-01",
      frequency: "Daily",
    },
    {
      id: "weekdays",
      name: "Weekdays",
      completedDates: ["2026-01-01", "2026-01-02", "2026-01-05"],
      createdAt: "2026-01-01",
      frequency: "Weekdays",
    },
  ];
  const lifetime = personalRecords.getLifetimeStats(habits, { xp: 55 }, now);
  const records = personalRecords.getPersonalRecords(habits, { xp: 55 }, now);
  const byId = Object.fromEntries(records.map((record) => [record.id, record]));

  assert.strictEqual(lifetime.totalCompletions, 5);
  assert.strictEqual(lifetime.totalXpEarned, 55);
  assert.strictEqual(lifetime.totalPerfectDays, 2);
  assert.strictEqual(byId["longest-overall-streak"].rawValue, 3);
  assert.strictEqual(byId["most-completions-day"].rawValue, 2);
  assert.strictEqual(byId["most-completions-day"].achievedAt, "2026-01-01");
  assert.strictEqual(byId["perfect-day-run"].rawValue, 2);
  assert.strictEqual(byId["highest-xp-day"].rawValue, 45);
  assert.strictEqual(byId["most-completed-habit"].rawValue, 3);
});

test("personal records expose deterministic monthly, quarterly, and yearly aggregates", () => {
  const now = new Date(2026, 1, 10);
  const habits = [
    {
      id: "habit",
      name: "Habit",
      completedDates: ["2026-01-01", "2026-01-02", "2026-02-02"],
      createdAt: "2026-01-01",
      frequency: "Daily",
    },
  ];
  const months = personalRecords.getMonthlyAggregates(habits, now);
  const quarters = personalRecords.getQuarterlyAggregates(habits, now);
  const years = personalRecords.getYearlyAggregates(habits, now);
  const review = personalRecords.getMonthlyReview(habits, null, now);

  assert.strictEqual(months.find((month) => month.key === "2026-01").completedCount, 2);
  assert.strictEqual(months.find((month) => month.key === "2026-02").completedCount, 1);
  assert.strictEqual(quarters[0].key, "2026-Q1");
  assert.strictEqual(quarters[0].completedCount, 3);
  assert.strictEqual(years[0].key, "2026");
  assert.strictEqual(years[0].completedCount, 3);
  assert.strictEqual(review.label, "February 2026");
  assert.strictEqual(review.totalCompletions, 1);
});

test("habit milestones are informational and based on actual completions", () => {
  const completions = Array.from({ length: 26 }, (_, index) => {
    const date = new Date(2026, 0, index + 1);

    return habitStats.toDateKey(date);
  });
  const milestones = personalRecords.getHabitMilestones(
    {
      completedDates: [...completions, completions[0], "bad", "2099-01-01"],
      createdAt: "2026-01-01",
      frequency: "Daily",
    },
    new Date(2026, 1, 1)
  );

  assert.strictEqual(milestones.completionCount, 26);
  assertJsonEqual(milestones.completedMilestones, [10, 25]);
  assert.strictEqual(milestones.nextMilestone, 50);
  assert.strictEqual(milestones.progressToNext, 52);
});

test("insights consistency is schedule-aware and local-date safe", () => {
  const habits = [
    {
      id: "weekday",
      name: "Weekday",
      completedDates: ["2026-07-13", "2026-07-14"],
      createdAt: "2026-07-13",
      frequency: "Weekdays",
    },
    {
      id: "custom",
      name: "Custom",
      completedDates: ["2026-07-13"],
      createdAt: "2026-07-13",
      customDays: ["Mon"],
      frequency: "Custom",
    },
  ];
  const score = insightsDashboard.getConsistencyScore(habits, {
    endDate: new Date(2026, 6, 19),
    startDate: new Date(2026, 6, 13),
  });

  assert.strictEqual(score.completedCount, 3);
  assert.strictEqual(score.possibleCount, 6);
  assert.strictEqual(score.rate, 50);
});

test("insights trends ignore small changes and require enough history", () => {
  const improvingHabit = {
    id: "improving",
    name: "Improving",
    completedDates: [
      "2026-06-30",
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ],
    createdAt: "2026-06-30",
    frequency: "Daily",
  };
  const stableHabit = {
    id: "stable",
    name: "Stable",
    completedDates: [
      "2026-06-30",
      "2026-07-01",
      "2026-07-06",
      "2026-07-07",
    ],
    createdAt: "2026-06-30",
    frequency: "Daily",
  };
  const sparseHabit = {
    id: "sparse",
    name: "Sparse",
    completedDates: ["2026-07-12"],
    createdAt: "2026-07-12",
    frequency: "Daily",
  };

  assert.strictEqual(
    insightsDashboard.getTrendComparison([improvingHabit], {
      currentDays: 7,
      now: new Date(2026, 6, 12),
      previousDays: 7,
    }).direction,
    "improving"
  );
  assert.strictEqual(
    insightsDashboard.getTrendComparison([stableHabit], {
      currentDays: 7,
      now: new Date(2026, 6, 12),
      previousDays: 7,
    }).direction,
    "stable"
  );
  assert.strictEqual(
    insightsDashboard.getTrendComparison([sparseHabit], {
      currentDays: 7,
      now: new Date(2026, 6, 12),
      previousDays: 7,
    }).available,
    false
  );
});

test("insights habit rankings are deterministic and explainable", () => {
  const habits = [
    {
      id: "b",
      name: "Beta",
      completedDates: ["2026-07-06", "2026-07-07", "2026-07-08"],
      createdAt: "2026-07-06",
      frequency: "Daily",
    },
    {
      id: "a",
      name: "Alpha",
      completedDates: [
        "2026-07-06",
        "2026-07-07",
        "2026-07-08",
        "2026-07-09",
        "2026-07-10",
      ],
      createdAt: "2026-07-06",
      frequency: "Daily",
    },
  ];
  const rankings = insightsDashboard.getHabitRankings(
    habits,
    new Date(2026, 6, 10)
  );

  assert.strictEqual(rankings.strongest[0].name, "Alpha");
  assert.strictEqual(rankings.needsAttention[0].name, "Beta");
  assert.strictEqual(rankings.all[0].hasSufficientData, true);
});

test("analytics presentation summaries expose chart and metric context", () => {
  const summary = analyticsPresentation.getTrendAccessibilitySummary(
    [
      { label: "Week 1", percentage: 25 },
      { label: "Week 2", percentage: 78.4 },
    ],
    "Month"
  );

  assert.ok(summary.includes("25 percent to 78 percent"));
  assert.ok(summary.includes("Latest: Week 2 at 78 percent"));
  assert.ok(summary.includes("Recent points: Week 1 25 percent"));
  assert.strictEqual(
    analyticsPresentation.getMetricAccessibilityLabel(
      "Completion",
      "78%",
      "Improving"
    ),
    "Completion: 78%. Improving"
  );
  assert.strictEqual(
    analyticsPresentation.getHabitPerformanceAccessibilityLabel(
      {
        completionRate: 82,
        currentStreak: 6,
        habit: { name: "Read" },
      },
      "Stable"
    ),
    "Open analytics for Read. 82 percent completion. 6 day streak. Stable."
  );
});

test("insights weekly and monthly comparisons respect period boundaries", () => {
  const habits = [
    {
      id: "habit",
      name: "Habit",
      completedDates: [
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-07-01",
        "2026-07-02",
        "2026-07-03",
        "2026-07-06",
        "2026-07-07",
      ],
      createdAt: "2026-06-01",
      frequency: "Daily",
    },
  ];
  const weekly = insightsDashboard.getWeeklyComparison(
    habits,
    new Date(2026, 6, 8)
  );
  const monthly = insightsDashboard.getMonthlyComparison(
    habits,
    new Date(2026, 6, 8)
  );

  assert.strictEqual(weekly.current.possibleCount, 3);
  assert.strictEqual(weekly.previous.possibleCount, 3);
  assert.strictEqual(monthly.current.possibleCount, 8);
  assert.strictEqual(monthly.previous.possibleCount, 8);
});

test("insights dashboard handles empty, imported, deleted, and leap-year data", () => {
  const emptyDashboard = insightsDashboard.getInsightsDashboard(
    [],
    null,
    new Date(2026, 6, 10)
  );
  const dashboard = insightsDashboard.getInsightsDashboard(
    [
      {
        id: "leap",
        name: "Leap",
        completedDates: [
          "2024-02-28",
          "2024-02-29",
          "bad",
          "2024-02-29",
          "2099-01-01",
        ],
        createdAt: "2024-02-28",
        frequency: "Daily",
      },
      null,
    ],
    { xp: 20 },
    new Date(2024, 1, 29)
  );

  assertJsonEqual(emptyDashboard.dashboardSections, ["overview", "empty-state"]);
  assert.strictEqual(dashboard.consistency.overall.completedCount, 2);
  assert.strictEqual(dashboard.consistency.overall.possibleCount, 2);
  assert.strictEqual(dashboard.readiness.state, "building");
  assert.ok(dashboard.insightCards.length > 0);
});

test("analytics remain deterministic with hundreds of habits and years of history", () => {
  const completionDates = Array.from({ length: 20 }, (_, index) => {
    const date = new Date();

    date.setDate(date.getDate() - index * 55);

    return habitStats.toDateKey(date);
  }).sort();
  const createdAt = completionDates[0];
  const habits = Array.from({ length: 100 }, (_, index) => ({
    completedDates: completionDates,
    createdAt,
    frequency: "Daily",
    id: `stress-habit-${index}`,
    name: `Stress Habit ${index}`,
    order: index,
  }));
  const analytics = habitStats.getDeepAnalytics(habits, "year", {
    xp: 50000,
  });
  const dashboard = insightsDashboard.getInsightsDashboard(habits, {
    xp: 50000,
  });

  assert.strictEqual(analytics.habitPerformance.length, 100);
  assert.strictEqual(
    dashboard.totals.totalCompletions,
    habits.length * completionDates.length
  );
  assert.ok(Number.isFinite(analytics.completionRate));
  assert.ok(Number.isFinite(dashboard.consistency.overall.rate));
});

test("month activity summary falls back to first completion when createdAt is missing", () => {
  // Regression guard for the getHabitActivityProfiles/getHabitCompletionCaches
  // split in activityHistory.js's getMonthActivitySummary: a habit with no
  // resolvable createdAt should still only count days on/after its first
  // completion, and getMonthActivitySummary's month-summary path (which
  // defaults an unresolvable start date to "today") should agree with the
  // day-by-day path (which drops the habit entirely before its start) about
  // when the habit was actually active.
  const noCreatedAt = {
    completedDates: ["2026-07-10", "2026-07-11", "2026-07-12"],
    frequency: "Daily",
    id: "no-created-at",
    name: "No createdAt",
  };
  const summary = activityHistory.getMonthActivitySummary(
    [noCreatedAt],
    new Date(2026, 6, 1),
    new Date(2026, 6, 15)
  );

  assert.strictEqual(summary.completedCount, 3, "all three completions count");
  assert.strictEqual(
    summary.possibleCount,
    6,
    "only Jul 10-15 (first completion through the Jul-15 'now' cutoff) are possible, not the whole month"
  );
  assert.strictEqual(summary.completionRate, 50);

  const neverCompleted = {
    completedDates: [],
    frequency: "Daily",
    id: "never",
    name: "Never completed, no createdAt",
  };
  const emptySummary = activityHistory.getMonthActivitySummary(
    [neverCompleted],
    new Date(2026, 6, 1),
    new Date(2026, 6, 15)
  );

  assert.strictEqual(
    emptySummary.possibleCount,
    0,
    "a habit with neither createdAt nor any completion contributes no possible days"
  );
});

test("insights consistency excludes days before a habit's first completion when createdAt is missing", () => {
  // Regression guard for insightsDashboard.js's getHabitConsistencyCaches:
  // the cached earliest-completion-date lookup must still be filtered
  // per-day the same way the original uncached getCompletedDateKeys(habit,
  // dateKey)[0] was - a query window that starts before a habit's first
  // completion should not count those early days as possible.
  const lateStarter = {
    completedDates: ["2026-07-10", "2026-07-11", "2026-07-12"],
    frequency: "Daily",
    id: "late-starter",
    name: "Late starter, no createdAt",
  };
  const score = insightsDashboard.getConsistencyScore([lateStarter], {
    endDate: new Date(2026, 6, 15),
    startDate: new Date(2026, 6, 1),
  });

  assert.strictEqual(score.completedCount, 3);
  assert.strictEqual(
    score.possibleCount,
    6,
    "only Jul 10-15 (first completion through the end of the query window) are possible; Jul 1-9 must not count"
  );
  assert.strictEqual(score.rate, 50);
});

test("daily plan normalization resets stale, duplicate, missing, and unscheduled habits", () => {
  const todayKey = "2026-07-13";
  const habits = [
    {
      id: "daily",
      name: "Daily",
      completedDates: [],
      createdAt: "2026-07-01",
      frequency: "Daily",
      order: 2,
    },
    {
      id: "weekday",
      name: "Weekday",
      completedDates: [],
      createdAt: "2026-07-01",
      frequency: "Weekdays",
      order: 1,
    },
    {
      id: "unscheduled",
      name: "Weekend",
      completedDates: [],
      createdAt: "2026-07-01",
      customDays: ["Sun"],
      frequency: "Custom",
      order: 3,
    },
  ];

  assertJsonEqual(
    dailyPlanning.normalizeDailyPlan(
      {
        date: "2026-07-12",
        habitIds: ["daily"],
        version: 1,
      },
      habits,
      todayKey
    ),
    { date: todayKey, habitIds: [], version: 1 },
    "plans from another day should reset"
  );

  assertJsonEqual(
    dailyPlanning.normalizeDailyPlan(
      {
        date: todayKey,
        habitIds: [
          "missing",
          "daily",
          "daily",
          "unscheduled",
          "weekday",
          "extra",
        ],
      },
      habits,
      todayKey
    ),
    { date: todayKey, habitIds: ["daily", "weekday"], version: 1 }
  );
});

test("daily plan enforces limit and supports add, remove, and reorder", () => {
  const todayKey = "2026-07-13";
  const habits = ["a", "b", "c", "d"].map((id, index) => ({
    id,
    name: id,
    completedDates: [],
    createdAt: "2026-07-01",
    frequency: "Daily",
    order: index,
  }));
  const plan = { date: todayKey, habitIds: ["a", "b", "c"], version: 1 };

  assertJsonEqual(
    dailyPlanning.addPriorityId(plan, habits, "d", todayKey).habitIds,
    ["a", "b", "c"],
    "daily plan should stay capped at three habits"
  );
  assertJsonEqual(
    dailyPlanning.removePriorityId(plan, habits, "b", todayKey).habitIds,
    ["a", "c"]
  );
  assertJsonEqual(
    dailyPlanning.reorderPriorityIds(plan, habits, "c", "up", todayKey).habitIds,
    ["a", "c", "b"]
  );
  assertJsonEqual(
    dailyPlanning.reorderPriorityIds(plan, habits, "a", "up", todayKey).habitIds,
    ["a", "b", "c"]
  );
});

test("daily plan progress and remaining list stay deterministic", () => {
  const todayKey = "2026-07-13";
  const habits = [
    {
      id: "first",
      name: "First",
      completedDates: [todayKey],
      createdAt: "2026-07-01",
      frequency: "Daily",
      order: 1,
    },
    {
      id: "second",
      name: "Second",
      completedDates: [],
      createdAt: "2026-07-01",
      frequency: "Daily",
      order: 2,
    },
    {
      id: "third",
      name: "Third",
      completedDates: [],
      createdAt: "2026-07-01",
      frequency: "Daily",
      order: 3,
    },
  ];
  const plan = {
    date: todayKey,
    habitIds: ["first", "second"],
    version: 1,
  };

  assertJsonEqual(dailyPlanning.getDailyPlanProgress(plan, habits, todayKey), {
    allComplete: false,
    completedCount: 1,
    remainingCount: 1,
    totalCount: 2,
  });
  assertJsonEqual(
    dailyPlanning
      .getRemainingTodayHabits({
        habits,
        moveCompletedToBottom: false,
        plan,
        todayKey,
      })
      .map((habit) => habit.id),
    ["third"]
  );
});

test("daily plan storage recovers from invalid data and saves normalized plans", async () => {
  resetStorage();
  const todayKey = "2026-07-13";
  const habits = [
    {
      id: "daily",
      name: "Daily",
      completedDates: [],
      createdAt: "2026-07-01",
      frequency: "Daily",
    },
    {
      id: "other",
      name: "Other",
      completedDates: [],
      createdAt: "2026-07-01",
      frequency: "Daily",
    },
  ];

  asyncStorageStore["momentum:daily-plan"] = "{bad";
  assertJsonEqual(await dailyPlanStorage.getDailyPlan(habits, todayKey), {
    date: todayKey,
    habitIds: [],
    version: 1,
  });

  const savedPlan = await dailyPlanStorage.saveDailyPlan(
    {
      date: todayKey,
      habitIds: ["daily", "missing", "daily", "other"],
    },
    habits,
    todayKey
  );

  assertJsonEqual(savedPlan, {
    date: todayKey,
    habitIds: ["daily", "other"],
    version: 1,
  });
  assertJsonEqual(JSON.parse(asyncStorageStore["momentum:daily-plan"]), savedPlan);
});

test("failed habit creation cancels newly scheduled orphan reminders", async () => {
  resetStorage();
  resetNotifications();
  appPreferencesMockState.enableDailyReminders = true;
  asyncStorageFailures.set = true;

  await assert.rejects(
    () =>
      habitsStorage.addHabit({
        category: "Health",
        color: "#64748B",
        customDays: [],
        emoji: "•",
        frequency: "Daily",
        name: "Reminder rollback",
        reminderTime: "08:00",
      }),
    /set failed/
  );

  asyncStorageFailures.set = false;
  assert.strictEqual(notificationState.scheduled.length, 0);
  assertJsonEqual(notificationState.cancelled, ["notification-1"]);
  assertJsonEqual(await habitsStorage.getHabits(), []);
});

test("habit deletion preserves reminders when storage fails and cleans them after success", async () => {
  resetStorage();
  resetNotifications();
  const reminderId = "existing-reminder";

  notificationState.scheduled = [
    {
      id: reminderId,
      request: { content: {}, trigger: {} },
    },
  ];
  await habitsStorage.saveHabits([
    {
      completedDates: [],
      createdAt: habitStats.getTodayKey(),
      frequency: "Daily",
      id: "delete-reliability",
      name: "Delete Reliability",
      notificationIds: [reminderId],
      order: 0,
      reminderStatus: "scheduled",
      reminderTime: "08:00",
    },
  ]);

  asyncStorageFailures.set = true;
  await assert.rejects(
    () => habitsStorage.deleteHabit("delete-reliability"),
    /set failed/
  );
  asyncStorageFailures.set = false;

  assert.strictEqual(notificationState.cancelled.length, 0);
  assert.strictEqual(notificationState.scheduled.length, 1);
  assert.strictEqual((await habitsStorage.getHabits()).length, 1);

  await habitsStorage.deleteHabit("delete-reliability");

  assertJsonEqual(notificationState.cancelled, [reminderId]);
  assert.strictEqual(notificationState.scheduled.length, 0);
  assert.strictEqual((await habitsStorage.getHabits()).length, 0);
});

test("failed reminder edits preserve the existing schedule and remove the replacement", async () => {
  resetStorage();
  resetNotifications();
  appPreferencesMockState.enableDailyReminders = true;
  const reminderId = "existing-reminder";
  const existingHabit = {
    completedDates: [],
    createdAt: habitStats.getTodayKey(),
    frequency: "Daily",
    id: "update-reminder-reliability",
    name: "Update Reminder Reliability",
    notificationIds: [reminderId],
    order: 0,
    reminderStatus: "scheduled",
    reminderTime: "08:00",
  };

  notificationState.scheduled = [
    {
      id: reminderId,
      request: { content: {}, trigger: {} },
    },
  ];
  await habitsStorage.saveHabits([existingHabit]);
  asyncStorageFailures.set = true;

  await assert.rejects(
    () =>
      habitsStorage.updateHabit({
        ...existingHabit,
        reminderTime: "09:00",
      }),
    /set failed/
  );

  asyncStorageFailures.set = false;
  const storedHabit = (await habitsStorage.getHabits())[0];

  assert.strictEqual(storedHabit.reminderTime, "08:00");
  assertJsonEqual(storedHabit.notificationIds, [reminderId]);
  assert.deepStrictEqual(
    notificationState.scheduled.map((notification) => notification.id),
    [reminderId]
  );
  assertJsonEqual(notificationState.cancelled, ["notification-2"]);
});

test("imported habits are normalized without corrupting existing storage", async () => {
  resetStorage();
  asyncStorageStore["habit-tracker:habits"] = JSON.stringify([
    { id: "existing", name: "Existing", completedDates: [] },
  ]);

  await assert.rejects(
    () => habitsStorage.importHabitsBackup("{bad json"),
    /Backup JSON could not be parsed/
  );
  assert.strictEqual(
    JSON.parse(asyncStorageStore["habit-tracker:habits"])[0].id,
    "existing",
    "invalid imports should not overwrite existing habit data"
  );

  const rawImport = {
    habits: [
      {
        id: "duplicate",
        name: " First ",
        completedDates: ["2026-02-01", "bad", "2026-02-01"],
        customDays: ["Mon", "Mon", "Bad"],
        frequency: "Impossible",
        reminderTime: "99:00",
        order: 10,
      },
      {
        id: "duplicate",
        name: "Second",
        completedDates: ["2026-02-02"],
        frequency: "Custom",
        customDays: ["Tue"],
      },
      null,
    ],
  };
  const originalImport = JSON.stringify(rawImport);
  const imported = await habitsStorage.importHabitsBackup(JSON.stringify(rawImport));

  assert.strictEqual(JSON.stringify(rawImport), originalImport);
  assert.strictEqual(imported.length, 2);
  assert.notStrictEqual(imported[0].id, imported[1].id);
  assert.strictEqual(imported[0].frequency, "Daily");
  assert.strictEqual(imported[0].reminderTime, "");
  assertJsonEqual(imported[0].customDays, ["Mon"]);
  assertJsonEqual(imported[0].completedDates, ["2026-02-01"]);
  assertJsonEqual(imported[1].customDays, ["Tue"]);
});

test("app backup export includes versioned local data metadata", async () => {
  resetStorage();
  await habitsStorage.importHabitsBackup(
    JSON.stringify({
      habits: [
        {
          id: "backup-habit",
          name: "Backup Habit",
          completedDates: ["2026-02-01"],
          createdAt: "2026-02-01T00:00:00.000Z",
          frequency: "Daily",
        },
      ],
    })
  );
  await appPreferencesStorage.saveAppPreferences({
    ...appPreferencesStorage.defaultAppPreferences,
    enableDailyReminders: false,
    showProgressCard: false,
  });
  await dailyPlanStorage.saveDailyPlan(
    { date: habitStats.getTodayKey(), habitIds: ["backup-habit"] },
    await habitsStorage.getHabits()
  );

  const exportedText = await appBackup.exportAppData();
  const exported = JSON.parse(exportedText);

  assert.strictEqual(exported.app, "Momentum");
  assert.strictEqual(exported.version, 1);
  assert.strictEqual(exported.schemaVersion, 1);
  assert.strictEqual(exported.appVersion, "1.0.0");
  assert.strictEqual(exported.data.habits.length, 1);
  assert.strictEqual(exported.exportedData.habits.length, 1);
  assert.strictEqual(exported.data.preferences.showProgressCard, false);
  assert.strictEqual(exported.data.dailyPlan.habitIds[0], "backup-habit");

  const validation = appBackup.validateBackup(exportedText);

  assert.strictEqual(validation.ok, true);
  assert.strictEqual(validation.metadata.habitCount, 1);
  assert.strictEqual(validation.metadata.activityHistoryCount, 1);
  assert.strictEqual(validation.metadata.hasActivityHistory, true);
});

test("system theme preference round-trips through backup export and restore", async () => {
  resetStorage();
  await habitsStorage.importHabitsBackup(
    JSON.stringify({
      habits: [
        {
          id: "backup-habit",
          name: "Backup Habit",
          completedDates: [],
          createdAt: "2026-02-01T00:00:00.000Z",
          frequency: "Daily",
        },
      ],
    })
  );
  asyncStorageStore["momentum:theme-preference"] = "system";

  const exportedText = await appBackup.exportAppData();
  const exported = JSON.parse(exportedText);

  assert.strictEqual(exported.data.appearance.themePreference, "system");

  const validation = appBackup.validateBackup(exportedText);

  assert.strictEqual(validation.ok, true);
  assertJsonEqual(validation.warnings, []);
  assert.strictEqual(validation.data.appearance.themePreference, "system");

  asyncStorageStore["momentum:theme-preference"] = "light";

  const result = await appBackup.importAppData(exportedText);

  assertJsonEqual(result.warnings, []);
  assert.strictEqual(
    asyncStorageStore["momentum:theme-preference"],
    "system"
  );
});

test("app backup import replaces data safely and rebuilds derived progress", async () => {
  resetStorage();
  await habitsStorage.importHabitsBackup(
    JSON.stringify({
      habits: [
        {
          id: "existing",
          name: "Existing",
          createdAt: "2026-01-01T00:00:00.000Z",
          completedDates: [],
        },
      ],
    })
  );

  const backupText = JSON.stringify({
    app: "Momentum",
    appVersion: "1.0.0",
    exportedAt: "2026-03-01T00:00:00.000Z",
    version: 1,
    data: {
      appearance: { themePreference: "light" },
      dailyPlan: {
        date: habitStats.getTodayKey(),
        habitIds: ["imported"],
        version: 1,
      },
      flags: {
        firstSwipeHintDismissed: true,
        firstTrendUnlockShown: true,
        onboardingComplete: true,
        returnGuidanceDismissedDate: "2026-02-02",
      },
      gamification: { earnedBadges: ["unknown"], xp: 999 },
      habits: [
        {
          id: "imported",
          name: "Imported",
          completedDates: [habitStats.getTodayKey()],
          createdAt: "2026-01-01T00:00:00.000Z",
          frequency: "Daily",
        },
      ],
      preferences: {
        ...appPreferencesStorage.defaultAppPreferences,
        enableDailyReminders: false,
      },
    },
  });

  const result = await appBackup.importAppData(backupText);
  const habits = await habitsStorage.getHabits();
  const preferences = await appPreferencesStorage.getAppPreferences();
  const dailyPlan = await dailyPlanStorage.getDailyPlan(habits);
  const gamification = await gamificationStorage.getGamification();

  assert.strictEqual(result.habits.length, 1);
  assert.strictEqual(habits[0].id, "imported");
  assert.strictEqual(preferences.enableDailyReminders, false);
  assertJsonEqual(dailyPlan.habitIds, ["imported"]);
  assert.strictEqual(gamification.xp, 35);
  assert.strictEqual(asyncStorageStore["momentum:onboarding-complete"], "true");
  assert.strictEqual(asyncStorageStore["momentum:theme-preference"], "light");
});

test("app backup import does not overwrite existing data if commit fails", async () => {
  resetStorage();
  await habitsStorage.importHabitsBackup(
    JSON.stringify({
      habits: [
        {
          id: "existing",
          name: "Existing",
          createdAt: "2026-01-01T00:00:00.000Z",
          completedDates: [],
        },
      ],
    })
  );
  const beforeStore = JSON.stringify(asyncStorageStore);
  const backupText = JSON.stringify({
    app: "Momentum",
    appVersion: "1.0.0",
    exportedAt: "2026-03-01T00:00:00.000Z",
    schemaVersion: 1,
    exportedData: {
      habits: [
        {
          id: "imported",
          name: "Imported",
          completedDates: [habitStats.getTodayKey()],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      preferences: appPreferencesStorage.defaultAppPreferences,
    },
  });

  asyncStorageFailures.set = true;
  await assert.rejects(() => appBackup.importAppData(backupText), /set failed/);
  asyncStorageFailures.set = false;

  assert.strictEqual(JSON.stringify(asyncStorageStore), beforeStore);
  assert.strictEqual((await habitsStorage.getHabits())[0].id, "existing");
});

test("app backup import rolls back a partially applied storage commit", async () => {
  resetStorage();
  await habitsStorage.importHabitsBackup(
    JSON.stringify({
      habits: [
        {
          id: "existing",
          name: "Existing",
          createdAt: "2026-01-01T00:00:00.000Z",
          completedDates: [],
        },
      ],
    })
  );
  await appPreferencesStorage.saveAppPreferences({
    ...appPreferencesStorage.defaultAppPreferences,
    showProgressCard: false,
  });

  const beforeStore = JSON.stringify(asyncStorageStore);
  const backupText = JSON.stringify({
    app: "Momentum",
    appVersion: "1.0.0",
    exportedAt: "2026-03-01T00:00:00.000Z",
    schemaVersion: 1,
    exportedData: {
      habits: [
        {
          id: "replacement",
          name: "Replacement",
          completedDates: [habitStats.getTodayKey()],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      preferences: appPreferencesStorage.defaultAppPreferences,
    },
  });

  asyncStorageFailures.partialMultiSetAfter = 3;
  await assert.rejects(
    () => appBackup.importAppData(backupText),
    /partial set failed/
  );

  assert.strictEqual(JSON.stringify(asyncStorageStore), beforeStore);
  assert.strictEqual((await habitsStorage.getHabits())[0].id, "existing");
  assert.strictEqual(
    (await appPreferencesStorage.getAppPreferences()).showProgressCard,
    false
  );
});

test("app backup validation rejects corrupted, empty, and future backups safely", () => {
  assert.strictEqual(appBackup.validateBackup("{bad json").ok, false);
  assert.match(
    appBackup.validateBackup("{bad json").errors[0],
    /could not be parsed/
  );
  assert.strictEqual(appBackup.validateBackup("").ok, false);
  assert.strictEqual(
    appBackup.validateBackup(
      JSON.stringify({
        app: "Momentum",
        data: { habits: [] },
        version: 99,
      })
    ).ok,
    false
  );
});

test("app backup preview and validation messages are user-readable", () => {
  const emptySummary = appBackup.getBackupValidationSummary(null);
  const invalidSummary = appBackup.getBackupValidationSummary(
    appBackup.getBackupPreview("{bad json")
  );
  const validSummary = appBackup.getBackupValidationSummary(
    appBackup.getBackupPreview(
      JSON.stringify({
        app: "Momentum",
        appVersion: "1.0.0",
        exportedAt: "2026-04-01T00:00:00.000Z",
        schemaVersion: 1,
        exportedData: {
          habits: [{ id: "preview", name: "Preview" }],
          preferences: appPreferencesStorage.defaultAppPreferences,
        },
      })
    )
  );
  const warningSummary = appBackup.getBackupValidationSummary(
    appBackup.getBackupPreview(
      JSON.stringify({
        app: "Momentum",
        exportedAt: "2026-04-01T00:00:00.000Z",
        schemaVersion: 1,
        exportedData: {
          habits: [
            { id: "duplicate", name: "First" },
            { id: "duplicate", name: "Second" },
          ],
          preferences: appPreferencesStorage.defaultAppPreferences,
        },
      })
    )
  );

  assert.strictEqual(emptySummary.status, "empty");
  assert.strictEqual(invalidSummary.status, "error");
  assert.match(invalidSummary.body, /not valid JSON/);
  assert.strictEqual(validSummary.status, "valid");
  assert.match(validSummary.body, /valid/);
  assert.strictEqual(warningSummary.status, "warning");
  assert.match(warningSummary.detail, /Duplicate habit IDs/);
});

test("app backup import confirmation copy includes replacement scope", () => {
  const validation = appBackup.getBackupPreview(
    JSON.stringify({
      app: "Momentum",
      appVersion: "1.0.0",
      exportedAt: "2026-04-01T00:00:00.000Z",
      schemaVersion: 1,
      exportedData: {
        habits: [
          { id: "one", name: "One" },
          { id: "two", name: "Two" },
        ],
        preferences: appPreferencesStorage.defaultAppPreferences,
      },
    })
  );
  const copy = appBackup.getImportConfirmationCopy(validation);

  assert.strictEqual(copy.confirmLabel, "Replace data");
  assert.match(copy.title, /Replace current data/);
  assert.match(copy.message, /2 habits/);
  assert.match(copy.message, /cannot be undone/);
});

test("app backup validation repairs duplicate ids, invalid reminders, and invalid daily plan", () => {
  const validation = appBackup.validateBackup(
    JSON.stringify({
      app: "Momentum",
      exportedAt: "2026-02-01T00:00:00.000Z",
      version: 1,
      data: {
        appearance: { themePreference: "master" },
        dailyPlan: { date: "bad", habitIds: ["duplicate"], version: 1 },
        habits: [
          {
            id: "duplicate",
            name: "",
            completedDates: ["2026-02-01", "bad"],
            customDays: ["Mon", "Bad"],
            frequency: "Custom",
            reminderStatus: "mystery",
            reminderTime: "99:00",
          },
          {
            id: "duplicate",
            name: "Second",
            frequency: "Daily",
          },
        ],
        preferences: {
          enableDailyReminders: true,
          showProgressCard: "yes",
        },
      },
    })
  );

  assert.strictEqual(validation.ok, true);
  assert.strictEqual(validation.data.habits.length, 2);
  assert.notStrictEqual(validation.data.habits[0].id, validation.data.habits[1].id);
  assert.strictEqual(validation.data.habits[0].reminderTime, "");
  assert.strictEqual(validation.data.habits[0].reminderStatus, "none");
  assertJsonEqual(validation.data.habits[0].customDays, ["Mon"]);
  assert.strictEqual(validation.data.appearance.themePreference, "dark");
  assert.strictEqual(validation.data.dailyPlan, null);
  assert.strictEqual(validation.data.preferences.showProgressCard, true);
  assert.ok(validation.warnings.some((warning) => /Duplicate habit IDs/.test(warning)));
});

test("app backup migration pipeline upgrades older backups", () => {
  const validation = appBackup.validateBackup(
    JSON.stringify({
      app: "Momentum",
      exportedAt: "2026-01-01T00:00:00.000Z",
      habits: [
        {
          id: "old",
          name: "Old Backup",
        },
      ],
      version: 0,
    })
  );

  assert.strictEqual(validation.ok, true);
  assert.strictEqual(validation.version, 1);
  assert.strictEqual(validation.data.habits[0].id, "old");
  assert.ok(validation.warnings.some((warning) => /Migrated backup/.test(warning)));
});

test("app backup accepts exportedData schema aliases", () => {
  const validation = appBackup.validateBackup(
    JSON.stringify({
      app: "Momentum",
      appVersion: "1.0.0",
      exportedAt: "2026-04-01T00:00:00.000Z",
      schemaVersion: 1,
      exportedData: {
        habits: [
          {
            id: "schema-alias",
            name: "Schema Alias",
            completedDates: ["2026-04-01"],
          },
        ],
        preferences: appPreferencesStorage.defaultAppPreferences,
      },
    })
  );

  assert.strictEqual(validation.ok, true);
  assert.strictEqual(validation.version, 1);
  assert.strictEqual(validation.metadata.habitCount, 1);
  assert.strictEqual(validation.data.habits[0].id, "schema-alias");
});

test("app backup legacy habit exports remain importable", async () => {
  resetStorage();

  const result = await appBackup.importAppData(
    JSON.stringify([
      {
        id: "legacy",
        name: "Legacy",
        completedDates: ["2026-01-01"],
      },
    ])
  );

  assert.strictEqual(result.habits.length, 1);
  assert.strictEqual(result.metadata.habitCount, 1);
  assert.strictEqual((await habitsStorage.getHabits())[0].id, "legacy");
});

test("malformed stored habits are backed up and safe defaults are returned", async () => {
  resetStorage();
  asyncStorageStore["habit-tracker:habits"] = "not-json";

  const habits = await habitsStorage.getHabits();

  assertJsonEqual(habits, []);
  assert.strictEqual(asyncStorageStore["habit-tracker:habits-backup"], "not-json");

  await assert.rejects(
    () => habitsStorage.saveHabits({ not: "an array" }),
    /saveHabits expected an array/
  );
});

test("completion haptics do not duplicate swipe gesture feedback", () => {
  assert.strictEqual(
    interactionFeedback.shouldRunInitialCompletionHaptic("tap", {
      enableRewardHaptics: true,
    }),
    true
  );
  assert.strictEqual(
    interactionFeedback.shouldRunInitialCompletionHaptic("swipe", {
      enableRewardHaptics: true,
    }),
    false
  );
  assert.strictEqual(
    interactionFeedback.shouldRunInitialCompletionHaptic("swipe-undo", {
      enableRewardHaptics: true,
    }),
    false
  );
  assert.strictEqual(
    interactionFeedback.shouldRunInitialCompletionHaptic("accessibility", {
      enableRewardHaptics: false,
    }),
    false
  );
});

// frameGeometry.js's five trig helpers (Phase 9 test-coverage survey,
// "cheap + high-value" tier). Pure functions on numbers/arrays, no RN
// imports - loaded straight into the smoke runner like the rest of this
// file's pure-logic modules.
test("frameGeometry pointAt lands on exact coordinates at cardinal angles", () => {
  // pointAt's convention: 0deg is due right, 90deg is due up (y decreases,
  // since screen y grows downward), matching a standard unit circle
  // reflected across the x-axis rather than raw screen-space angles.
  assertJsonEqual(frameGeometry.pointAt(10, 0, 48), [58, 48]);
  assertJsonEqual(frameGeometry.pointAt(10, 90, 48), [48, 38]);
  assertJsonEqual(frameGeometry.pointAt(10, 180, 48), [38, 48]);
  assertJsonEqual(frameGeometry.pointAt(10, 270, 48), [48, 58]);
});

test("frameGeometry round rounds to two decimal places", () => {
  assert.strictEqual(frameGeometry.round(3.14159), 3.14);
  assert.strictEqual(frameGeometry.round(-2.5555), -2.56);
  assert.strictEqual(frameGeometry.round(48), 48);
  assert.strictEqual(frameGeometry.round(65.324999), 65.32);
  assert.strictEqual(frameGeometry.round(0), 0);
});

test("frameGeometry polygonPoints matches sides count, honors rotation for the first vertex, and emits a well-formed point string", () => {
  const points = frameGeometry.polygonPoints(10, 4, 90, 48);

  assert.strictEqual(points, "48,38 58,48 48,58 38,48");

  const pairs = points.split(" ");
  assert.strictEqual(pairs.length, 4);
  pairs.forEach((pair) => {
    assert.match(pair, /^-?\d+(\.\d{1,2})?,-?\d+(\.\d{1,2})?$/);
  });

  // The first vertex always sits at exactly `rotation` degrees - changing
  // rotation should move it to the matching pointAt() coordinate.
  [0, 45, 112.5, 200].forEach((rotation) => {
    const [expectedX, expectedY] = frameGeometry.pointAt(10, rotation, 48);
    const firstVertex = frameGeometry
      .polygonPoints(10, 8, rotation, 48)
      .split(" ")[0];

    assert.strictEqual(
      firstVertex,
      `${frameGeometry.round(expectedX)},${frameGeometry.round(expectedY)}`
    );
  });
});

test("frameGeometry facetedRimPoints alternates rOuter/rInner by index parity and matches the requested count", () => {
  const rOuter = 40;
  const rInner = 20;
  const count = 12;
  const points = frameGeometry.facetedRimPoints(rOuter, rInner, count, 48).split(" ");

  assert.strictEqual(points.length, count);

  for (let i = 0; i < count; i += 1) {
    const expectedR = i % 2 === 0 ? rOuter : rInner;
    const [x, y] = frameGeometry.pointAt(expectedR, 90 - (i * 360) / count, 48);

    assert.strictEqual(points[i], `${frameGeometry.round(x)},${frameGeometry.round(y)}`);
  }

  // Known-good fixed string for a smaller count, to catch a total-breakage
  // regression that a per-index loop re-deriving its own expectation from
  // the same pointAt()/round() helpers could theoretically miss.
  assert.strictEqual(
    frameGeometry.facetedRimPoints(20, 10, 6, 48),
    "48,28 56.66,43 65.32,58 48,58 30.68,58 39.34,43"
  );
});

test("frameGeometry radialTicks shortens only odd-indexed ticks by exactly 3, with tick count matching count and inner/outer coordinates consistent with pointAt", () => {
  const rInner = 30;
  const rOuter = 44;
  const count = 16; // matches BadgeFrame.js's MASTER_TICKS real usage

  const shortened = frameGeometry.radialTicks(rInner, rOuter, count, true, 48);
  const unshortened = frameGeometry.radialTicks(rInner, rOuter, count, false, 48);

  assert.strictEqual(shortened.length, count);
  assert.strictEqual(unshortened.length, count);

  for (let i = 0; i < count; i += 1) {
    const deg = 90 - (i * 360) / count;
    const [innerX, innerY] = frameGeometry.pointAt(rInner, deg, 48);

    // The inner end never shortens, regardless of shortenOdd or parity.
    assert.strictEqual(shortened[i].x1, frameGeometry.round(innerX));
    assert.strictEqual(shortened[i].y1, frameGeometry.round(innerY));
    assert.strictEqual(unshortened[i].x1, frameGeometry.round(innerX));
    assert.strictEqual(unshortened[i].y1, frameGeometry.round(innerY));

    // The unshortened variant's outer end always sits at the full radius.
    const [fullX, fullY] = frameGeometry.pointAt(rOuter, deg, 48);

    assert.strictEqual(unshortened[i].x2, frameGeometry.round(fullX));
    assert.strictEqual(unshortened[i].y2, frameGeometry.round(fullY));

    if (i % 2 !== 0) {
      // Odd index + shortenOdd: outer end pulls in by exactly 3.
      const [shortX, shortY] = frameGeometry.pointAt(rOuter - 3, deg, 48);

      assert.strictEqual(shortened[i].x2, frameGeometry.round(shortX));
      assert.strictEqual(shortened[i].y2, frameGeometry.round(shortY));
    } else {
      // Even index: shortenOdd leaves it untouched, same as the unshortened run.
      assert.strictEqual(shortened[i].x2, unshortened[i].x2);
      assert.strictEqual(shortened[i].y2, unshortened[i].y2);
    }
  }
});

test("frameGeometry hexVertices always returns exactly 6 points regardless of radius or rotation", () => {
  [0, 5, 100, 250].forEach((r) => {
    [0, 45, 90, 137].forEach((rotation) => {
      const vertices = frameGeometry.hexVertices(r, rotation, 48);

      assert.strictEqual(vertices.length, 6);
      vertices.forEach(({ cx, cy }, i) => {
        const [x, y] = frameGeometry.pointAt(r, rotation - i * 60, 48);

        assert.strictEqual(cx, frameGeometry.round(x));
        assert.strictEqual(cy, frameGeometry.round(y));
      });
    });
  });
});

// utils/badgeUnlockTiming.js - the exact value that already drifted out of
// sync once before (Phase 9 accessibility re-audit fix #5, PR #32): a flat
// dismiss timer vs. tier-weighted glow duration. The relationship
// assertion below - not the fixed-value one - is what actually prevents a
// regression here, since a fixed-value test alone would happily pass if
// both functions were edited to drift apart again as long as someone
// updated the hardcoded numbers to match.
test("badge unlock dismiss delay always equals that tier's glow duration plus a fixed reading margin", () => {
  const READING_TIME_MARGIN_MS = 3900;
  const tiers = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"];

  tiers.forEach((tier) => {
    const glow = badgeUnlockTiming.getBadgeGlowDuration(tier);
    const dismiss = badgeUnlockTiming.getBadgeUnlockDismissDelay(tier);

    assert.strictEqual(
      dismiss,
      glow + READING_TIME_MARGIN_MS,
      `${tier}: dismiss delay should derive from glow duration + margin`
    );
    // The margin itself must be the same fixed constant for every tier -
    // only the glow duration is allowed to branch by tier.
    assert.strictEqual(
      dismiss - glow,
      READING_TIME_MARGIN_MS,
      `${tier}: reading margin should not vary by tier`
    );
  });
});

test("Diamond and Master get a longer badge glow duration than the other four tiers", () => {
  const baselineTiers = ["Bronze", "Silver", "Gold", "Platinum"];
  const lingeringTiers = ["Diamond", "Master"];

  const baselineDurations = new Set(
    baselineTiers.map((tier) => badgeUnlockTiming.getBadgeGlowDuration(tier))
  );

  assert.strictEqual(
    baselineDurations.size,
    1,
    "the four non-lingering tiers should share one baseline glow duration"
  );

  const [baselineDuration] = baselineDurations;

  lingeringTiers.forEach((tier) => {
    assert.ok(
      badgeUnlockTiming.getBadgeGlowDuration(tier) > baselineDuration,
      `${tier} glow duration should be longer than the baseline tiers'`
    );
  });
});

test("badge glow duration and dismiss delay match known values for representative tiers", () => {
  assert.strictEqual(badgeUnlockTiming.getBadgeGlowDuration("Bronze"), 300);
  assert.strictEqual(badgeUnlockTiming.getBadgeGlowDuration("Diamond"), 800);
  assert.strictEqual(badgeUnlockTiming.getBadgeGlowDuration("Master"), 800);
  assert.strictEqual(badgeUnlockTiming.getBadgeUnlockDismissDelay("Bronze"), 4200);
  assert.strictEqual(badgeUnlockTiming.getBadgeUnlockDismissDelay("Diamond"), 4700);
});

async function run() {
  let passed = 0;

  for (const { name, fn } of tests) {
    await fn();
    passed += 1;
    console.log(`✓ ${name}`);
  }

  console.log(`Logic tests passed: ${passed}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
