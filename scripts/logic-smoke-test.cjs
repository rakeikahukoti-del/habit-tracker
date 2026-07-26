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
    Math,
    Number,
    Set,
    String,
    Array,
    Object,
  };

  vm.runInNewContext(code, context, { filename: filePath });

  return module.exports;
}

const habitStats = loadModule("utils/habitStats.js");
const habitNotifications = loadModule("notifications/habitNotifications.js", (moduleName) => {
  if (moduleName === "react-native") {
    return { Platform: { OS: "ios" } };
  }

  if (moduleName === "expo-notifications") {
    return {
      IosAuthorizationStatus: { PROVISIONAL: "provisional" },
      SchedulableTriggerInputTypes: {
        DAILY: "daily",
        WEEKLY: "weekly",
      },
      setNotificationHandler: () => {},
    };
  }

  return require(moduleName);
});

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
assert.strictEqual(habitNotifications.parseReminderTime("09:30").hour, 9);
assert.strictEqual(habitNotifications.parseReminderTime("24:00"), null);
assert.deepStrictEqual(
  habitNotifications.getUniqueValidWeekdays(["Mon", "Mon", "Bad", "Fri"]),
  ["Mon", "Fri"]
);

const previousWeekdays = getPreviousScheduledDateKeys(2, [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
]);
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

const customDays = ["Mon", "Wed", "Fri"];
const previousCustomDays = getPreviousScheduledDateKeys(2, customDays);
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

const createdTodayHabit = {
  completedDates: [],
  createdAt: habitStats.getTodayKey(),
  frequency: "Daily",
};
assert.strictEqual(
  habitStats.getHabitPerformance(createdTodayHabit, "month").possibleCount,
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

const futureDate = dateKeyForOffset(1);
assert.strictEqual(
  habitStats.getHabitPerformance(
    {
      completedDates: [habitStats.getTodayKey(), futureDate],
      createdAt: habitStats.getTodayKey(),
      frequency: "Daily",
    },
    "week"
  ).completedCount,
  1,
  "future completions should not be counted in current analytics periods"
);

const emptyOverview = habitStats.getProgressOverview([], "month", { xp: 0 });

assert.strictEqual(emptyOverview.habitCount, 0);
assert.strictEqual(emptyOverview.completionRate, 0);
assert.strictEqual(emptyOverview.totalXpEarned, 0);

console.log("Logic smoke tests passed.");
