import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTodayKey } from "../utils/habitStats";
import {
  PERFECT_DAY_BONUS_XP,
  XP_PER_COMPLETION,
  XP_PER_LEVEL,
  badges,
  calculateAwardState,
  calculateGamificationState,
  getBadgeById,
  getGamificationLevelInfo,
  getRankForLevel,
  isPerfectDayForDate,
  normalizeGamificationState,
  rankMilestones,
} from "../utils/gamification";
import { isPlainObject, logStorageError } from "./storageUtils";

const GAMIFICATION_KEY = "habit-tracker:gamification";

export {
  XP_PER_LEVEL,
  badges,
  calculateGamificationState,
  getBadgeById,
  getGamificationLevelInfo,
  getRankForLevel,
  normalizeGamificationState,
  rankMilestones,
};

export async function getGamification() {
  try {
    const rawData = await AsyncStorage.getItem(GAMIFICATION_KEY);

    if (!rawData) {
      return normalizeGamificationState();
    }

    try {
      const parsedData = JSON.parse(rawData);

      return normalizeGamificationState(
        isPlainObject(parsedData) ? parsedData : {}
      );
    } catch (error) {
      logStorageError("Could not parse gamification data.", error);
      return normalizeGamificationState();
    }
  } catch (error) {
    logStorageError("Could not read gamification data.", error);
    return normalizeGamificationState();
  }
}

export async function resetGamification() {
  try {
    await AsyncStorage.removeItem(GAMIFICATION_KEY);
  } catch (error) {
    logStorageError("Could not reset gamification data.", error);
    throw error;
  }
}

export async function rebuildGamificationFromHabits(
  habits,
  { includeMessage = true } = {}
) {
  const previousState = await getGamification();
  const result = calculateGamificationState({
    habits,
    includeMessage,
    previousState,
  });

  await saveGamification(result.state);

  return result.state;
}

export async function consumeGamificationMessages() {
  const gamification = await getGamification();
  const messages = gamification.pendingMessages;

  if (messages.length > 0) {
    await saveGamification({
      ...gamification,
      pendingMessages: [],
    });
  }

  return messages;
}

export async function awardHabitCreatedBadge() {
  const gamification = await getGamification();
  const result = calculateAwardState({
    badgesToAdd: ["first-habit-created"],
    previousState: gamification,
  });

  await saveGamification(result.gamification);

  return result;
}

export async function awardHabitCompletion({ completedHabit, habits }) {
  const gamification = await getGamification();
  const todayKey = getTodayKey();
  const habitName = completedHabit?.name || "habit";
  const completedAllToday = isPerfectDayForDate(habits, todayKey);
  const perfectDayAlreadyAwarded =
    gamification.perfectDayBonusDates.includes(todayKey);
  const perfectDayBonusDate =
    completedAllToday && !perfectDayAlreadyAwarded ? todayKey : null;
  const messages = [`+${XP_PER_COMPLETION} XP for completing ${habitName}.`];

  if (perfectDayBonusDate) {
    messages.push(`Perfect day! +${PERFECT_DAY_BONUS_XP} bonus XP.`);
  }

  const result = calculateAwardState({
    completedHabit,
    habits,
    messages,
    perfectDayBonusDate,
    previousState: gamification,
    todayKey,
    xpToAdd:
      XP_PER_COMPLETION + (perfectDayBonusDate ? PERFECT_DAY_BONUS_XP : 0),
  });

  await saveGamification(result.gamification);

  return result;
}

async function saveGamification(gamification) {
  try {
    await AsyncStorage.setItem(
      GAMIFICATION_KEY,
      JSON.stringify(normalizeGamificationState(gamification))
    );
  } catch (error) {
    logStorageError("Could not save gamification data.", error);
    throw error;
  }
}
