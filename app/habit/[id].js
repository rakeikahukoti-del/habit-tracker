import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import HabitFormFields from "../../components/HabitFormFields";
import HabitFormScreen, {
  HabitFormHeader,
  habitFormSharedStyles,
} from "../../components/HabitFormScreen";
import HabitHistoryGrid from "../../components/HabitHistoryGrid";
import ProgressDots from "../../components/ProgressDots";
import { AppText, BackIcon, IconButton } from "../../components/ui";
import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_EMOJI,
  DEFAULT_HABIT_FREQUENCY,
} from "../../constants/habitOptions";
import {
  v2FontWeight,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../../src/design";
import { useTheme } from "../../context/ThemeContext";
import { parseReminderTime } from "../../notifications/habitNotifications";
import {
  deleteHabit,
  getHabits,
  normalizeHabit,
  updateHabit,
} from "../../storage/habitsStorage";
import {
  getBestStreak,
  getCurrentStreak,
  getWeeklyProgress,
  wasCompletedToday,
} from "../../utils/habitStats";

export default function HabitDetailsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const styles = createStyles(colors, { isSmallScreen });
  const { id } = useLocalSearchParams();
  const [habit, setHabit] = useState(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_HABIT_EMOJI);
  const [category, setCategory] = useState(DEFAULT_HABIT_CATEGORY);
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);
  const [frequency, setFrequency] = useState(DEFAULT_HABIT_FREQUENCY);
  const [customDays, setCustomDays] = useState([]);
  const [reminderTime, setReminderTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const deleteInProgressRef = useRef(false);
  const deletePendingRef = useRef(false);
  const historyUpdatingRef = useRef(false);
  const savingRef = useRef(false);

  const loadHabit = useCallback(async (isActive = () => true) => {
    try {
      setError("");
      const habits = await getHabits();
      const foundHabit = habits.find((item) => item.id === id);

      if (!isActive()) {
        return;
      }

      if (!foundHabit) {
        setHabit(null);
        return;
      }

      const safeHabit = normalizeHabit(foundHabit);

      setHabit(safeHabit);
      setName(safeHabit.name);
      setEmoji(safeHabit.emoji);
      setCategory(safeHabit.category);
      setColor(safeHabit.color);
      setFrequency(safeHabit.frequency);
      setCustomDays(safeHabit.customDays);
      setReminderTime(safeHabit.reminderTime);
    } catch {
      if (isActive()) {
        setHabit(null);
        setError("Could not load this habit. Please try again.");
      }
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      setLoading(true);
      loadHabit(() => isActive);

      return () => {
        isActive = false;
      };
    }, [loadHabit])
  );

  async function handleSave() {
    if (savingRef.current || !habit) {
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

    const updatedHabit = {
      ...habit,
      name: name.trim(),
      emoji,
      category,
      color,
      frequency,
      customDays,
      reminderTime: reminderTime.trim(),
    };

    savingRef.current = true;
    setSaving(true);

    try {
      const savedHabit = await updateHabit(updatedHabit);
      setHabit(savedHabit);
      router.back();
    } catch {
      setError("Could not save this habit. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function handleDelete() {
    if (deletePendingRef.current) {
      return;
    }

    deletePendingRef.current = true;

    Alert.alert(
      "Delete habit?",
      "This removes the habit and all of its progress.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            deletePendingRef.current = false;
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            deleteInProgressRef.current = true;

            try {
              await deleteHabit(id);
              router.replace("/");
            } catch {
              deleteInProgressRef.current = false;
              deletePendingRef.current = false;
              setError("Could not delete this habit. Please try again.");
            }
          },
        },
      ],
      {
        onDismiss: () => {
          if (!deleteInProgressRef.current) {
            deletePendingRef.current = false;
          }
        },
      }
    );
  }

  async function updateCompletedDates(nextCompletedDates) {
    if (historyUpdatingRef.current || !habit) {
      return;
    }

    historyUpdatingRef.current = true;

    try {
      setError("");
      const savedHabit = await updateHabit({
        ...habit,
        completedDates: getSortedUniqueDateKeys(nextCompletedDates),
      });

      setHabit(savedHabit);
    } catch {
      setError("Could not update completion history. Please try again.");
    } finally {
      historyUpdatingRef.current = false;
    }
  }

  function handleToggleHistoryDay(day) {
    const dateKey = day.dateKey;
    const hasCompletion = habit.completedDates.includes(dateKey);

    if (!hasCompletion) {
      updateCompletedDates([...habit.completedDates, dateKey]);
      return;
    }

    const nextCompletedDates = habit.completedDates.filter(
      (completedDate) => completedDate !== dateKey
    );

    updateCompletedDates(nextCompletedDates);
  }

  if (loading) {
    return (
      <HabitFormScreen>
        <View style={styles.missingContainer}>
          <AppText style={styles.missingTitle}>Loading habit...</AppText>
        </View>
      </HabitFormScreen>
    );
  }

  if (!habit) {
    return (
      <HabitFormScreen>
        <View style={styles.missingContainer}>
          <AppText style={styles.missingTitle}>Habit not found</AppText>
          <Pressable
            accessibilityLabel="Go Home"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.replace("/")}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <AppText style={styles.saveButtonText}>Go Home</AppText>
          </Pressable>
        </View>
      </HabitFormScreen>
    );
  }

  const currentStreak = getCurrentStreak(habit.completedDates, habit);
  const bestStreak = getBestStreak(habit.completedDates, habit);
  const weeklyProgress = getWeeklyProgress(habit);
  const completedToday = wasCompletedToday(habit);
  const icon = emoji || habit.emoji || DEFAULT_HABIT_EMOJI;

  return (
    <HabitFormScreen
      error={error}
      footer={
        <>
          <Pressable
            accessibilityLabel="Delete habit"
            accessibilityRole="button"
            hitSlop={6}
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <AppText style={styles.deleteButtonText}>Delete</AppText>
          </Pressable>

          <Pressable
            accessibilityLabel="Save habit changes"
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
              {saving ? "Saving..." : "Save"}
            </AppText>
          </Pressable>
        </>
      }
      header={
        <HabitFormHeader
          eyebrow="Edit Habit"
          icon={
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: color, borderColor: colors.border },
              ]}
            >
              <AppText style={styles.icon}>{icon}</AppText>
            </View>
          }
          title={habit.name}
        />
      }
      topBar={
        <IconButton
          accessibilityLabel="Back to Home"
          color={colors.text}
          onPress={() => router.replace("/")}
          style={styles.homeButton}
        >
          <BackIcon color={colors.text} />
        </IconButton>
      }
    >

          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <View>
                <AppText style={styles.cardLabel}>Today</AppText>
                <AppText style={styles.statusText}>
                  {completedToday ? "Complete" : "Open"}
                </AppText>
              </View>
              <ProgressDots days={weeklyProgress} compact />
            </View>

            <View style={styles.statsGrid}>
              <StatBlock label="Current streak" value={currentStreak} styles={styles} />
              <StatBlock label="Best streak" value={bestStreak} styles={styles} />
              <StatBlock
                label="Total completions"
                value={habit.completedDates.length}
                styles={styles}
              />
            </View>
          </View>

          <HabitHistoryGrid habit={habit} onToggleDate={handleToggleHistoryDay} />

          <View style={styles.form}>
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
            />
          </View>
    </HabitFormScreen>
  );
}

