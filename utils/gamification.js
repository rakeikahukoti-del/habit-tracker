import {
  getBestStreak,
  getCurrentStreak,
  isHabitScheduledOnDate,
} from "./habitStats";

export const XP_PER_COMPLETION = 10;
export const PERFECT_DAY_BONUS_XP = 25;
export const XP_PER_LEVEL = 100;

export const badges = [
  createBadge("first-habit-created", "First Habit Created", "Getting started", "Bronze", "Common", "Create your first habit."),
  createBadge("first-completion", "First Completion", "Getting started", "Bronze", "Common", "Complete any habit for the first time."),
  createBadge("first-perfect-day", "First Perfect Day", "Getting started", "Silver", "Rare", "Complete every active habit in one day."),
  createBadge("three-day-streak", "3-Day Streak", "Consistency", "Bronze", "Common", "Keep a habit streak alive for 3 days."),
  createBadge("seven-day-streak", "7-Day Streak", "Consistency", "Silver", "Rare", "Keep a habit streak alive for 7 days."),
  createBadge("fourteen-day-streak", "14-Day Streak", "Consistency", "Gold", "Rare", "Keep a habit streak alive for 14 days."),
  createBadge("thirty-day-streak", "30-Day Streak", "Consistency", "Platinum", "Epic", "Keep a habit streak alive for 30 days."),
  createBadge("sixty-day-streak", "60-Day Streak", "Consistency", "Diamond", "Epic", "Keep a habit streak alive for 60 days."),
  createBadge("one-hundred-day-streak", "100-Day Streak", "Consistency", "Master", "Legendary", "Keep a habit streak alive for 100 days."),
  createBadge("three-habits-one-day", "Complete 3 Habits in One Day", "Daily volume", "Bronze", "Common", "Complete 3 habits on the same day."),
  createBadge("five-habits-one-day", "Complete 5 Habits in One Day", "Daily volume", "Silver", "Rare", "Complete 5 habits on the same day."),
  createBadge("ten-habits-one-day", "Complete 10 Habits in One Day", "Daily volume", "Gold", "Epic", "Complete 10 habits on the same day."),
  createBadge("ten-total-completions", "10 Total Completions", "Total completions", "Bronze", "Common", "Reach 10 total habit completions."),
  createBadge("fifty-total-completions", "50 Total Completions", "Total completions", "Silver", "Rare", "Reach 50 total habit completions."),
  createBadge("one-hundred-total-completions", "100 Total Completions", "Total completions", "Gold", "Rare", "Reach 100 total habit completions."),
  createBadge("two-fifty-total-completions", "250 Total Completions", "Total completions", "Platinum", "Epic", "Reach 250 total habit completions."),
  createBadge("five-hundred-total-completions", "500 Total Completions", "Total completions", "Diamond", "Legendary", "Reach 500 total habit completions."),
  createBadge("reach-level-five", "Reach Level 5", "Progress", "Silver", "Rare", "Reach level 5 through XP."),
  createBadge("reach-level-ten", "Reach Level 10", "Progress", "Gold", "Rare", "Reach level 10 through XP."),
  createBadge("reach-level-twenty-five", "Reach Level 25", "Progress", "Diamond", "Epic", "Reach level 25 through XP."),
  createBadge("reach-level-forty", "Reach Level 40", "Progress", "Master", "Legendary", "Reach level 40 through XP."),
  createBadge("unlock-silver", "Unlock Silver", "Ranks", "Silver", "Rare", "Unlock the Silver rank theme."),
  createBadge("unlock-gold", "Unlock Gold", "Ranks", "Gold", "Rare", "Unlock the Gold rank theme."),
  createBadge("unlock-platinum", "Unlock Platinum", "Ranks", "Platinum", "Epic", "Unlock the Platinum rank theme."),
  createBadge("unlock-diamond", "Unlock Diamond", "Ranks", "Diamond", "Epic", "Unlock the Diamond rank theme."),
  createBadge("unlock-master", "Unlock Master", "Ranks", "Master", "Legendary", "Unlock the Master rank theme."),
];

export const rankThemes = [
  { key: "bronze", label: "Bronze", unlockLevel: 1 },
  { key: "silver", label: "Silver", unlockLevel: 5 },
  { key: "gold", label: "Gold", unlockLevel: 10 },
  { key: "platinum", label: "Platinum", unlockLevel: 15 },
  { key: "diamond", label: "Diamond", unlockLevel: 25 },
  { key: "master", label: "Master", unlockLevel: 40 },
];

