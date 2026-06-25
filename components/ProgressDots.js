import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { fontWeight } from "../constants/typography";
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
          <Text style={styles.title}>This week</Text>
          <Text style={styles.count}>{completedCount}/7</Text>
        </View>
      )}

      <View style={styles.container}>
        {days.map((day) => (
          <View key={day.dateKey} style={styles.day}>
            <View
              style={[
                styles.dot,
                day.completed && styles.dotCompleted,
                day.dateKey === todayKey && styles.dotToday,
              ]}
            />
            <Text style={[styles.label, day.completed && styles.labelCompleted]}>
              {day.label}
            </Text>
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
    gap: 10,
    maxWidth: "100%",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: fontWeight.medium,
  },
  count: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },
  container: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 9,
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
    borderRadius: 999,
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
    fontSize: 11,
    fontWeight: fontWeight.medium,
  },
  labelCompleted: {
    color: colors.primaryDark,
  },
  });
}
