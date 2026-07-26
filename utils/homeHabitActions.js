import {
  getBadgeById,
  getGamificationLevelInfo,
  getRankForLevel,
  rankThemes,
} from "./gamification";
import { getCurrentStreak, wasCompletedToday } from "./habitStats";

export function getVisibleHomeHabits(habits, moveCompletedToBottom = false) {
  const orderedHabits = getOrderedHabits(habits);

  if (!moveCompletedToBottom) {
    return orderedHabits;
  }

  return orderedHabits.sort((firstHabit, secondHabit) => {
    const firstCompleted = wasCompletedToday(firstHabit);
    const secondCompleted = wasCompletedToday(secondHabit);

    if (firstCompleted === secondCompleted) {
      return compareHabitOrder(firstHabit, secondHabit);
    }

    return firstCompleted ? 1 : -1;
  });
}

export function getHomeSummary(habits, gamification) {
  const safeHabits = getSafeHabits(habits);
  const completedTodayCount = safeHabits.filter(wasCompletedToday).length;
  const completionPercentage =
    safeHabits.length === 0
      ? 0
      : Math.round((completedTodayCount / safeHabits.length) * 100);
  const levelInfo = getGamificationLevelInfo(gamification);

  return {
    completedTodayCount,
    completionLabel:
      safeHabits.length === 0 ? "0%" : `${completionPercentage}%`,
    completionPercentage,
    habitsSectionMessage: getTodayHabitsMessage(completionPercentage),
    levelInfo,
    longestCurrentStreak: safeHabits.reduce(
      (longest, habit) =>
        Math.max(longest, getCurrentStreak(habit.completedDates, habit)),
      0
    ),
    motivation: getProgressMessage(completionPercentage, safeHabits.length),
    rank: getRankForLevel(levelInfo.level),
    todayXp: getTodayXp(safeHabits),
  };
}

export function getQueuedRewardsFromMessages(messages, gamification, preferences) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const levelInfo = getGamificationLevelInfo(gamification);
  const dedupedMessages = dedupeMessages(safeMessages);
  const levelMessage = dedupedMessages.find((message) => message.type === "level");
  const themeMessage = dedupedMessages.find((message) => message.type === "theme");
  const perfectDayMessage = dedupedMessages.find(
    (message) => message.type === "perfect-day"
  );
  const badgeMessage = dedupedMessages.find((message) => message.type === "badge");
  const textMessages = dedupedMessages.filter(
    (message) => message.type === "message"
  );
  const queuedLevel = levelMessage?.level || levelInfo.level;

  return {
    badgeUnlock:
      preferences.showBadgePopups && badgeMessage?.badgeId
        ? getBadgeById(badgeMessage.badgeId)
        : null,
    celebration: textMessages.map((message) => message.text).join(" "),
    levelUp:
      preferences.showLevelUpPopup && levelMessage
        ? {
            level: queuedLevel,
            progress: (levelInfo.currentLevelXp / 100) * 100,
            rank: getRankForLevel(queuedLevel),
            themeUnlock: getThemeUnlockForLevel(queuedLevel),
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
    themeUnlock:
      preferences.showLevelUpPopup && themeMessage
        ? {
            themeKey: themeMessage.themeKey,
            title: `${getThemeUnlockLabel(themeMessage)} Theme`,
            type: "theme",
          }
        : null,
  };
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

export function getProgressMessage(percentage, habitCount) {
  if (habitCount === 0) {
    return "Add one habit to start today with momentum.";
  }

  if (percentage === 100) {
    return "Perfect day. You cleared every habit.";
  }

  if (percentage >= 70) {
    return "Strong progress. Keep the streak alive.";
  }

  if (percentage >= 35) {
    return "You are moving. One more check-in helps.";
  }

  return "Start small. Complete the easiest habit first.";
}

export function getTodayHabitsMessage(percentage) {
  if (percentage === 0) {
    return "Start strong today.";
  }

  if (percentage < 50) {
    return "Keep building momentum.";
  }

  if (percentage < 100) {
    return "Almost there.";
  }

  return "Perfect day complete.";
}

export function getThemeUnlockForLevel(level) {
  return rankThemes.find((theme) => theme.unlockLevel === level);
}

function getOrderedHabits(habits) {
  return getSafeHabits(habits).sort(compareHabitOrder);
}

function compareHabitOrder(firstHabit, secondHabit) {
  const firstOrder = Number.isFinite(firstHabit.order)
    ? firstHabit.order
    : Number.MAX_SAFE_INTEGER;
  const secondOrder = Number.isFinite(secondHabit.order)
    ? secondHabit.order
    : Number.MAX_SAFE_INTEGER;

  if (firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  return String(firstHabit.id || "").localeCompare(String(secondHabit.id || ""));
}

function getTodayXp(habits) {
  const completedToday = habits.filter(wasCompletedToday).length;
  const hasPerfectDay =
    habits.length > 0 && habits.every((habit) => wasCompletedToday(habit));

  return completedToday * 10 + (hasPerfectDay ? 25 : 0);
}

function dedupeMessages(messages) {
  const seenIds = new Set();

  return messages.filter((message, index) => {
    if (!message || typeof message !== "object") {
      return false;
    }

    const messageId = message.id || `${message.type}-${message.text}-${index}`;

    if (seenIds.has(messageId)) {
      return false;
    }

    seenIds.add(messageId);

    return true;
  });
}

function getThemeUnlockLabel(achievement) {
  const theme = rankThemes.find((item) => item.key === achievement?.themeKey);

  return theme?.label || achievement?.title?.replace(" Theme", "") || "New";
}

function getSafeHabits(habits) {
  return Array.isArray(habits)
    ? habits.filter((habit) => habit && typeof habit === "object")
    : [];
}