function createBadge(id, label, group, tier, rarity, description) {
  return {
    description,
    group,
    id,
    label,
    rarity,
    tier,
  };
}

export function normalizeGamificationState(gamification = {}) {
  const safeState = isPlainObject(gamification) ? gamification : {};
  const earnedBadges = Array.isArray(safeState.earnedBadges)
    ? safeState.earnedBadges.map((badgeId) =>
        badgeId === "perfect-day" ? "first-perfect-day" : badgeId
      )
    : [];

  return {
    earnedBadges: getUniqueStrings(earnedBadges),
    pendingMessages: Array.isArray(safeState.pendingMessages)
      ? safeState.pendingMessages.filter(isPlainObject)
      : [],
    perfectDayBonusDates: getSafeDateKeys(safeState.perfectDayBonusDates),
    recentAchievements: getUniqueObjectsById(safeState.recentAchievements),
    xp: Number.isFinite(safeState.xp) && safeState.xp > 0 ? safeState.xp : 0,
  };
}

export function calculateGamificationState({
  habits,
  includeMessage = true,
  now = new Date().toISOString(),
  previousState,
}) {
  const safeHabits = getSafeHabits(habits);
  const previousGamification = normalizeGamificationState(previousState);
  const previousLevel = getGamificationLevelInfo(previousGamification).level;
  const completionCount = getCompletionCount(safeHabits);
  const perfectDayBonusDates = calculatePerfectDayBonusDates(safeHabits);
  const xp =
    completionCount * XP_PER_COMPLETION +
    perfectDayBonusDates.length * PERFECT_DAY_BONUS_XP;
  const earnedBadges = getEarnedBadgeIds({
    habits: safeHabits,
    perfectDayBonusDates,
    xp,
  });
  const nextLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
  const previousBadges = new Set(previousGamification.earnedBadges);
  const newBadgeUnlocks = earnedBadges
    .filter((badgeId) => !previousBadges.has(badgeId))
    .map(getBadgeById)
    .filter(Boolean);
  const newPerfectDayDates = perfectDayBonusDates.filter(
    (dateKey) => !previousGamification.perfectDayBonusDates.includes(dateKey)
  );
  const newThemeUnlocks = getNewThemeUnlocks(previousLevel, nextLevel);
  const newAchievements = includeMessage
    ? buildRecalculatedAchievements({
        newBadgeUnlocks,
        newPerfectDayDates,
        newThemeUnlocks,
        nextLevel,
        now,
        previousLevel,
      })
    : [];
  const pendingMessages = includeMessage
    ? buildRecalculatedMessages({
        newBadgeUnlocks,
        newPerfectDayDates,
        newThemeUnlocks,
        nextLevel,
        now,
        previousLevel,
      })
    : [];
  const state = normalizeGamificationState({
    earnedBadges,
    pendingMessages,
    perfectDayBonusDates,
    recentAchievements: [
      ...newAchievements,
      ...previousGamification.recentAchievements,
    ].slice(0, 20),
    xp,
  });

  return {
    earnedBadges,
    levelChanged: nextLevel !== previousLevel,
    newBadgeUnlocks,
    newPerfectDayDates,
    newThemeUnlocks,
    previousLevel,
    rankChanged:
      getRankForLevel(previousLevel) !== getRankForLevel(nextLevel),
    state,
    xpChanged: previousGamification.xp !== state.xp,
  };
}

