import {
  completeHabitTodayWithRewards,
  undoHabitTodayWithRewards,
} from "../utils/habitCompletionActions";
import { requestWidgetRefresh } from "./widgetRefresh";

export async function completeHabitFromWidget(habitId) {
  const result = await completeHabitTodayWithRewards(habitId);

  return {
    badgeUnlocks: result.award?.badgeUnlocks || [],
    changed: result.changed,
    habit: result.habit,
    level: result.gamification?.level,
    reason: result.reason,
    xp: result.gamification?.xp || 0,
  };
}

export async function undoHabitFromWidget(habitId) {
  const result = await undoHabitTodayWithRewards(habitId);

  return {
    changed: result.changed,
    habit: result.habit,
    level: result.gamification?.level,
    reason: result.reason,
    xp: result.gamification?.xp || 0,
  };
}

export async function refreshMomentumWidgets(reason = "manual", metadata = {}) {
  return requestWidgetRefresh(reason, metadata);
}
