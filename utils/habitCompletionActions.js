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
import { wasCompletedToday } from "./habitStats";

const habitActionQueues = new Map();

export function completeHabitTodayWithRewards(habitId) {
  return enqueueHabitAction(habitId, () => completeHabit(habitId));
}

export function undoHabitTodayWithRewards(habitId) {
  return enqueueHabitAction(habitId, () => undoHabit(habitId));
}

async function completeHabit(habitId) {
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

async function undoHabit(habitId) {
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

  return {
    changed: true,
    gamification,
    habit: updatedHabit,
    habits: nextHabits,
    reason: "undone",
  };
}

function enqueueHabitAction(habitId, action) {
  const queueKey = typeof habitId === "string" ? habitId : "";
  const previousAction = habitActionQueues.get(queueKey) || Promise.resolve();
  const nextAction = previousAction.catch(() => {}).then(action);

  habitActionQueues.set(queueKey, nextAction);

  return nextAction.finally(() => {
    if (habitActionQueues.get(queueKey) === nextAction) {
      habitActionQueues.delete(queueKey);
    }
  });
}
