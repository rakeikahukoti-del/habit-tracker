// Performance baseline for AsyncStorage read/write patterns and the
// data-prep cost behind Momentum's list-heavy screens, as habit count and
// history depth grow. Not a test - no pass/fail assertions - a
// measurement tool you re-run when scale assumptions need revisiting.
//
// SCOPE AND HONEST LIMITS, read before trusting a number below:
//
// 1. This runs in plain Node, not on a device. AsyncStorage's mock here
//    (same in-memory object the Jest/logic-smoke-test suites already use)
//    has ~zero I/O latency - it measures the JS-side cost Momentum's code
//    controls (JSON.stringify/parse of the stored blob, array operations
//    in storage/habitsStorage.js and the analytics utils), NOT real
//    on-device disk I/O (SQLite on iOS, a key-value DB on Android). Real
//    device I/O adds its own latency on top of every number here - this
//    script can tell you "the JS work is/isn't the bottleneck," not give
//    you an absolute wall-clock completion time a user would feel.
// 2. This can't measure FlatList/ScrollView render or native-view mount
//    cost - that needs an actual RN renderer (device or simulator +
//    Flipper/Instruments/React DevTools Profiler), which is out of scope
//    for a Node script. What IS measured here: exactly how many items
//    those lists would have to render at each data tier, and the cost of
//    the data-prep pipeline that runs before each render - a solid proxy
//    for "is there a scale problem," even without a literal frame time.
//
// Run: node scripts/perf-benchmark.cjs

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

// ---- in-memory AsyncStorage mock (same shape as the Jest/logic-smoke-test
// mocks - see jest.setup.js and scripts/logic-smoke-test.cjs) ----
let asyncStorageStore = {};
const asyncStorageMock = {
  getItem: async (key) => asyncStorageStore[key] ?? null,
  multiGet: async (keys) => keys.map((key) => [key, asyncStorageStore[key] ?? null]),
  multiSet: async (entries) => {
    entries.forEach(([key, value]) => {
      asyncStorageStore[key] = value;
    });
  },
  multiRemove: async (keys) => {
    keys.forEach((key) => delete asyncStorageStore[key]);
  },
  removeItem: async (key) => {
    delete asyncStorageStore[key];
  },
  setItem: async (key, value) => {
    asyncStorageStore[key] = value;
  },
};
const asyncStorageProvider = { __esModule: true, default: asyncStorageMock };

const expoNotificationsMock = {
  AndroidImportance: { DEFAULT: "default" },
  IosAuthorizationStatus: { PROVISIONAL: "provisional" },
  SchedulableTriggerInputTypes: { DAILY: "daily", WEEKLY: "weekly" },
  cancelScheduledNotificationAsync: async () => {},
  getAllScheduledNotificationsAsync: async () => [],
  getPermissionsAsync: async () => ({ granted: false, canAskAgain: true }),
  requestPermissionsAsync: async () => ({ granted: false, canAskAgain: true }),
  scheduleNotificationAsync: async () => "noop",
  setNotificationChannelAsync: async () => {},
  setNotificationHandler: () => {},
};

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