export function calculateAwardState({
  badgesToAdd = [],
  completedHabit = null,
  habits = null,
  messages = [],
  now = new Date().toISOString(),
  perfectDayBonusDate = null,
  previousState,
  todayKey = null,
  xpToAdd = 0,
}) {
  const gamification = normalizeGamificationState(previousState);
  const safeHabits = habits ? getSafeHabits(habits) : null;
  const previousLevel = getGamificationLevelInfo(gamification).level;
  const completionDate = todayKey || perfectDayBonusDate;
  const nextPerfectDayBonusDates = perfectDayBonusDate
    ? getUniqueStrings([...gamification.perfectDayBonusDates, perfectDayBonusDate])
    : gamification.perfectDayBonusDates;
  const nextXp = gamification.xp + xpToAdd;
  const calculatedBadges = safeHabits
    ? getEarnedBadgeIds({
        habits: safeHabits,
        perfectDayBonusDates: nextPerfectDayBonusDates,
        xp: nextXp,
      })
    : badgesToAdd;
  const earnedBadges = new Set(gamification.earnedBadges);
  const newBadgeUnlocks = [];

  calculatedBadges.forEach((badgeId) => {
    if (!earnedBadges.has(badgeId)) {
      earnedBadges.add(badgeId);
      const badge = getBadgeById(badgeId);

      if (badge) {
        newBadgeUnlocks.push(badge);
      }
    }
  });

  const nextGamification = normalizeGamificationState({
    ...gamification,
    earnedBadges: Array.from(earnedBadges),
    perfectDayBonusDates: perfectDayBonusDate
      ? nextPerfectDayBonusDates
      : gamification.perfectDayBonusDates,
    xp: nextXp,
  });
  const nextLevel = getGamificationLevelInfo(nextGamification).level;
  const nextMessages = [...messages];
  const newAchievements = [];

  if (xpToAdd > 0 && nextLevel > previousLevel) {
    nextMessages.push(`Level up! You reached level ${nextLevel}.`);
    newAchievements.push(
      createAchievement({
        description: `Reached level ${nextLevel} and advanced your rank progress.`,
        idParts: ["award", "level", nextLevel, completionDate],
        now,
        title: `Level ${nextLevel}`,
        type: "level",
      })
    );
  }

  newBadgeUnlocks.forEach((badge) => {
    nextMessages.push(`Badge unlocked: ${badge.label}.`);
    newAchievements.push(
      createAchievement({
        badgeId: badge.id,
        description: `${badge.rarity} ${badge.tier} badge unlocked.`,
        idParts: ["award", "badge", badge.id, completionDate],
        now,
        title: badge.label,
        type: "badge",
      })
    );
  });

  if (perfectDayBonusDate) {
    newAchievements.push(
      createAchievement({
        description: `Every habit completed. +${PERFECT_DAY_BONUS_XP} bonus XP.`,
        idParts: ["award", "perfect-day", perfectDayBonusDate],
        now,
        title: "Perfect Day",
        type: "perfect-day",
      })
    );
  }

  getNewThemeUnlocks(previousLevel, nextLevel).forEach((theme) => {
    newAchievements.push(
      createAchievement({
        description: `${theme.label} theme unlocked at level ${theme.unlockLevel}.`,
        idParts: ["award", "theme", theme.key, completionDate],
        now,
        themeKey: theme.key,
        title: `${theme.label} Theme`,
        type: "theme",
      })
    );
  });

  nextGamification.recentAchievements = [
    ...newAchievements,
    ...nextGamification.recentAchievements,
  ].slice(0, 20);

  nextGamification.pendingMessages = [
    ...nextGamification.pendingMessages,
    ...nextMessages.map((text, index) => {
      const unlockedBadge = newBadgeUnlocks.find(
        (badge) => text === `Badge unlocked: ${badge.label}.`
      );

      return {
        badgeId: unlockedBadge?.id,
        id: createRewardId(["award-message", index, text, completionDate, now]),
        text,
        type: unlockedBadge ? "badge" : "message",
      };
    }),
  ];

  return {
    achievements: newAchievements,
    badgeUnlocks: newBadgeUnlocks,
    gamification: normalizeGamificationState(nextGamification),
    messages: nextMessages,
    perfectDay: newAchievements.find(
      (achievement) => achievement.type === "perfect-day"
    ),
    themeUnlocks: newAchievements.filter(
      (achievement) => achievement.type === "theme"
    ),
  };
}

export function getGamificationLevelInfo(gamification) {
  const xp = Math.max(0, gamification?.xp || 0);
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXp = xp % XP_PER_LEVEL;
  const nextLevelXp = XP_PER_LEVEL - currentLevelXp;

  return {
    currentLevelXp,
    level,
    nextLevelXp,
    xp,
  };
}

export function getRankForLevel(level) {
  if (level >= 40) {
    return "Master";
  }

  if (level >= 25) {
    return "Diamond";
  }

  if (level >= 15) {
    return "Platinum";
  }

  if (level >= 10) {
    return "Gold";
  }

  if (level >= 5) {
    return "Silver";
  }

  return "Bronze";
}

export function getBadgeById(badgeId) {
  return badges.find((badge) => badge.id === badgeId) || null;
}

export function getNewThemeUnlocks(previousLevel, nextLevel) {
  return rankThemes.filter(
    (theme) => previousLevel < theme.unlockLevel && nextLevel >= theme.unlockLevel
  );
}

