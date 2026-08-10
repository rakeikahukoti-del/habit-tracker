import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import {
  v2Breakpoints,
  v2FontWeight,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../src/design";
import {
  getCalendarMonthDays,
  startOfMonth,
} from "../utils/calendarMonth";
import { AppIcon, AppText } from "./ui";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function HabitHistoryGrid({ habit, onToggleDate }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < v2Breakpoints.smallScreenMaxWidth;
  const styles = useMemo(
    () => createStyles(colors, isSmallScreen),
    [colors, isSmallScreen]
  );
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const monthDays = useMemo(
    () => getCalendarMonthDays(habit, visibleMonth),
    [habit, visibleMonth]
  );
  const completedCount = useMemo(
    () => monthDays.filter((day) => day.completed).length,
    [monthDays]
  );
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
          <AppText style={styles.title}>Calendar</AppText>
          <AppText style={styles.subtitle}>
            {completedCount} complete this month
            {onToggleDate ? " · tap to edit" : ""}
          </AppText>
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
            <AppIcon
              color={colors.text}
              name="chevron-left"
              size={18}
              strokeWidth={2}
            />
          </Pressable>
          <AppText numberOfLines={1} style={styles.monthTitle}>
            {visibleMonth.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </AppText>
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
            <AppIcon
              color={canGoNext ? colors.text : colors.softText}
              name="chevron-right"
              size={18}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.weekdaySlot}>
            <AppText style={styles.weekdayLabel}>{label}</AppText>
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
                accessibilityLabel={getDayAccessibilityLabel(day)}
                accessibilityHint={getDayAccessibilityHint(day, onToggleDate)}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: !onToggleDate || day.isFuture,
                  selected: day.completed,
                }}
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
                <AppText
                  style={[
                    styles.dayNumber,
                    day.completed && styles.dayNumberCompleted,
                    day.isToday && !day.completed && styles.todayNumber,
                    day.isFuture && styles.futureNumber,
                  ]}
                >
                  {day.dayOfMonth}
                </AppText>
              </Pressable>
            </View>
          )
        )}
      </View>
    </View>
  );
}

function getDayAccessibilityLabel(day) {
  if (day.isFuture) {
    return `${day.dateKey}, future date unavailable`;
  }

  return `${day.completed ? "Remove" : "Add"} completion for ${day.dateKey}`;
}

function getDayAccessibilityHint(day, onToggleDate) {
  if (!onToggleDate) {
    return "Completion editing is unavailable here.";
  }

  if (day.isFuture) {
    return "Future completion dates cannot be changed.";
  }

  return day.completed
    ? "Double tap to remove this completion."
    : "Double tap to add this completion.";
}

function createStyles(colors, isSmallScreen) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      marginBottom: v2Spacing.xl,
      padding: isSmallScreen ? v2Spacing.lg : v2Spacing.xl,
    },
    header: {
      gap: v2Spacing.md,
      marginBottom: v2Spacing.lg,
    },
    headerText: {
      minWidth: 0,
    },
    title: {
      color: colors.text,
      ...v2Typography.cardTitle,
      fontWeight: v2FontWeight.bold,
    },
    subtitle: {
      color: colors.muted,
      ...v2Typography.label,
      fontWeight: v2FontWeight.medium,
      marginTop: v2Spacing.xs,
    },
    monthControls: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.sm,
      justifyContent: "space-between",
      width: "100%",
    },
    monthButton: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 44,
      minWidth: 44,
    },
    disabledButton: {
      opacity: 0.35,
    },
    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.96 }],
    },
    monthTitle: {
      color: colors.text,
      flex: 1,
      ...v2Typography.body,
      fontWeight: v2FontWeight.bold,
      textAlign: "center",
    },
    weekdayRow: {
      flexDirection: "row",
      marginBottom: v2Spacing.xs,
    },
    weekdaySlot: {
      alignItems: "center",
      width: `${100 / 7}%`,
    },
    weekdayLabel: {
      color: colors.muted,
      ...v2Typography.caption,
      fontWeight: v2FontWeight.bold,
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
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: isSmallScreen ? 40 : 44,
      width: "100%",
    },
    dayCompleted: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    todayCell: {
      borderColor: colors.text,
      borderWidth: 2,
    },
    futureCell: {
      opacity: 0.36,
    },
    dayNumber: {
      color: colors.softText,
      ...v2Typography.caption,
      fontWeight: v2FontWeight.bold,
    },
    dayNumberCompleted: {
      color: colors.text,
    },
    todayNumber: {
      color: colors.text,
    },
    futureNumber: {
      color: colors.muted,
    },
  });
}