// ---- real app modules, wired the same way scripts/logic-smoke-test.cjs
// already does (kept in sync with that file's require-shim shape) ----
const habitStats = loadModule("utils/habitStats.js");
const gamificationLogic = loadModule("utils/gamification.js", (m) =>
  m === "./habitStats" ? habitStats : require(m)
);
const rankDisplay = loadModule("utils/rankDisplay.js");
const dailyPlanning = loadModule("utils/dailyPlanning.js", (m) =>
  m === "./habitStats" ? habitStats : require(m)
);
const weeklyReview = loadModule("utils/weeklyReview.js", (m) =>
  m === "./habitStats" ? habitStats : require(m)
);
const homeHabitActions = loadModule("utils/homeHabitActions.js", (m) => {
  if (m === "./gamification") return gamificationLogic;
  if (m === "./habitStats") return habitStats;
  if (m === "./weeklyReview") return weeklyReview;
  if (m === "./rankDisplay") return rankDisplay;
  if (m === "./dailyPlanning") return dailyPlanning;
  return require(m);
});
const activityHistory = loadModule("utils/activityHistory.js", (m) =>
  m === "./habitStats" ? habitStats : require(m)
);
const personalRecords = loadModule("utils/personalRecords.js", (m) =>
  m === "./habitStats" ? habitStats : require(m)
);
const yearInReview = loadModule("utils/yearInReview.js", (m) => {
  if (m === "./activityHistory") return activityHistory;
  if (m === "./gamification") return gamificationLogic;
  if (m === "./habitStats") return habitStats;
  return require(m);
});
const insightsDashboard = loadModule("utils/insightsDashboard.js", (m) => {
  if (m === "./habitStats") return habitStats;
  if (m === "./personalRecords") return personalRecords;
  return require(m);
});
const habitOptions = loadModule("constants/habitOptions.js");
const habitNotifications = loadModule("notifications/habitNotifications.js", (m) => {
  if (m === "react-native") return { Platform: { OS: "ios" } };
  if (m === "expo-notifications") return expoNotificationsMock;
  return require(m);
});
const appPreferencesStorage = loadModule("storage/appPreferences.js", (m) => {
  if (m === "@react-native-async-storage/async-storage") return asyncStorageProvider;
  if (m === "./storageUtils") return storageUtils;
  return require(m);
});
const gamificationStorage = loadModule("storage/gamificationStorage.js", (m) => {
  if (m === "@react-native-async-storage/async-storage") return asyncStorageProvider;
  if (m === "../utils/habitStats") return habitStats;
  if (m === "../utils/gamification") return gamificationLogic;
  if (m === "./storageUtils") return storageUtils;
  return require(m);
});
const widgetRefresh = loadModule("widgets/widgetRefresh.js", (m) => {
  if (m === "@react-native-async-storage/async-storage") return asyncStorageProvider;
  return require(m);
});
const habitsStorage = loadModule("storage/habitsStorage.js", (m) => {
  if (m === "@react-native-async-storage/async-storage") return asyncStorageProvider;
  if (m === "../constants/habitOptions") return habitOptions;
  if (m === "./appPreferences") return appPreferencesStorage;
  if (m === "./gamificationStorage") return gamificationStorage;
  if (m === "./storageUtils") return storageUtils;
  if (m === "../notifications/habitNotifications") return habitNotifications;
  if (m === "../utils/habitStats") return habitStats;
  if (m === "../widgets/widgetRefresh") return widgetRefresh;
  return require(m);
});
const dailyPlanStorage = loadModule("storage/dailyPlanStorage.js", (m) => {
  if (m === "@react-native-async-storage/async-storage") return asyncStorageProvider;
  if (m === "../utils/habitStats") return habitStats;
  if (m === "../utils/dailyPlanning") return dailyPlanning;
  if (m === "./storageUtils") return storageUtils;
  if (m === "../widgets/widgetRefresh") return widgetRefresh;
  return require(m);
});
const habitCompletionActions = loadModule("utils/habitCompletionActions.js", (m) => {
  if (m === "../storage/gamificationStorage") return gamificationStorage;
  if (m === "../storage/habitsStorage") return habitsStorage;
  if (m === "../widgets/widgetRefresh") return widgetRefresh;
  if (m === "./habitStats") return habitStats;
  return require(m);
});

// ---- seed data ----
// createMasterDemoHabits() in storage/habitsStorage.js - the app's own
// "heaviest" bundled demo data - is 4 habits x 100 days. That's the
// product's own idea of a lot of data, and it's well below every tier
// here except "light." Tiers below are deliberately well past what a
// real user would plausibly hit, specifically to find where the JS cost
// actually starts to bend upward.
function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function daysAgoKey(days) {
  const date = new Date();

  date.setDate(date.getDate() - days);

  return toDateKey(date);
}

