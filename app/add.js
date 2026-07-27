import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import HabitFormFields from "../components/HabitFormFields";
import HabitFormScreen, {
  HabitFormHeader,
  habitFormSharedStyles,
} from "../components/HabitFormScreen";
import { AppText } from "../components/ui";
import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_EMOJI,
  DEFAULT_HABIT_FREQUENCY,
} from "../constants/habitOptions";
import {
  v2FontWeight,
  v2Layout,
  v2Radius,
  v2Shadows,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { parseReminderTime } from "../notifications/habitNotifications";
import { awardHabitCreatedBadge } from "../storage/gamificationStorage";
import { addHabit } from "../storage/habitsStorage";

export default function AddHabitScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_HABIT_EMOJI);
  const [category, setCategory] = useState(DEFAULT_HABIT_CATEGORY);
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);
  const [frequency, setFrequency] = useState(DEFAULT_HABIT_FREQUENCY);
  const [customDays, setCustomDays] = useState([]);
  const [reminderTime, setReminderTime] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const hasUnsavedInput =
    name.trim() ||
    emoji !== DEFAULT_HABIT_EMOJI ||
    category !== DEFAULT_HABIT_CATEGORY ||
    color !== DEFAULT_HABIT_COLOR ||
    frequency !== DEFAULT_HABIT_FREQUENCY ||
    customDays.length > 0 ||
    reminderTime.trim();

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

  async function handleSave() {
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

  return (
    <HabitFormScreen
      error={error}
      footer={
        <Pressable
          accessibilityLabel="Save habit"
          accessibilityRole="button"
          disabled={saving}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            pressed && !saving && styles.buttonPressed,
          ]}
        >
          <AppText style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save habit"}
          </AppText>
        </Pressable>
      }
      header={
        <HabitFormHeader
          eyebrow="New Habit"
          subtitle="Choose one promise you can repeat tomorrow."
          title="Create a habit"
        />
      }
      topBar={
        <Pressable
          accessibilityLabel="Cancel creating habit"
          accessibilityRole="button"
          hitSlop={10}
          onPress={handleCancel}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <AppText style={styles.cancelButtonText}>Cancel</AppText>
        </Pressable>
      }
    >
      <HabitFormFields
        autoFocus
        category={category}
        color={color}
        customDays={customDays}
        emoji={emoji}
        frequency={frequency}
        name={name}
        onNameChange={() => setError("")}
        reminderTime={reminderTime}
        setCategory={setCategory}
        setColor={setColor}
        setCustomDays={setCustomDays}
        setEmoji={setEmoji}
        setFrequency={setFrequency}
        setName={setName}
        setReminderTime={setReminderTime}
      />
    </HabitFormScreen>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  cancelButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    justifyContent: "center",
    marginLeft: "auto",
    minHeight: v2Layout.minTapTarget,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: colors.text,
    ...v2Typography.button,
    fontWeight: v2FontWeight.bold,
  },
  saveButton: {
    ...habitFormSharedStyles.actionButton,
    backgroundColor: colors.primary,
    ...v2Shadows.low,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  saveButtonText: {
    color: colors.inverseText,
    ...v2Typography.button,
    fontWeight: v2FontWeight.bold,
  },
  });
}
