import {
  PERFECT_DAY_BONUS_XP,
  XP_PER_LEVEL,
  getBadgeById,
  getGamificationLevelInfo,
  getRankForLevel,
} from "./gamification";
import {
  getCurrentStreak,
  getTodayKey,
  isHabitScheduledOnDate,
  wasCompletedToday,
} from "./habitStats";
import { sortHabitsForHome } from "./dailyPlanning";
import { getVisibleRank } from "./rankDisplay";
import { getWeeklyReview } from "./weeklyReview";

export function getVisibleHomeHabits(habits, moveCompletedToBottom = false) {
  return sortHabitsForHome(habits, moveCompletedToBottom);
}

export function getHomeSummary(habits, gamification) {
  const safeHabits = getSafeHabits(habits);
  const todayKey = getTodayKey();
  const scheduledTodayHabits = safeHabits.filter((habit) =>
    isHabitScheduledOnDate(habit, todayKey)
  );
  const scheduledTodayCount = scheduledTodayHabits.length;
  const completedTodayCount = scheduledTodayHabits.filter(wasCompletedToday).length;
  const completedAnyTodayCount = safeHabits.filter(wasCompletedToday).length;
  const completionPercentage =
    scheduledTodayCount === 0
      ? 0
      : Math.round((completedTodayCount / scheduledTodayCount) * 100);
  const levelInfo = getGamificationLevelInfo(gamification);
  const remainingTodayCount = Math.max(0, scheduledTodayCount - completedTodayCount);
  const weeklyReview = getWeeklyReview(safeHabits);
  const longestCurrentStreak = safeHabits.reduce(
    (longest, habit) =>
      Math.max(longest, getCurrentStreak(habit.completedDates, habit)),
    0
  );

  return {
    completedAnyTodayCount,
    completedTodayCount,
    completionLabel:
      scheduledTodayCount === 0 ? "No habits today" : `${completionPercentage}%`,
    completionPercentage,
    habitsSectionMessage: getTodayHabitsMessage({
      completedTodayCount,
      habitCount: safeHabits.length,
      remainingTodayCount,
      scheduledTodayCount,
    }),
    levelInfo,
    longestCurrentStreak,
    motivation: getProgressMessage({
      completedTodayCount,
      habitCount: safeHabits.length,
      longestCurrentStreak,
      remainingTodayCount,
      scheduledTodayCount,
    }),
    nextAction: getNextHomeAction({
      completedTodayCount,
      habitCount: safeHabits.length,
      longestCurrentStreak,
      remainingTodayCount,
      scheduledTodayCount,
    }),
    rank: getVisibleRank(getRankForLevel(levelInfo.level)),
    remainingTodayCount,
    scheduledTodayCount,
    todayCountLabel: getTodayCountLabel({
      completedTodayCount,
      habitCount: safeHabits.length,
      scheduledTodayCount,
    }),
    todayXp: getTodayXp(safeHabits),
    weeklyContext: weeklyReview.context,
  };
}

export function getQueuedRewardsFromMessages(
  messages,
  gamification,
  preferences = {}
) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const levelInfo = getGamificationLevelInfo(gamification);
  const dedupedMessages = dedupeMessages(safeMessages).map(
    normalizeLegacyRewardMessage
  );
  const levelMessage = dedupedMessages.find((message) => message.type === "level");
  const perfectDayMessage = dedupedMessages.find(
    (message) => message.type === "perfect-day"
  );
  const badgeUnlocks = preferences.showBadgePopups
    ? Array.from(
        new Set(
          dedupedMessages
            .filter((message) => message.type === "badge" && message.badgeId)
            .map((message) => message.badgeId)
        )
      )
        .map(getBadgeById)
        .filter(Boolean)
    : [];
  const textMessages = dedupedMessages.filter(
    (message) => message.type === "message"
  );
  const queuedLevel = levelMessage?.level || levelInfo.level;

  return {
    badgeUnlock: badgeUnlocks[0] || null,
    badgeUnlocks,
    celebration: textMessages.map((message) => message.text).join(" "),
    levelUp:
      preferences.showLevelUpPopup && levelMessage
        ? {
            level: queuedLevel,
            progress: (levelInfo.currentLevelXp / XP_PER_LEVEL) * 100,
            rank: getVisibleRank(getRankForLevel(queuedLevel)),
          }
        : null,
    perfectDay:
      preferences.showBadgePopups && perfectDayMessage
        ? {
            description: perfectDayMessage.text,
            title: "Perfect Day",
            type: "perfect-day",
          }
        : null,
  };
}

export function getActiveRewardType({
  badgeUnlock,
  celebration,
  completionReward,
  levelUp,
  perfectDay,
} = {}) {
  if (completionReward) {
    return "completion";
  }

  if (perfectDay) {
    return "perfect-day";
  }

  if (levelUp) {
    return "level-up";
  }

  if (badgeUnlock) {
    return "badge";
  }

  return celebration ? "celebration" : null;
}