function seedHabits(habitCount, historyDays, completionRate = 0.85) {
  const habits = [];

  for (let h = 0; h < habitCount; h += 1) {
    const completedDates = [];

    for (let d = 0; d < historyDays; d += 1) {
      // Deterministic "mostly complete, some gaps" pattern rather than
      // literal 100% density - closer to how a real streak actually looks,
      // and avoids overstating the cost of a habit nobody ever misses.
      if ((d * 7 + h) % 100 < completionRate * 100) {
        completedDates.push(daysAgoKey(d));
      }
    }

    habits.push(
      habitsStorage.normalizeHabit({
        id: `bench-habit-${h}`,
        name: `Benchmark habit ${h}`,
        emoji: "💧",
        category: habitOptions.categoryOptions[h % habitOptions.categoryOptions.length],
        color: habitOptions.habitColorOptions[h % habitOptions.habitColorOptions.length],
        frequency: "Daily",
        customDays: [],
        reminderTime: "",
        notificationIds: [],
        createdAt: daysAgoKey(historyDays),
        completedDates,
        order: h,
      })
    );
  }

  return habits;
}

const TIERS = [
  // Post-fix (see the perf-baseline report's follow-up): Year-in-Review,
  // Analytics insights, and the year heatmap are all now cheap enough to
  // measure at every tier, including extreme. Kept the per-tier iteration
  // counts modest below regardless, so a re-run stays fast.
  { habitCount: 5, historyDays: 90, name: "light", analyticsIterations: 10 },
  { habitCount: 12, historyDays: 365, name: "typical", analyticsIterations: 10 },
  { habitCount: 30, historyDays: 1095, name: "heavy", analyticsIterations: 5 },
  { habitCount: 100, historyDays: 1825, name: "extreme", analyticsIterations: 3 },
];

// ---- timing helpers ----
async function timeMs(fn) {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();

  return { ms: Number(end - start) / 1e6, result };
}

async function timeManyMs(fn, iterations) {
  const samples = [];

  for (let i = 0; i < iterations; i += 1) {
    const { ms } = await timeMs(fn);
    samples.push(ms);
  }

  samples.sort((a, b) => a - b);

  return {
    max: samples[samples.length - 1],
    mean: samples.reduce((sum, v) => sum + v, 0) / samples.length,
    median: samples[Math.floor(samples.length / 2)],
    min: samples[0],
  };
}

function fmt(stats) {
  return `min ${stats.min.toFixed(2)}ms / median ${stats.median.toFixed(2)}ms / mean ${stats.mean.toFixed(2)}ms / max ${stats.max.toFixed(2)}ms`;
}

function blobSizeKB(habits) {
  return (JSON.stringify(habits).length / 1024).toFixed(1);
}

async function resetStorageWithHabits(habits) {
  asyncStorageStore = {};
  await habitsStorage.saveHabits(habits);
}

