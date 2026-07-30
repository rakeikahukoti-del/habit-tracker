import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_EMOJI,
  DEFAULT_HABIT_FREQUENCY,
  categoryOptions,
  frequencyOptions,
  habitColorOptions,
  weekDayOptions,
} from "../constants/habitOptions";

const DEFAULT_DRAFT = {
  category: DEFAULT_HABIT_CATEGORY,
  color: DEFAULT_HABIT_COLOR,
  customDays: [],
  emoji: DEFAULT_HABIT_EMOJI,
  frequency: DEFAULT_HABIT_FREQUENCY,
  name: "",
  reminderTime: "",
};

export const builtInHabitTemplates = [
  template("morning-drink-water", "Drink water", "Morning", {
    category: "Health",
    color: "#4F8F86",
    description: "Start the day with a simple hydration habit.",
    emoji: "💧",
    order: 10,
  }),
  template("morning-make-bed", "Make the bed", "Morning", {
    category: "Home",
    color: "#5A6F9F",
    description: "Reset your space before the day starts.",
    emoji: "✨",
    order: 20,
  }),
  template("morning-stretch", "Morning stretch", "Morning", {
    category: "Fitness",
    color: "#A77D43",
    description: "A short mobility habit for the morning.",
    emoji: "💪",
    order: 30,
  }),
  template("morning-plan-day", "Plan the day", "Morning", {
    category: "Work",
    color: "#5A6F9F",
    description: "Choose the few things that matter today.",
    emoji: "🎯",
    order: 40,
  }),
  template("health-walk", "Walk", "Health", {
    category: "Fitness",
    color: "#5C8B67",
    description: "Add a simple movement habit.",
    emoji: "💪",
    order: 50,
  }),
  template("health-workout", "Workout", "Health", {
    category: "Fitness",
    color: "#4F829D",
    description: "Track planned training days.",
    emoji: "💪",
    order: 60,
  }),
  template("health-medication", "Take medication", "Health", {
    category: "Health",
    color: "#4F8F86",
    description: "A personal reminder habit for your own routine.",
    emoji: "✨",
    order: 70,
  }),
  template("health-eat-fruit", "Eat fruit", "Health", {
    category: "Health",
    color: "#5C8B67",
    description: "Track one simple food habit.",
    emoji: "🌱",
    order: 80,
  }),
  template("health-prepare-lunch", "Prepare lunch", "Health", {
    category: "Home",
    color: "#A77D43",
    description: "Prepare tomorrow's food without overthinking it.",
    emoji: "✨",
    order: 90,
  }),
  template("focus-study", "Study", "Focus", {
    category: "Learning",
    color: "#5A6F9F",
    description: "Set aside time to learn or revise.",
    emoji: "📚",
    order: 100,
  }),
  template("focus-read", "Read", "Focus", {
    category: "Learning",
    color: "#A77D43",
    description: "Build a steady reading rhythm.",
    emoji: "📚",
    order: 110,
  }),
  template("focus-deep-work", "Deep work", "Focus", {
    category: "Work",
    color: "#4F829D",
    description: "Protect one focused work block.",
    emoji: "⚡",
    frequency: "Weekdays",
    order: 120,
  }),
  template("focus-review-notes", "Review notes", "Focus", {
    category: "Learning",
    color: "#5A6F9F",
    description: "Revisit what you learned recently.",
    emoji: "📚",
    frequency: "Weekdays",
    order: 130,
  }),
  template("evening-prepare-tomorrow", "Prepare for tomorrow", "Evening", {
    category: "Home",
    color: "#5A6F9F",
    description: "Make tomorrow easier before the day ends.",
    emoji: "🎯",
    order: 140,
  }),
  template("evening-journal", "Journal", "Evening", {
    category: "Mind",
    color: "#9F5F7C",
    description: "Capture a few thoughts from the day.",
    emoji: "🧘",
    order: 150,
  }),
  template("evening-tidy-room", "Tidy room", "Evening", {
    category: "Home",
    color: "#5C8B67",
    description: "Clean one small area.",
    emoji: "✨",
    order: 160,
  }),
  template("evening-screen-free", "Screen-free wind-down", "Evening", {
    category: "Mind",
    color: "#9F5F7C",
    description: "Create a calmer end to the day.",
    emoji: "🧘",
    order: 170,
  }),
  template("personal-practise-skill", "Practise a skill", "Personal", {
    category: "Learning",
    color: "#A77D43",
    description: "Repeat a skill often enough to improve.",
    emoji: "🎯",
    order: 180,
  }),
  template("personal-call-family", "Call family", "Personal", {
    category: "Mind",
    color: "#4F8F86",
    description: "Keep an important connection active.",
    emoji: "✨",
    frequency: "Custom",
    customDays: ["Sun"],
    order: 190,
  }),
  template("personal-track-spending", "Track spending", "Personal", {
    category: "Finance",
    color: "#5A6F9F",
    description: "Review what you spent today.",
    emoji: "🎯",
    order: 200,
  }),
  template("personal-clean-area", "Clean one area", "Personal", {
    category: "Home",
    color: "#5C8B67",
    description: "Pick one small area and reset it.",
    emoji: "✨",
    order: 210,
  }),
];

export const builtInRoutines = [
  routine("routine-morning-reset", "Morning Reset", [
    "morning-drink-water",
    "morning-make-bed",
    "morning-stretch",
    "morning-plan-day",
  ], "Start with a simple four-habit reset."),
  routine("routine-study-session", "Study Session", [
    "focus-review-notes",
    "routine-focused-study",
    "routine-short-recap",
  ], "Create a lightweight study rhythm."),
  routine("routine-evening-reset", "Evening Reset", [
    "evening-tidy-room",
    "evening-prepare-tomorrow",
    "evening-journal",
  ], "Close the day with a short reset."),
  routine("routine-training-day", "Training Day", [
    "routine-warm-up",
    "health-workout",
    "routine-cool-down",
  ], "Track a simple training-day flow."),
];

