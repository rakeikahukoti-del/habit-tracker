import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import HabitFormFields from "../components/HabitFormFields";
import { DEFAULT_HABIT_COLOR } from "../constants/habitOptions";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  pageTitleLineHeight,
  pageTitleSize,
  radius,
  spacing,
} from "../constants/typography";
import { useTheme } from "../context/ThemeContext";
import { parseReminderTime } from "../notifications/habitNotifications";
import { awardHabitCreatedBadge } from "../storage/gamificationStorage";
import { addHabit } from "../storage/habitsStorage";

export default function AddHabitScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [category, setCategory] = useState("Health");
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);
  const [frequency, setFrequency] = useState("Daily");
  const [customDays, setCustomDays] = useState([]);
  const [reminderTime, setReminderTime] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const hasUnsavedInput =
    name.trim() ||
    emoji !== "✨" ||
    category !== "Health" ||
    color !== DEFAULT_HABIT_COLOR ||
    frequency !== "Daily" ||
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

    setSaving(true);

    try {
      await addHabit({
        name,
        emoji,
        category,
        color,
        frequency,
        customDays,
        reminderTime,
      });
      await awardHabitCreatedBadge();
      router.back();
    } catch {
      setError("Could not save this habit. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.eyebrow}>New habit</Text>
            <Text style={styles.title}>Create habit</Text>
            <Text style={styles.subtitle}>
              Pick something small enough to repeat tomorrow.
            </Text>
          </View>

          <HabitFormFields
            name={name}
            setName={setName}
            emoji={emoji}
            setEmoji={setEmoji}
            category={category}
            setCategory={setCategory}
            color={color}
            setColor={setColor}
            frequency={frequency}
            setFrequency={setFrequency}
            customDays={customDays}
            setCustomDays={setCustomDays}
            reminderTime={reminderTime}
            setReminderTime={setReminderTime}
            onNameChange={() => setError("")}
            autoFocus
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

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
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save habit"}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  scrollContent: {
    alignSelf: "center",
    maxWidth: isTablet ? layout.formMaxWidth : "100%",
    padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 6,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: layout.minTapTarget,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  header: {
    marginBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: pageTitleSize(isSmallScreen),
    fontWeight: fontWeight.bold,
    lineHeight: pageTitleLineHeight(isSmallScreen),
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.bodyLarge,
    marginTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    marginTop: spacing.md,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    justifyContent: "center",
    minHeight: 52,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: isSmallScreen
      ? layout.screenPaddingSmall
      : layout.screenPadding,
    marginHorizontal: isSmallScreen
      ? layout.screenPaddingSmall
      : layout.screenPadding,
    marginTop: 0,
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
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.bold,
  },
  });
}