async function run() {
  console.log("Momentum performance baseline\n" + "=".repeat(60));

  for (const tier of TIERS) {
    const habits = seedHabits(tier.habitCount, tier.historyDays);
    const blobKB = blobSizeKB(habits);

    console.log(
      `\n--- ${tier.name.toUpperCase()}: ${tier.habitCount} habits x ~${tier.historyDays}d history (${blobKB} KB serialized) ---`
    );

    // 1. saveHabits (JSON.stringify + write) - the write side of every
    //    mutation (complete/undo/add/edit/reorder/delete).
    await resetStorageWithHabits(habits);
    const saveStats = await timeManyMs(() => habitsStorage.saveHabits(habits), 20);
    console.log(`  saveHabits (write full blob):      ${fmt(saveStats)}`);

    // 2. getHabits (read + JSON.parse + normalizeHabitOrder) - runs on
    //    every mutation's internal re-reads too, not just screen loads.
    const getStats = await timeManyMs(() => habitsStorage.getHabits(), 20);
    console.log(`  getHabits (read + normalize):      ${fmt(getStats)}`);

    // 3. Full "complete a habit" round trip - the real call chain:
    //    getHabits -> completeHabitForToday (getHabits+saveHabits) ->
    //    getHabits again -> getGamification -> awardHabitCompletion
    //    (getGamification+saveGamification) -> requestWidgetRefresh.
    //    Undo the completion between runs so each sample does real work
    //    rather than hitting the "already completed" early return.
    const completionSamples = [];
    for (let i = 0; i < 10; i += 1) {
      await resetStorageWithHabits(habits);
      const targetId = habits[i % habits.length].id;
      const { ms } = await timeMs(() =>
        habitCompletionActions.completeHabitTodayWithRewards(targetId)
      );
      completionSamples.push(ms);
    }
    completionSamples.sort((a, b) => a - b);
    const compMean =
      completionSamples.reduce((s, v) => s + v, 0) / completionSamples.length;
    console.log(
      `  Complete-a-habit (full tap round trip): min ${completionSamples[0].toFixed(2)}ms / mean ${compMean.toFixed(2)}ms / max ${completionSamples[completionSamples.length - 1].toFixed(2)}ms`
    );

    // 4. Home screen load - mirrors hooks/useHomeController.js's
    //    Promise.all + sequential getDailyPlan.
    await resetStorageWithHabits(habits);
    const homeLoadStats = await timeManyMs(async () => {
      const [storedHabits, storedPreferences, storedGamification] = await Promise.all([
        habitsStorage.getHabits(),
        appPreferencesStorage.getAppPreferences(),
        gamificationStorage.getGamification(),
      ]);

      await dailyPlanStorage.getDailyPlan(storedHabits);

      return { storedHabits, storedPreferences, storedGamification };
    }, 15);
    console.log(`  Home screen load (storage only):   ${fmt(homeLoadStats)}`);

    // 5/6/7. Year-in-review, Analytics insights, and the year heatmap data
    //    prep. All three used to carry a real algorithmic issue (see the
    //    perf-baseline report and its follow-up fix report) - a per-habit
    //    date cache was getting rebuilt from scratch inside per-day loops
    //    (activityHistory.js, insightsDashboard.js) or as an eagerly-
    //    evaluated default parameter on every isHabitScheduledOnDate call
    //    (habitStats.js's getHabitStartDate, the dominant cost of the
    //    three) instead of being built once and reused. Fixed - all three
    //    are now cheap enough to measure at every tier, including extreme.
    const gamification = gamificationLogic.normalizeGamificationState();
    const thisYear = new Date().getFullYear();
    const iterations = tier.analyticsIterations;

    const yearReviewStats = await timeManyMs(
      () => Promise.resolve(yearInReview.getYearInReview(habits, gamification, thisYear)),
      iterations
    );
    console.log(`  Year-in-review data prep:          ${fmt(yearReviewStats)}`);

    const insightsStats = await timeManyMs(
      () => Promise.resolve(insightsDashboard.getInsightsDashboard(habits, gamification)),
      iterations
    );
    console.log(`  Analytics insights dashboard prep: ${fmt(insightsStats)}`);

    const activityDays = activityHistory.getYearActivityDays(habits, thisYear);
    const activityDaysStats = await timeManyMs(
      () => Promise.resolve(activityHistory.getYearActivityDays(habits, thisYear)),
      iterations
    );
    console.log(
      `  Year heatmap data prep (${activityDays.length} cells, fixed): ${fmt(activityDaysStats)}`
    );

    // 7. List item counts actually rendered per screen at this tier - the
    //    thing that would matter for FlatList/ScrollView render cost,
    //    which this script cannot measure directly (see header comment).
    console.log(
      `  List item counts -> Home habit list: ${tier.habitCount} (FlatList, virtualized) | ` +
        `Year heatmap: 365-366 cells (fixed, unvirtualized ScrollView) | ` +
        `Analytics rankings: ${tier.habitCount} rows (unvirtualized ScrollView)`
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log("Done. See scripts/perf-benchmark.cjs header for scope/limits.");
}

run().catch((error) => {
  console.error("Benchmark failed:", error);
  process.exit(1);
});