export function getRewardAccessibilityAnnouncement(type, rewards = {}) {
  if (type === "completion" && rewards.completionReward) {
    const reward = rewards.completionReward;
    return `${reward.habitName} completed. ${reward.xpEarned} XP earned. ${reward.streak} day streak. Level progress ${reward.rankProgress} of ${XP_PER_LEVEL} XP.`;
  }

  if (type === "perfect-day" && rewards.perfectDay) {
    return `Perfect day. All scheduled habits are complete. ${PERFECT_DAY_BONUS_XP} bonus XP earned.`;
  }

  if (type === "level-up" && rewards.levelUp) {
    return `Level up. You reached level ${rewards.levelUp.level}, ${rewards.levelUp.rank} rank.`;
  }

  if (type === "badge" && rewards.badgeUnlock) {
    const badge = rewards.badgeUnlock;
    return `Achievement unlocked. ${badge.label}. ${badge.description}`;
  }

  if (type === "celebration" && rewards.celebration) {
    return rewards.celebration;
  }

  return "";
}

export function shouldShowConfetti(messages, preferences) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const hasLevelUp = safeMessages.some((message) =>
    String(message).includes("Level up")
  );
  const hasMajorBadge = safeMessages.some((message) => {
    const text = String(message);

    return (
      text.includes("7-Day Streak") ||
      text.includes("14-Day Streak") ||
      text.includes("30-Day Streak") ||
      text.includes("Perfect Day")
    );
  });

  return (
    (preferences.showLevelUpPopup && hasLevelUp) ||
    (preferences.showBadgePopups && hasMajorBadge)
  );
}

export function getProgressMessage({
  completedTodayCount,
  habitCount,
  longestCurrentStreak,
  remainingTodayCount,
  scheduledTodayCount,
}) {
  if (habitCount === 0) {
    return "Add one habit to start today with momentum.";
  }

  if (scheduledTodayCount === 0) {
    return "Nothing is scheduled today.";
  }

  if (remainingTodayCount === 0) {
    return "Today is complete.";
  }

  if (completedTodayCount === 0) {
    return longestCurrentStreak > 0
      ? "Complete one habit to keep progress moving."
      : "Choose one habit to begin today.";
  }

  if (remainingTodayCount === 1) {
    return "One habit remains today.";
  }

  return "Keep going with the next scheduled habit.";
}

export function getTodayHabitsMessage({
  completedTodayCount,
  habitCount,
  remainingTodayCount,
  scheduledTodayCount,
}) {
  if (habitCount === 0) {
    return "Add a habit to begin.";
  }

  if (scheduledTodayCount === 0) {
    return "No habits scheduled today.";
  }

  if (completedTodayCount === 0) {
    return "Start strong today.";
  }

  if (remainingTodayCount === 0) {
    return "Today is complete.";
  }

  return remainingTodayCount === 1
    ? "One habit left."
    : `${remainingTodayCount} habits left.`;
}

export function getNextHomeAction({
  completedTodayCount,
  habitCount,
  longestCurrentStreak,
  remainingTodayCount,
  scheduledTodayCount,
}) {
  if (habitCount === 0) {
    return "Add your first habit";
  }

  if (scheduledTodayCount === 0) {
    return "No habits scheduled today";
  }

  if (remainingTodayCount === 0) {
    return "Today is complete";
  }

  if (remainingTodayCount === 1) {
    return "Complete the final habit";
  }

  if (completedTodayCount === 0 && longestCurrentStreak > 0) {
    return "Continue the current streak";
  }

  return "Complete the next habit";
}

function getTodayCountLabel({
  completedTodayCount,
  habitCount,
  scheduledTodayCount,
}) {
  if (habitCount === 0) {
    return "No habits yet";
  }

  if (scheduledTodayCount === 0) {
    return "None today";
  }

  return `${completedTodayCount}/${scheduledTodayCount} today`;
}

function getTodayXp(habits) {
  const completedToday = habits.filter(wasCompletedToday).length;
  const hasPerfectDay =
    habits.length > 0 && habits.every((habit) => wasCompletedToday(habit));

  return completedToday * 10 + (hasPerfectDay ? 25 : 0);
}

function dedupeMessages(messages) {
  const seenIds = new Set();

  return messages.filter((message) => {
    if (!message || typeof message !== "object") {
      return false;
    }

    const messageId =
      message.id ||
      `${message.type}-${message.badgeId || ""}-${message.level || ""}-${
        message.text || ""
      }`;

    if (seenIds.has(messageId)) {
      return false;
    }

    seenIds.add(messageId);

    return true;
  });
}

function normalizeLegacyRewardMessage(message) {
  if (message.type !== "message" || typeof message.text !== "string") {
    return message;
  }

  if (message.text.startsWith("Level up!")) {
    const levelMatch = message.text.match(/level\s+(\d+)/i);

    return {
      ...message,
      level: levelMatch ? Number(levelMatch[1]) : undefined,
      type: "level",
    };
  }

  if (message.text.startsWith("Perfect day!")) {
    return {
      ...message,
      type: "perfect-day",
    };
  }

  return message;
}

function getSafeHabits(habits) {
  return Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
}