function StatBlock({ label, value, styles }) {
  return (
    <View style={styles.statBlock}>
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );
}

function getSortedUniqueDateKeys(dateKeys) {
  return Array.from(new Set(dateKeys)).sort();
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
  homeButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  iconBadge: {
    alignItems: "center",
    borderRadius: v2Radius.large,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  icon: {
    color: colors.text,
    fontSize: 31,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    marginBottom: 18,
    padding: isSmallScreen ? v2Spacing.lg : v2Spacing.xl,
    ...v2Shadows.low,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
  },
  statsHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "space-between",
    marginBottom: 18,
  },
  cardLabel: {
    color: colors.muted,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.medium,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  statusText: {
    color: colors.text,
    fontSize: v2Typography.sectionTitle.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBlock: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: v2Radius.medium,
    borderWidth: 1,
    flexBasis: isSmallScreen ? "100%" : "30%",
    flexGrow: 1,
    padding: 14,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: v2FontWeight.bold,
  },
  statLabel: {
    color: colors.muted,
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.medium,
    marginTop: 4,
  },
  form: {
    gap: v2Spacing.md,
  },
  deleteButton: {
    ...habitFormSharedStyles.actionButton,
    backgroundColor: colors.dangerSoft,
    borderColor: colors.border,
    borderWidth: 1,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  saveButton: {
    ...habitFormSharedStyles.actionButton,
    backgroundColor: colors.primary,
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
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  missingContainer: {
    flex: 1,
    gap: 18,
    justifyContent: "center",
    padding: 20,
  },
  missingTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: v2FontWeight.bold,
    textAlign: "center",
  },
  });
}
