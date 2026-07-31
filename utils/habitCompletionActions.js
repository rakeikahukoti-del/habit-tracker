import {
  awardHabitCompletion,
  getGamification,
  rebuildGamificationFromHabits,
} from "../storage/gamificationStorage";
import {
  completeHabitForToday,
  getHabits,
  uncompleteHabitForToday,
} from "../storage/habitsStorage";
import { requestWidgetRefresh } from "../widgets/widgetRefresh";
import { wasCompletedToday } from "./habitStats";

export async function completeHabitTodayWithRewards(habitId) {
  const currentHabits = await getHabits();
  const currentHabit = currentHabits.find((habit) => habit.id === habitId);

  if (!currentHabit) {
    return {
      award: null,
      changed: false,
      gamification: await getGamification(),
      habit: null,
      habits: currentHabits,
      reason: "missing",
    };
  }

  if (wasCompletedToday(currentHabit)) {
    return {
      award: null,
      changed: false,
      gamification: await getGamification(),
      habit: currentHabit,
      habits: currentHabits,
      reason: "already-completed",
    };
  }

  const completedHabit = await completeHabitForToday(habitId);
  const nextHabits = await getHabits();
  const previousGamification = await getGamification();
  const award = await awardHabitCompletion({
    completedHabit,
    habits: nextHabits,
  });

  await requestWidgetRefresh("habit-completed", {
    changed: true,
    habitId,
  });

  return {
    award,
    changed: true,
    gamification: award.gamification,
    habit: completedHabit,
    habits: nextHabits,
    previousXp: previousGamification.xp || 0,
    reason: "completed",
  };
}

export async function undoHabitTodayWithRewards(habitId) {
  const currentHabits = await getHabits();
  const currentHabit = currentHabits.find((habit) => habit.id === habitId);

  if (!currentHabit) {
    return {
      changed: false,
      gamification: await getGamification(),
      habit: null,
      habits: currentHabits,
      reason: "missing",
    };
  }

  if (!wasCompletedToday(currentHabit)) {
    return {
      changed: false,
      gamification: await getGamification(),
      habit: currentHabit,
      habits: currentHabits,
      reason: "not-completed",
    };
  }

  const updatedHabit = await uncompleteHabitForToday(habitId);
  const nextHabits = await getHabits();
  const gamification = await rebuildGamificationFromHabits(nextHabits, {
    includeMessage: false,
  });

  await requestWidgetRefresh("habit-undone", {
    changed: true,
    habitId,
  });

  return {
    changed: true,
    gamification,
    habit: updatedHabit,
    habits: nextHabits,
    reason: "undone",
  };
}