export function getEarnedBadgeIds({ habits, perfectDayBonusDates, xp }) {
  const safeHabits = getSafeHabits(habits);
  const earnedBadges = new Set();
  const completionCount = getCompletionCount(safeHabits);
  const longestStreak = safeHabits.reduce(
    (longest, habit) =>
      Math.max(
        longest,
        getCurrentStreak(getCompletedDates(habit), habit),
        getBestStreak(getCompletedDates(habit), habit)
      ),
    0
  );
  const highestDailyCompletionCount = getHighestDailyCompletionCount(safeHabits);
  const level = Math.floor((xp || 0) / XP_PER_LEVEL) + 1;

  if (safeHabits.length > 0) {
    earnedBadges.add("first-habit-created");
  }

  if (completionCount > 0) {
    earnedBadges.add("first-completion");
  }

  if (perfectDayBonusDates.length > 0) {
    earnedBadges.add("first-perfect-day");
  }

  [
    [3, "three-day-streak"],
    [7, "seven-day-streak"],
    [14, "fourteen-day-streak"],
    [30, "thirty-day-streak"],
    [60, "sixty-day-streak"],
    [100, "one-hundred-day-streak"],
  ].forEach(([threshold, badgeId]) => {
    if (longestStreak >= threshold) {
      earnedBadges.add(badgeId);
    }
  });

  [
    [3, "three-habits-one-day"],
    [5, "five-habits-one-day"],
    [10, "ten-habits-one-day"],
  ].forEach(([threshold, badgeId]) => {
    if (highestDailyCompletionCount >= threshold) {
      earnedBadges.add(badgeId);
    }
  });

  [
    [10, "ten-total-completions"],
    [50, "fifty-total-completions"],
    [100, "one-hundred-total-completions"],
    [250, "two-fifty-total-completions"],
    [500, "five-hundred-total-completions"],
  ].forEach(([threshold, badgeId]) => {
    if (completionCount >= threshold) {
      earnedBadges.add(badgeId);
    }
  });

  [
    [5, "reach-level-five"],
    [10, "reach-level-ten"],
    [25, "reach-level-twenty-five"],
    [40, "reach-level-forty"],
  ].forEach(([threshold, badgeId]) => {
    if (level >= threshold) {
      earnedBadges.add(badgeId);
    }
  });

  [
    [5, "unlock-silver"],
    [10, "unlock-gold"],
    [15, "unlock-platinum"],
    [25, "unlock-diamond"],
    [40, "unlock-master"],
  ].forEach(([threshold, badgeId]) => {
    if (level >= threshold) {
      earnedBadges.add(badgeId);
    }
  });

  return Array.from(earnedBadges);
}

export function calculatePerfectDayBonusDates(habits) {
  const safeHabits = getSafeHabits(habits);

  if (safeHabits.length === 0) {
    return [];
  }

  const allCompletedDates = Array.from(
    new Set(safeHabits.flatMap((habit) => getCompletedDates(habit)))
  );

  return allCompletedDates
    .filter((dateKey) => {
      const scheduledHabits = safeHabits.filter((habit) =>
        isHabitScheduledOnDate(habit, dateKey)
      );

      return (
        scheduledHabits.length > 0 &&
        scheduledHabits.every((habit) =>
          getCompletedDates(habit).includes(dateKey)
        )
      );
    })
    .sort();
}

export function isPerfectDayForDate(habits, dateKey) {
  const safeHabits = getSafeHabits(habits);
  const scheduledHabits = safeHabits.filter((habit) =>
    isHabitScheduledOnDate(habit, dateKey)
  );

  return (
    scheduledHabits.length > 0 &&
    scheduledHabits.every((habit) => getCompletedDates(habit).includes(dateKey))
  );
}

