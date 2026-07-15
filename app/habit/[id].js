import { useCallback, useState } from "react";
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
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import HabitFormFields from "../../components/HabitFormFields";
import HabitHistoryGrid from "../../components/HabitHistoryGrid";
import ProgressDots from "../../components/ProgressDots";
import { DEFAULT_HABIT_COLOR } from "../../constants/habitOptions";
import {
  fontSize,
  fontWeight,
  layout,
  pageTitleLineHeight,
  pageTitleSize,
  radius,
  spacing,
} from "../../constants/typography";
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
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
  const { id } = useLocalSearchParams();
  const [habit, setHabit] = useState(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [category, setCategory] = useState("Health");
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);
  const [frequency, setFrequency] = useState("Daily");
  const [customDays, setCustomDays] = useState([]);
  const [reminderTime, setReminderTime] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadHabit = useCallback(async () => {
    const habits = await getHabits();
    const foundHabit = habits.find((item) => item.id === id);

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
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadHabit();
    }, [loadHabit])
  );

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

    setSaving(true);

    try {
      const savedHabit = await updateHabit(updatedHabit);
      setHabit(savedHabit);
      router.back();
    } catch {
      setError("Could not save this habit. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      "Delete habit?",
      "This removes the habit and all of its progress.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteHabit(id);
              router.replace("/");
            } catch {
              setError("Could not delete this habit. Please try again.");
            }
          },
        },
      ]
    );
  }

  async function updateCompletedDates(nextCompletedDates) {
    try {
      setError("");
      const savedHabit = await updateHabit({
        ...habit,
        completedDates: getSortedUniqueDateKeys(nextCompletedDates),
      });

      setHabit(savedHabit);
    } catch {
      setError("Could not update completion history. Please try again.");
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

  if (!habit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.missingContainer}>
          <Text style={styles.missingTitle}>Habit not found</Text>
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
            <Text style={styles.saveButtonText}>Go Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentStreak = getCurrentStreak(habit.completedDates);
  const bestStreak = getBestStreak(habit.completedDates);
  const weeklyProgress = getWeeklyProgress(habit);
  const completedToday = wasCompletedToday(habit);
  const icon = emoji || habit.emoji || "✨";

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
          <View style={styles.topActions}>
            <Pressable
              accessibilityLabel="Back to Home"
              accessibilityRole="button"
              hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
              onPress={() => router.replace("/")}
              style={({ pressed }) => [
                styles.homeButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.homeButtonText}>← Home</Text>
            </Pressable>
          </View>

          <View style={styles.pageHeader}>
            <View style={[styles.iconBadge, { backgroundColor: color }]}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <View style={styles.pageHeaderText}>
              <Text style={styles.eyebrow}>Habit</Text>
              <Text style={styles.pageTitle} numberOfLines={2}>
                {habit.name}
              </Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <View>
                <Text style={styles.cardLabel}>Status</Text>
                <Text style={styles.statusText}>
                  {completedToday ? "Completed today" : "Open today"}
                </Text>
              </View>
              <ProgressDots days={weeklyProgress} compact />
            </View>

            <View style={styles.statsGrid}>
              <StatBlock
                label="Current"
                value={currentStreak}
                styles={styles}
              />
              <StatBlock label="Best" value={bestStreak} styles={styles} />
              <StatBlock
                label="Total"
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

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.actions}>
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
            <Text style={styles.deleteButtonText}>Delete</Text>
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
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StatBlock({ label, value, styles }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getSortedUniqueDateKeys(dateKeys) {
  return Array.from(new Set(dateKeys)).sort();
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    alignSelf: "center",
    maxWidth: isTablet ? layout.formMaxWidth : "100%",
    padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
    paddingBottom: 28,
    width: "100%",
  },
  pageHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  topActions: {
    alignItems: "flex-start",
    paddingTop: 6,
    zIndex: 3,
  },
  homeButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  homeButtonText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  iconBadge: {
    alignItems: "center",
    borderRadius: radius.xl,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  icon: {
    fontSize: 31,
  },
  pageHeaderText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  pageTitle: {
    color: colors.text,
    fontSize: pageTitleSize(isSmallScreen),
    fontWeight: fontWeight.bold,
    lineHeight: pageTitleLineHeight(isSmallScreen),
  },
  statsCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xxl,
    borderWidth: 1,
    marginBottom: spacing.xl,
    padding: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  statsHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cardLabel: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  statusText: {
    color: colors.text,
    fontSize: fontSize.section,
    fontWeight: fontWeight.bold,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBlock: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.lg,
    flexBasis: isSmallScreen ? "100%" : "30%",
    flexGrow: 1,
    padding: 14,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    marginTop: 4,
  },
  form: {
    gap: 10,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    marginTop: 4,
  },
  actions: {
    alignSelf: "center",
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    maxWidth: isTablet ? 760 : "100%",
    padding: 18,
    width: "100%",
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    flex: 1,
    minHeight: 50,
    justifyContent: "center",
    paddingVertical: 16,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.bold,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flex: 1,
    minHeight: 50,
    justifyContent: "center",
    paddingVertical: 16,
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
  missingContainer: {
    flex: 1,
    gap: 18,
    justifyContent: "center",
    padding: 20,
  },
  missingTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  });
}
