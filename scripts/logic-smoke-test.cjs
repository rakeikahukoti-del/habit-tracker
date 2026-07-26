const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const babel = require("@babel/core");

function loadModule(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const { code } = babel.transformSync(source, {
    filename: filePath,
    presets: ["babel-preset-expo"],
  });
  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    require,
    console,
    Date,
    Math,
    Number,
    Set,
    String,
    Array,
  };

  vm.runInNewContext(code, context, { filename: filePath });

  return module.exports;
}

const habitStats = loadModule("utils/habitStats.js");

function dateKeyForOffset(offset) {
  const date = new Date();

  date.setDate(date.getDate() + offset);

  return habitStats.toDateKey(date);
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
    "2026-01-04",
    "2026-01-05",
    "2026-01-06",
  ]),
  3
);

const emptyOverview = habitStats.getProgressOverview([], "month", { xp: 0 });

assert.strictEqual(emptyOverview.habitCount, 0);
assert.strictEqual(emptyOverview.completionRate, 0);
assert.strictEqual(emptyOverview.totalXpEarned, 0);

console.log("Logic smoke tests passed.");
