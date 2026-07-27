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
const homeHabitActions = loadModule("utils/homeHabitActions.js", (moduleName) => {
  if (moduleName === "./gamification") {
    return gamificationLogic;
  }

  if (moduleName === "./habitStats") {
    return habitStats;
  }

  return require(moduleName);
});
const themePreferences = loadModule("utils/themePreferences.js");
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
  assert.strictEqual(summary.completionLabel, "0%");
  assert.strictEqual(summary.levelInfo.level, 40);

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
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(rewards, "themeUnlock"),
    false
  );
  assert.strictEqual(rewards.badgeUnlock.id, "first-completion");
  assert.strictEqual(rewards.celebration, "Nice work.");
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
