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
  set: false,
};
const asyncStorageMock = {
  getItem: async (key) => {
    if (asyncStorageFailures.get) {
      throw new Error("get failed");
    }

    return asyncStorageStore[key] ?? null;
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
  },
  getPermissionsAsync: async () => notificationState.permissions,
  requestPermissionsAsync: async () => notificationState.permissions,
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
  asyncStorageFailures.set = false;
  Object.keys(asyncStorageStore).forEach((key) => {
    delete asyncStorageStore[key];
  });
}

function resetNotifications() {
  notificationState.cancelled = [];
  notificationState.permissions = { granted: true, canAskAgain: true };
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

  return require(moduleName);
});
const analyticsReadiness = loadModule("utils/analyticsReadiness.js", (moduleName) => {
  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const themePreferences = loadModule("utils/themePreferences.js");
const calendarMonth = loadModule("utils/calendarMonth.js", (moduleName) => {
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
const habitOptions = loadModule("constants/habitOptions.js");
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
const appPreferencesMock = {
  getAppPreferences: async () => ({ enableDailyReminders: false }),
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
  assert.strictEqual(summary.nextAction, "Add your first habit");
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
  assert.strictEqual(scheduledSummary.habitsSectionMessage, "One habit left.");
  assert.strictEqual(scheduledSummary.nextAction, "Complete the final habit");
  assert.strictEqual(scheduledSummary.todayCountLabel, "1/2 today");

  const rewards = homeHabitActions.getQueuedRewardsFromMessages(
    [
      { id: "same", text: "Level up! You reached level 5.", type: "level", level: 5 },
      { id: "same", text: "Duplicate", type: "level", level: 5 },
      { id: "badge", type: "badge", badgeId: "first-completion" },
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
  assert.strictEqual(rewards.celebration, "Nice work.");
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
  assert.strictEqual(review.breakdown[0].status, "Complete this week");
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
      ["Attention", "No completions yet this week"],
      ["Progress", "One scheduled completion remaining"],
      ["Complete", "Complete this week"],
      ["Unscheduled", "No scheduled days this week"],
    ]
  );
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
  assert.strictEqual(summary.habitsSectionMessage, "Today is complete.");
  assert.strictEqual(summary.motivation, "Today is complete.");
  assert.strictEqual(summary.nextAction, "Today is complete");
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

test("visible rank display hides legacy Diamond without changing stored logic", () => {
  assert.strictEqual(gamificationLogic.getRankForLevel(25), "Diamond");
  assert.strictEqual(rankDisplay.getVisibleRank("Diamond"), "Platinum");
  assertJsonEqual(rankDisplay.ACTIVE_RANK_LABELS, [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Master",
  ]);
  assertJsonEqual(
    rankDisplay
      .getVisibleRankMilestones(gamificationLogic.rankMilestones)
      .map((rankItem) => rankItem.label),
    ["Bronze", "Silver", "Gold", "Platinum", "Master"]
  );
  assert.strictEqual(
    progressionMilestones.getNextRankMilestone(
      { currentLevelXp: 0, level: 25 },
      gamificationLogic.rankMilestones
    ).label,
    "Master"
  );
});

test("appearance preferences only support Light and Dark with safe legacy migration", () => {
  assertJsonEqual(
    themePreferences.appearanceOptions.map((option) => option.value),
    ["light", "dark"]
  );
  assertJsonEqual(Object.keys(appColors.themes).sort(), ["dark", "light"]);
  assert.strictEqual(themePreferences.isSupportedThemePreference("light"), true);
  assert.strictEqual(themePreferences.isSupportedThemePreference("dark"), true);
  assert.strictEqual(themePreferences.isSupportedThemePreference("system"), false);
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

test("visual asset manifest covers rank and achievement identifiers", () => {
  assert(appAssets.brandAssets.appIconDark.endsWith("app-icon-dark.png"));
  assert(appAssets.brandAssets.appIconLight.endsWith("app-icon-light.png"));
  assert.strictEqual(
    Object.keys(appAssets.RANK_BADGE_ASSETS).includes("diamond"),
    false,
    "active rank assets should not expose a Diamond rank image"
  );
  assertJsonEqual(appAssets.SUPPLIED_RANK_ASSET_ORDER, [
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Master",
  ]);
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
  assert.strictEqual(
    appAssets.getRankBadgeAsset("Bronze"),
    appAssets.RANK_BADGE_ASSETS.bronze
  );
  assert.strictEqual(
    appAssets.getRankBadgeAsset("Silver"),
    appAssets.RANK_BADGE_ASSETS.silver
  );
  assert.strictEqual(
    appAssets.getRankBadgeAsset("Gold"),
    appAssets.RANK_BADGE_ASSETS.gold
  );
  assert.strictEqual(
    appAssets.getRankBadgeAsset("Platinum"),
    appAssets.RANK_BADGE_ASSETS.platinum
  );
  assert.strictEqual(
    appAssets.getRankBadgeAsset("Master"),
    appAssets.RANK_BADGE_ASSETS.master
  );
  assert.strictEqual(
    appAssets.getRankBadgeAsset("Unknown"),
    appAssets.RANK_BADGE_ASSETS.bronze,
    "unknown ranks should use the Bronze fallback"
  );
  assert.strictEqual(
    appAssets.getRankBadgeAsset("Diamond"),
    appAssets.RANK_BADGE_ASSETS.platinum,
    "legacy Diamond rank display should use the Platinum visual"
  );

  gamificationLogic.rankMilestones.forEach((rankItem) => {
    const asset = appAssets.getRankBadgeAsset(rankItem.label);

    assert(asset, `${rankItem.label} rank should resolve to an asset`);
    assert(fs.existsSync(asset), `${rankItem.label} rank asset should exist`);
  });

  assert.strictEqual(
    appAssets.getRankBadgeAsset("Master"),
    appAssets.RANK_BADGE_ASSETS.master,
    "Master rank should use the Master asset"
  );

  gamificationLogic.badges.forEach((badge) => {
    const asset = appAssets.getAchievementBadgeAsset(badge.id);

    assert(asset, `${badge.id} should resolve to an achievement asset`);
    assert(fs.existsSync(asset), `${badge.id} asset should exist`);
  });
});

test("achievement icon metadata is complete and separated from rank assets", () => {
  gamificationLogic.badges.forEach((badge) => {
    const meta = achievementConstants.getAchievementIconMeta(badge.id);

    assert.strictEqual(typeof meta.iconName, "string");
    assert.strictEqual(typeof meta.accent, "string");
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(meta, "assetPath"),
      false,
      `${badge.id} should not resolve through a rank or logo asset path`
    );
  });

  assertJsonEqual(
    achievementConstants.getAchievementIconMeta("unknown-achievement"),
    achievementConstants.ACHIEVEMENT_ICON_FALLBACK
  );
  assert.strictEqual(
    JSON.stringify(achievementConstants.ACHIEVEMENT_ICON_MAP).includes("assets/ranks"),
    false,
    "achievement icon metadata should not import rank assets"
  );
  assert.strictEqual(
    JSON.stringify(achievementConstants.ACHIEVEMENT_ICON_MAP).includes("wolf"),
    false,
    "achievement icon metadata should not import wolf/logo assets"
  );
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