const routineOnlyTemplates = [
  template("routine-focused-study", "Focused study", "Focus", {
    category: "Learning",
    color: "#5A6F9F",
    description: "One focused study block.",
    emoji: "📚",
    order: 1000,
  }),
  template("routine-short-recap", "Short recap", "Focus", {
    category: "Learning",
    color: "#A77D43",
    description: "Summarise what you covered.",
    emoji: "📚",
    order: 1010,
  }),
  template("routine-warm-up", "Warm up", "Health", {
    category: "Fitness",
    color: "#4F829D",
    description: "Prepare for your workout.",
    emoji: "💪",
    order: 1020,
  }),
  template("routine-cool-down", "Cool down", "Health", {
    category: "Fitness",
    color: "#4F829D",
    description: "Finish training with a simple reset.",
    emoji: "💪",
    order: 1030,
  }),
];

const allTemplateMap = new Map(
  [...builtInHabitTemplates, ...routineOnlyTemplates].map((item) => [
    item.id,
    item,
  ])
);

export const templateGroups = Array.from(
  new Set(builtInHabitTemplates.map((item) => item.group))
);

export function getTemplateById(templateId) {
  return allTemplateMap.get(templateId) || null;
}

export function getRoutineTemplates(routineId) {
  const selectedRoutine = builtInRoutines.find(
    (item) => item.id === routineId
  );

  if (!selectedRoutine) {
    return [];
  }

  return selectedRoutine.templateIds
    .map((templateId) => getTemplateById(templateId))
    .filter(Boolean);
}

export function createHabitDraftFromTemplate(templateDraft, defaults = {}) {
  const source = templateDraft && typeof templateDraft === "object"
    ? templateDraft
    : {};
  const base = { ...DEFAULT_DRAFT, ...defaults, ...source };

  return {
    category: normalizeCategory(base.category),
    color: normalizeColor(base.color),
    customDays: normalizeCustomDays(base.customDays),
    emoji: typeof base.emoji === "string" && base.emoji.trim()
      ? base.emoji.trim()
      : DEFAULT_HABIT_EMOJI,
    frequency: normalizeFrequency(base.frequency),
    name: typeof base.name === "string" ? base.name.trim() : "",
    reminderTime:
      source.reminderEnabled && typeof base.reminderTime === "string"
        ? base.reminderTime.trim()
        : "",
  };
}

export function createRoutineDrafts(routineId, defaults = {}) {
  return getRoutineTemplates(routineId).map((item) =>
    createHabitDraftFromTemplate(item, defaults)
  );
}

export function createRoutineHabitsFromSelection({
  defaults = {},
  selectedTemplateIds,
}) {
  const seenIds = new Set();

  return (Array.isArray(selectedTemplateIds) ? selectedTemplateIds : [])
    .filter((templateId) => {
      if (seenIds.has(templateId)) {
        return false;
      }

      seenIds.add(templateId);
      return true;
    })
    .map((templateId) => getTemplateById(templateId))
    .filter(Boolean)
    .map((item) => createHabitDraftFromTemplate(item, defaults));
}

export function findDuplicateHabitDraft(draft, existingHabits) {
  const normalizedDraft = getDuplicateKey(draft);

  return (Array.isArray(existingHabits) ? existingHabits : []).find(
    (habit) => getDuplicateKey(habit) === normalizedDraft
  ) || null;
}

export function normalizeDuplicateName(name) {
  return typeof name === "string"
    ? name.trim().replace(/\s+/g, " ").toLowerCase()
    : "";
}

function getDuplicateKey(value) {
  const frequency = normalizeFrequency(value?.frequency);
  const customDays = normalizeCustomDays(value?.customDays).join(",");

  return [
    normalizeDuplicateName(value?.name),
    frequency,
    frequency === "Custom" ? customDays : "",
  ].join("|");
}

function template(id, name, group, config = {}) {
  return {
    category: normalizeCategory(config.category),
    color: normalizeColor(config.color),
    customDays: normalizeCustomDays(config.customDays),
    description: config.description || "",
    emoji: config.emoji || DEFAULT_HABIT_EMOJI,
    frequency: normalizeFrequency(config.frequency),
    group,
    id,
    name,
    order: Number.isFinite(config.order) ? config.order : 0,
    reminderEnabled: Boolean(config.reminderEnabled),
    reminderTime:
      config.reminderEnabled && typeof config.reminderTime === "string"
        ? config.reminderTime
        : "",
  };
}

function routine(id, name, templateIds, description) {
  return {
    description,
    id,
    name,
    templateIds: [...templateIds],
  };
}

function normalizeCategory(category) {
  return categoryOptions.includes(category) ? category : DEFAULT_HABIT_CATEGORY;
}

function normalizeColor(color) {
  return habitColorOptions.includes(color) ? color : DEFAULT_HABIT_COLOR;
}

function normalizeFrequency(frequency) {
  return frequencyOptions.includes(frequency)
    ? frequency
    : DEFAULT_HABIT_FREQUENCY;
}

function normalizeCustomDays(customDays) {
  if (!Array.isArray(customDays)) {
    return [];
  }

  return Array.from(
    new Set(customDays.filter((day) => weekDayOptions.includes(day)))
  ).sort(
    (first, second) =>
      weekDayOptions.indexOf(first) - weekDayOptions.indexOf(second)
  );
}
