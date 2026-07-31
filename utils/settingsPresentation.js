import { getReminderPreview } from "../notifications/habitNotifications";

const confirmationCopy = {
  "demo-data": {
    confirmLabel: "Load demo data",
    message: "This replaces your current habits with sample habits for testing.",
    title: "Load demo data?",
  },
  "master-demo": {
    confirmLabel: "Load Master demo",
    message:
      "This replaces your current habits with a high-progress sample profile.",
    title: "Load Master demo?",
  },
  "reset-data": {
    confirmLabel: "Reset",
    message:
      "This permanently removes habits, history, progress, badges, and scheduled reminders from this device. Preferences stay unchanged.",
    title: "Reset all data?",
  },
  "reset-onboarding": {
    confirmLabel: "Reset onboarding",
    message: "Momentum will show onboarding again the next time the app starts.",
    title: "Reset onboarding?",
  },
  "reset-preferences": {
    confirmLabel: "Reset preferences",
    message:
      "This restores app preferences to their defaults. Habits and progress stay intact.",
    title: "Reset preferences?",
  },
};

export function getSettingsConfirmation(action) {
  return confirmationCopy[action] || null;
}

export function getSettingsRowAccessibilityLabel({
  description,
  title,
  value,
} = {}) {
  return [title, value, description].filter(Boolean).join(", ");
}

export function getNotificationPermissionLabel(state) {
  if (state === "granted") {
    return "Allowed";
  }

  if (state === "blocked") {
    return "Blocked";
  }

  if (state === "unavailable") {
    return "Unavailable";
  }

  return "Not asked";
}

export function getReminderSettingsSummary(habits) {
  const safeHabits = Array.isArray(habits) ? habits : [];
  const scheduledHabits = safeHabits.filter(
    (habit) => habit?.reminderStatus === "scheduled"
  );
  const notificationCount = scheduledHabits.reduce(
    (sum, habit) =>
      sum +
      (Array.isArray(habit.notificationIds) ? habit.notificationIds.length : 0),
    0
  );
  const nextPreview = scheduledHabits[0]
    ? getReminderPreview(scheduledHabits[0])
    : "";

  if (scheduledHabits.length === 0) {
    return {
      description: "Add a reminder time to a habit to schedule reminders.",
      value: "0",
    };
  }

  const habitCountLabel = `${scheduledHabits.length} habit reminder${
    scheduledHabits.length === 1 ? "" : "s"
  } enabled.`;

  return {
    description: nextPreview
      ? `${nextPreview}. ${habitCountLabel}`
      : habitCountLabel,
    value: String(notificationCount),
  };
}
