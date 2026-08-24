import { StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import {
  v2FontWeight,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { AppText } from "./ui";
import { getTodayKey } from "../utils/habitStats";

export default function ProgressDots({ days, compact = false }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const completedCount = days.filter((day) => day.completed).length;
  const todayKey = getTodayKey();

  return (
    <View style={styles.wrapper}>
      {!compact && (
        <View style={styles.header}>
          <AppText style={styles.title}>This week</AppText>
          <AppText style={styles.count}>{completedCount}/7</AppText>
        </View>
      )}

      <View style={styles.container}>
        {days.map((day) => {
          // `scheduled` is only present on the schedule-aware variant
          // (getScheduleAwareWeeklyProgress) - callers still passing plain
          // getWeeklyProgress days (HabitCard, HabitPerformanceList) never
          // set it, so `unscheduled` is false for them and rendering is
          // unchanged. Kept in the row (not dropped) so day-of-week
          // alignment stays intact - just muted/dashed instead of solid.
          const unscheduled = day.scheduled === false;
          const completed = day.completed && !unscheduled;

          return (
            <View
              accessible
              accessibilityLabel={
                unscheduled
                  ? `${day.label}, not scheduled${day.dateKey === todayKey ? ", today" : ""}`
                  : `${day.label}, ${day.completed ? "completed" : "not completed"}${day.dateKey === todayKey ? ", today" : ""}`
              }
              key={day.dateKey}
              style={[styles.day, unscheduled && styles.dayUnscheduled]}
            >
              <View
                style={[
                  styles.dot,
                  completed && styles.dotCompleted,
                  unscheduled && styles.dotUnscheduled,
                  day.dateKey === todayKey && styles.dotToday,
                ]}
              />
              <AppText style={[styles.label, completed && styles.labelCompleted]}>
                {day.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    wrapper: {
      flexShrink: 1,
      gap: v2Spacing.sm,
      maxWidth: "100%",
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    title: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    count: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    container: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 1,
      gap: 8,
      maxWidth: "100%",
    },
    day: {
      alignItems: "center",
      gap: 5,
      minWidth: 22,
    },
    dayUnscheduled: {
      opacity: 0.45,
    },
    dot: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.dotEmpty,
      borderRadius: v2Radius.pill,
      borderWidth: 1.5,
      height: 13,
      width: 13,
    },
    dotCompleted: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    dotUnscheduled: {
      backgroundColor: "transparent",
      borderColor: colors.dotEmpty,
      borderStyle: "dashed",
    },
    dotToday: {
      borderColor: colors.primary,
      borderWidth: 2,
      height: 15,
      width: 15,
    },
    label: {
      color: colors.softText,
      fontSize: v2Typography.navigationLabel.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    labelCompleted: {
      color: colors.text,
      fontWeight: v2FontWeight.bold,
    },
  });
}