function buildRecalculatedAchievements({
  newBadgeUnlocks,
  newPerfectDayDates,
  newThemeUnlocks,
  nextLevel,
  now,
  previousLevel,
}) {
  const achievements = [];

  if (newPerfectDayDates.length > 0) {
    achievements.push(
      createAchievement({
        description: `Perfect day history added. +${PERFECT_DAY_BONUS_XP} bonus XP counted.`,
        idParts: ["rebuild", "perfect-day", newPerfectDayDates.join(",")],
        now,
        title: "Perfect Day",
        type: "perfect-day",
      })
    );
  }

  if (nextLevel > previousLevel) {
    achievements.push(
      createAchievement({
        description: `Reached level ${nextLevel} after recalculating progress.`,
        idParts: ["rebuild", "level", nextLevel],
        now,
        title: `Level ${nextLevel}`,
        type: "level",
      })
    );
  }

  newThemeUnlocks.forEach((theme) => {
    achievements.push(
      createAchievement({
        description: `${theme.label} theme unlocked at level ${theme.unlockLevel}.`,
        idParts: ["rebuild", "theme", theme.key],
        now,
        themeKey: theme.key,
        title: `${theme.label} Theme`,
        type: "theme",
      })
    );
  });

  newBadgeUnlocks.forEach((badge) => {
    achievements.push(
      createAchievement({
        badgeId: badge.id,
        description: `${badge.rarity} ${badge.tier} badge unlocked.`,
        idParts: ["rebuild", "badge", badge.id],
        now,
        title: badge.label,
        type: "badge",
      })
    );
  });

  return achievements;
}

function buildRecalculatedMessages({
  newBadgeUnlocks,
  newPerfectDayDates,
  newThemeUnlocks,
  nextLevel,
  now,
  previousLevel,
}) {
  const messages = [];

  if (newPerfectDayDates.length > 0) {
    messages.push(
      createPendingMessage({
        idParts: ["rebuild-message", "perfect-day", newPerfectDayDates.join(",")],
        now,
        text: "Perfect day unlocked from updated habit history.",
        type: "perfect-day",
      })
    );
  }

  if (nextLevel > previousLevel) {
    messages.push(
      createPendingMessage({
        idParts: ["rebuild-message", "level", nextLevel],
        level: nextLevel,
        now,
        text: `Level up! You reached level ${nextLevel}.`,
        type: "level",
      })
    );
  }

  newThemeUnlocks.forEach((theme) => {
    messages.push(
      createPendingMessage({
        idParts: ["rebuild-message", "theme", theme.key],
        now,
        text: `${theme.label} theme unlocked.`,
        themeKey: theme.key,
        type: "theme",
      })
    );
  });

  newBadgeUnlocks.forEach((badge) => {
    messages.push(
      createPendingMessage({
        badgeId: badge.id,
        idParts: ["rebuild-message", "badge", badge.id],
        now,
        text: `Badge unlocked: ${badge.label}.`,
        type: "badge",
      })
    );
  });

  return messages;
}

function createAchievement({
  badgeId,
  description,
  idParts,
  now,
  themeKey,
  title,
  type,
}) {
  return {
    badgeId,
    description,
    id: createRewardId(idParts),
    themeKey,
    title,
    type,
    unlockedAt: now,
  };
}

function createPendingMessage({
  badgeId,
  idParts,
  level,
  now,
  text,
  themeKey,
  type = "message",
}) {
  return {
    badgeId,
    id: createRewardId([...idParts, now]),
    level,
    text,
    themeKey,
    type,
  };
}

function getCompletionCount(habits) {
  return getSafeHabits(habits).reduce(
    (count, habit) => count + getCompletedDates(habit).length,
    0
  );
}

function getHighestDailyCompletionCount(habits) {
  const countsByDate = {};

  getSafeHabits(habits).forEach((habit) => {
    getCompletedDates(habit).forEach((dateKey) => {
      countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1;
    });
  });

  return Math.max(0, ...Object.values(countsByDate));
}

function getSafeHabits(habits) {
  return Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
}

function getCompletedDates(habit) {
  if (!Array.isArray(habit?.completedDates)) {
    return [];
  }

  return getSafeDateKeys(habit.completedDates);
}

function getSafeDateKeys(dateKeys) {
  if (!Array.isArray(dateKeys)) {
    return [];
  }

  return getUniqueStrings(
    dateKeys.filter(
      (dateKey) => typeof dateKey === "string" && isValidDateKey(dateKey)
    )
  ).sort();
}

function getUniqueStrings(values) {
  return Array.from(
    new Set(
      Array.isArray(values)
        ? values.filter((value) => typeof value === "string")
        : []
    )
  );
}

function getUniqueObjectsById(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const seenIds = new Set();
  const uniqueObjects = [];

  values.filter(isPlainObject).forEach((value) => {
    if (typeof value.id !== "string" || seenIds.has(value.id)) {
      return;
    }

    seenIds.add(value.id);
    uniqueObjects.push(value);
  });

  return uniqueObjects;
}

function createRewardId(parts) {
  return parts
    .filter((part) => part !== undefined && part !== null && part !== "")
    .join(":")
    .replace(/[^a-zA-Z0-9:_-]/g, "-");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
