import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../constants/typography";
import { getTodayKey, toDateKey } from "../utils/habitStats";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function HabitHistoryGrid({ habit, onToggleDate }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const styles = createStyles(colors, isSmallScreen);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const monthDays = getCalendarMonthDays(habit, visibleMonth);
  const completedCount = monthDays.filter((day) => day.completed).length;
  const todayMonth = startOfMonth(new Date());
  const canGoNext = visibleMonth < todayMonth;

  function goToPreviousMonth() {
    setVisibleMonth((currentMonth) =>
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setVisibleMonth((currentMonth) => {
      const nextMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      );

      return nextMonth > todayMonth ? currentMonth : nextMonth;
    });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>
            {completedCount} days complete
            {onToggleDate ? " • tap days to edit" : ""}
          </Text>
        </View>

        <View style={styles.monthControls}>
          <Pressable
            accessibilityLabel="Previous month"
            accessibilityRole="button"
            hitSlop={10}
            onPress={goToPreviousMonth}
            style={({ pressed }) => [
              styles.monthButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.monthButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>
            {visibleMonth.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Pressable
            accessibilityLabel="Next month"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canGoNext }}
            disabled={!canGoNext}
            hitSlop={10}
            onPress={goToNextMonth}
            style={({ pressed }) => [
              styles.monthButton,
              !canGoNext && styles.disabledButton,
              pressed && canGoNext && styles.buttonPressed,
            ]}
          >
            <Text style={styles.monthButtonText}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.weekdaySlot}>
            <Text style={styles.weekdayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {monthDays.map((day, index) =>
          day.isBlank ? (
            <View key={`blank-${index}`} style={styles.daySlot} />
          ) : (
            <View key={day.dateKey} style={styles.daySlot}>
              <Pressable
                accessibilityLabel={`${day.completed ? "Remove" : "Add"} completion for ${day.dateKey}`}
                accessibilityRole="button"
                disabled={!onToggleDate || day.isFuture}
                hitSlop={4}
                onPress={onToggleDate ? () => onToggleDate(day) : undefined}
                style={[
                  styles.dayCell,
                  day.completed && styles.dayCompleted,
                  day.isToday && styles.todayCell,
                  day.isFuture && styles.futureCell,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    day.completed && styles.dayNumberCompleted,
                    day.isToday && !day.completed && styles.todayNumber,
                    day.isFuture && styles.futureNumber,
                  ]}
                >
                  {day.dayOfMonth}
                </Text>
              </Pressable>
            </View>
          )
        )}
      </View>
    </View>
  );
}

function getCalendarMonthDays(habit, visibleMonth) {
  const completedSet = new Set(habit.completedDates || []);
  const todayKey = getTodayKey();
  const today = startOfDay(new Date());
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingBlanks = firstDay.getDay();
  const blanks = Array.from({ length: leadingBlanks }, () => ({
    isBlank: true,
  }));
  const days = Array.from({ length: lastDay.getDate() }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const dateKey = toDateKey(date);

    return {
      completed: completedSet.has(dateKey),
      dateKey,
      dayOfMonth: date.getDate(),
      isFuture: startOfDay(date) > today,
      isToday: dateKey === todayKey,
    };
  });

  return [...blanks, ...days];
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function createStyles(colors, isSmallScreen) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xxl,
      borderWidth: 1,
      marginBottom: spacing.xl,
      padding: isSmallScreen ? spacing.lg : spacing.xl,
    },
    header: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    headerText: {
      minWidth: 0,
    },
    title: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    subtitle: {
      color: colors.muted,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
      lineHeight: 18,
      marginTop: spacing.xs,
    },
    monthControls: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
      width: "100%",
    },
    monthButton: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.round,
      borderWidth: 1,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    disabledButton: {
      opacity: 0.35,
    },
    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.96 }],
    },
    monthButtonText: {
      color: colors.primary,
      fontSize: 24,
      fontWeight: fontWeight.bold,
      lineHeight: 26,
    },
    monthTitle: {
      color: colors.text,
      flex: 1,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.bold,
      textAlign: "center",
    },
    weekdayRow: {
      flexDirection: "row",
      marginBottom: spacing.xs,
    },
    weekdaySlot: {
      alignItems: "center",
      width: `${100 / 7}%`,
    },
    weekdayLabel: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    daySlot: {
      padding: isSmallScreen ? 2 : 3,
      width: `${100 / 7}%`,
    },
    dayCell: {
      alignItems: "center",
      aspectRatio: 1,
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.sm,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: isSmallScreen ? 36 : 40,
      width: "100%",
    },
    dayCompleted: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    todayCell: {
      borderColor: colors.warning,
      borderWidth: 2,
    },
    futureCell: {
      opacity: 0.36,
    },
    dayNumber: {
      color: colors.softText,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
    },
    dayNumberCompleted: {
      color: colors.inverseText,
    },
    todayNumber: {
      color: colors.text,
    },
    futureNumber: {
      color: colors.muted,
    },
  });
}
