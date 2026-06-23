import { useCallback, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
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
import { getHabits, moveHabit } from "../storage/habitsStorage";

export default function ReorderHabitsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadHabits() {
        try {
          setError("");
          const savedHabits = await getHabits();

          if (isActive) {
            setHabits(savedHabits);
          }
        } catch {
          if (isActive) {
            setError("Could not load habits. Please try again.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadHabits();

      return () => {
        isActive = false;
      };
    }, [])
  );

  async function handleMoveHabit(id, direction) {
    try {
      setError("");
      const reorderedHabits = await moveHabit(id, direction);
      setHabits(reorderedHabits);
    } catch {
      setError("Could not reorder habits. Please try again.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
          onPress={() => router.replace("/habit-preferences")}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Habits</Text>
        </Pressable>

        <Text style={styles.eyebrow}>Habits</Text>
        <Text style={styles.title}>Reorder habits</Text>
        <Text style={styles.subtitle}>
          Use arrows to set the Home order.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.listCard}>
          {loading ? (
            <Text style={styles.emptyText}>Loading habits...</Text>
          ) : habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No habits yet</Text>
              <Text style={styles.emptyText}>
                Create a habit first, then set its order here.
              </Text>
            </View>
          ) : (
            habits.map((habit, index) => (
              <HabitOrderRow
                habit={habit}
                index={index}
                isFirst={index === 0}
                isLast={index === habits.length - 1}
                key={habit.id}
                onMove={handleMoveHabit}
                styles={styles}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HabitOrderRow({ habit, index, isFirst, isLast, onMove, styles }) {
  const accentColor = habit.color || DEFAULT_HABIT_COLOR;

  return (
    <View style={[styles.habitRow, index === 0 && styles.firstHabitRow]}>
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: withAlpha(accentColor, 0.14),
            borderColor: withAlpha(accentColor, 0.36),
          },
        ]}
      >
        <Text style={styles.iconText}>{habit.emoji || "✨"}</Text>
      </View>

      <View style={styles.habitText}>
        <Text numberOfLines={1} style={styles.habitName}>
          {habit.name}
        </Text>
        <Text numberOfLines={1} style={styles.habitCategory}>
          {habit.category || "General"}
        </Text>
      </View>

      <View style={styles.moveControls}>
        <View
          accessibilityLabel="Drag handle"
          style={styles.dragHandle}
        >
          <Text style={styles.dragHandleText}>≡</Text>
        </View>
        <MoveButton
          disabled={isFirst}
          label="Move habit up"
          onPress={() => onMove(habit.id, "up")}
          styles={styles}
          symbol="↑"
        />
        <MoveButton
          disabled={isLast}
          label="Move habit down"
          onPress={() => onMove(habit.id, "down")}
          styles={styles}
          symbol="↓"
        />
      </View>
    </View>
  );
}

function MoveButton({ disabled, label, onPress, styles, symbol }) {
  return (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={{ bottom: 6, left: 6, right: 6, top: 6 }}
      onPress={onPress}
      style={[styles.moveButton, disabled && styles.disabledButton]}
    >
      <Text style={styles.moveButtonText}>{symbol}</Text>
    </Pressable>
  );
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? layout.formMaxWidth : "100%",
      padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
      paddingBottom: layout.screenBottomPadding,
      width: "100%",
    },
    backButton: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.round,
      borderWidth: 1,
      justifyContent: "center",
      marginBottom: spacing.lg,
      minHeight: layout.minTapTarget,
      paddingHorizontal: spacing.lg,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.xs,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: pageTitleSize(isSmallScreen),
      fontWeight: fontWeight.bold,
      lineHeight: pageTitleLineHeight(isSmallScreen),
      marginBottom: spacing.sm,
    },
    subtitle: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.body,
      marginBottom: spacing.lg,
    },
    errorText: {
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.sm,
      color: colors.danger,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    listCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xl,
      borderWidth: 1,
      overflow: "hidden",
    },
    habitRow: {
      alignItems: "center",
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 70,
      padding: isSmallScreen ? spacing.md : spacing.lg,
    },
    firstHabitRow: {
      borderTopWidth: 0,
    },
    iconBadge: {
      alignItems: "center",
      borderRadius: radius.md,
      borderWidth: 1,
      height: 46,
      justifyContent: "center",
      width: 46,
    },
    iconText: {
      fontSize: 23,
    },
    habitText: {
      flex: 1,
      minWidth: 0,
    },
    habitName: {
      color: colors.text,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.bodyLarge,
    },
    habitCategory: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.caption,
      marginTop: spacing.xs,
    },
    moveControls: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      gap: spacing.sm,
    },
    dragHandle: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.sm,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 32,
    },
    dragHandleText: {
      color: colors.muted,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
      lineHeight: 22,
    },
    moveButton: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.sm,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    moveButtonText: {
      color: colors.primary,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
      lineHeight: 22,
    },
    disabledButton: {
      opacity: 0.35,
    },
    emptyState: {
      alignItems: "center",
      padding: spacing.xxl,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.xs,
      textAlign: "center",
    },
    emptyText: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.body,
      padding: spacing.xl,
      textAlign: "center",
    },
  });
}

function withAlpha(hexColor, alpha) {
  const normalized = hexColor.replace("#", "");

  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
