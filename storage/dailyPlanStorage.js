import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTodayKey } from "../utils/habitStats";
import { normalizeDailyPlan } from "../utils/dailyPlanning";
import { requestWidgetRefresh } from "../widgets/widgetRefresh";
import { logStorageError } from "./storageUtils";

export const DAILY_PLAN_KEY = "momentum:daily-plan";

export async function getDailyPlan(habits, todayKey = getTodayKey()) {
  try {
    const rawPlan = await AsyncStorage.getItem(DAILY_PLAN_KEY);

    if (!rawPlan) {
      return normalizeDailyPlan(null, habits, todayKey);
    }

    try {
      return normalizeDailyPlan(JSON.parse(rawPlan), habits, todayKey);
    } catch (error) {
      logStorageError("Could not parse daily plan.", error);
      return normalizeDailyPlan(null, habits, todayKey);
    }
  } catch (error) {
    logStorageError("Could not read daily plan.", error);
    return normalizeDailyPlan(null, habits, todayKey);
  }
}

export async function saveDailyPlan(plan, habits, todayKey = getTodayKey()) {
  const normalizedPlan = normalizeDailyPlan(plan, habits, todayKey);

  try {
    await AsyncStorage.setItem(DAILY_PLAN_KEY, JSON.stringify(normalizedPlan));
    await requestWidgetRefresh("daily-plan-changed", {
      date: normalizedPlan.date,
    });
  } catch (error) {
    logStorageError("Could not save daily plan.", error);
    throw error;
  }

  return normalizedPlan;
}
