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
        {days.map((day) => (
          <View
            accessible
            accessibilityLabel={`${day.label}, ${day.completed ? "completed" : "not completed"}${day.dateKey === todayKey ? ", today" : ""}`}
            key={day.dateKey}
            style={styles.day}
          >
            <View
              style={[
                styles.dot,
                day.completed && styles.dotCompleted,
                day.dateKey === todayKey && styles.dotToday,
              ]}
            />
            <AppText style={[styles.label, day.completed && styles.labelCompleted]}>
              {day.label}
            </AppText>
          </View>
        ))}
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
