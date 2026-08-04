import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_EMOJI,
  DEFAULT_HABIT_FREQUENCY,
} from "../constants/habitOptions";
import { parseReminderTime } from "../notifications/habitNotifications";
import { awardHabitCreatedBadge } from "../storage/gamificationStorage";
import { addHabit, addHabitsFromDrafts, getHabits } from "../storage/habitsStorage";
import {
  builtInHabitTemplates,
  builtInRoutines,
  createHabitDraftFromTemplate,
  createRoutineHabitsFromSelection,
  findDuplicateHabitDraft,
  getRoutineTemplates,
} from "../utils/habitTemplates";

export function useAddHabitController() {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_HABIT_EMOJI);
  const [category, setCategory] = useState(DEFAULT_HABIT_CATEGORY);
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);
  const [frequency, setFrequency] = useState(DEFAULT_HABIT_FREQUENCY);
  const [customDays, setCustomDays] = useState([]);
  const [reminderTime, setReminderTime] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [existingHabits, setExistingHabits] = useState([]);
  const [pickerMode, setPickerMode] = useState(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState("All");
  const [selectedRoutineId, setSelectedRoutineId] = useState(
    builtInRoutines[0]?.id || ""
  );
  const [selectedRoutineTemplateIds, setSelectedRoutineTemplateIds] = useState(
    []
  );
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const routineSavingRef = useRef(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const hasUnsavedInput =
    name.trim() ||
    emoji !== DEFAULT_HABIT_EMOJI ||
    category !== DEFAULT_HABIT_CATEGORY ||
    color !== DEFAULT_HABIT_COLOR ||
    frequency !== DEFAULT_HABIT_FREQUENCY ||
    customDays.length > 0 ||
    reminderTime.trim();
  const filteredTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();

    return builtInHabitTemplates.filter((template) => {
      const matchesGroup =
        selectedTemplateGroup === "All" ||
        template.group === selectedTemplateGroup;
      const matchesSearch =
        !query ||
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query);

      return matchesGroup && matchesSearch;
    });
  }, [selectedTemplateGroup, templateSearch]);
  const selectedRoutine = useMemo(
    () => builtInRoutines.find((routine) => routine.id === selectedRoutineId),
    [selectedRoutineId]
  );
  const selectedRoutineTemplates = useMemo(
    () => getRoutineTemplates(selectedRoutineId),
    [selectedRoutineId]
  );
  const selectedRoutineDrafts = useMemo(
    () =>
      createRoutineHabitsFromSelection({
        selectedTemplateIds: selectedRoutineTemplateIds,
      }),
    [selectedRoutineTemplateIds]
  );
  const currentDuplicate = findDuplicateHabitDraft(
    { customDays, frequency, name },
    existingHabits
  );

  useEffect(() => {
    let isActive = true;

    async function loadExistingHabits() {
      const storedHabits = await getHabits();

      if (isActive) {
        setExistingHabits(storedHabits);
      }
    }

    loadExistingHabits();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setSelectedRoutineTemplateIds(
      selectedRoutineTemplates.map((template) => template.id)
    );
  }, [selectedRoutineTemplates]);

  function clearError() {
    if (error) {
      setError("");
    }

    if (message) {
      setMessage("");
    }

    if (duplicateConfirmed) {
      setDuplicateConfirmed(false);
    }
  }

  function openPicker(mode) {
    setPickerMode(mode);
    setMessage("");
  }

  function closePicker() {
    setPickerMode(null);
    setTemplateSearch("");
  }

  function applyTemplate(template) {
    const draft = createHabitDraftFromTemplate(template, {
      category,
      color,
      emoji,
      frequency,
    });

    setName(draft.name);
    setEmoji(draft.emoji);
    setCategory(draft.category);
    setColor(draft.color);
    setFrequency(draft.frequency);
    setCustomDays(draft.customDays);
    setReminderTime(draft.reminderTime);
    setDuplicateConfirmed(false);
    setError("");
    setMessage(`${template.name} template applied. Review before saving.`);
    closePicker();
  }

  function toggleRoutineTemplate(templateId) {
    setSelectedRoutineTemplateIds((current) =>
      current.includes(templateId)
        ? current.filter((id) => id !== templateId)
        : [...current, templateId]
    );
  }

  function handleCancel() {
    if (!hasUnsavedInput) {
      router.replace("/");
      return;
    }

    Alert.alert("Discard this habit?", "Your unsaved changes will be lost.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => router.replace("/"),
      },
    ]);
  }

  async function handleSave(allowDuplicate = false) {
    if (savingRef.current) {
      return;
    }

    if (!name.trim()) {
      setError("Habit name is required.");
      return;
    }

    if (reminderTime.trim() && !parseReminderTime(reminderTime)) {
      setError("Use 24-hour reminder time, like 08:30.");
      return;
    }

    if (frequency === "Custom" && customDays.length === 0) {
      setError("Choose at least one custom day.");
      return;
    }

    if (currentDuplicate && !duplicateConfirmed && !allowDuplicate) {
      Alert.alert(
        "Possible duplicate",
        `You already have a habit named "${currentDuplicate.name}".`,
        [
          { text: "Review", style: "cancel" },
          {
            text: "Add another anyway",
            onPress: () => {
              setDuplicateConfirmed(true);
              handleSave(true);
            },
          },
        ]
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const savedHabit = await addHabit({
        name,
        emoji,
        category,
        color,
        frequency,
        customDays,
        reminderTime,
      });

      try {
        await awardHabitCreatedBadge();
      } catch {
        // The habit is saved; reward recovery can happen during the next rebuild.
      }

      if (savedHabit) {
        router.replace("/");
      }
    } catch {
      setError("Could not save this habit. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleCreateRoutine() {
    if (routineSavingRef.current) {
      return;
    }

    if (selectedRoutineDrafts.length === 0) {
      setError("Select at least one habit from this routine.");
      return;
    }

    routineSavingRef.current = true;
    setSaving(true);
    setError("");

    try {
      await addHabitsFromDrafts(selectedRoutineDrafts);

      try {
        await awardHabitCreatedBadge();
      } catch {
        // Routine habits are saved; reward recovery can happen later.
      }

      router.replace("/");
    } catch {
      setError("Could not add this routine. Please try again.");
    } finally {
      routineSavingRef.current = false;
      setSaving(false);
    }
  }

  return {
    applyTemplate,
    category,
    clearError,
    closePicker,
    color,
    customDays,
    emoji,
    error,
    existingHabits,
    filteredTemplates,
    frequency,
    handleCancel,
    handleCreateRoutine,
    handleSave,
    message,
    name,
    openPicker,
    pickerMode,
    reminderTime,
    saving,
    selectedRoutine,
    selectedRoutineDrafts,
    selectedRoutineId,
    selectedRoutineTemplateIds,
    selectedRoutineTemplates,
    selectedTemplateGroup,
    setCategory,
    setColor,
    setCustomDays,
    setEmoji,
    setFrequency,
    setName,
    setReminderTime,
    setSelectedRoutineId,
    setSelectedTemplateGroup,
    setTemplateSearch,
    templateSearch,
    toggleRoutineTemplate,
  };
}
