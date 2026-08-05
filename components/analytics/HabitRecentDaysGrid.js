import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { v2Radius, v2Spacing } from "../../src/design";

export default function HabitRecentDaysGrid({ days, isSmallScreen }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View style={styles.historyGrid}>
      {days.map((day) => (
        <View
          accessibilityLabel={`${day.dateKey}: ${day.completed ? "completed" : "not completed"}`}
          accessible
          key={day.dateKey}
          style={[
            styles.historyCell,
            day.completed && styles.historyCellComplete,
            day.isToday && styles.historyCellToday,
          ]}
        />
      ))}
    </View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    historyGrid: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
      padding: v2Spacing.lg,
    },
    historyCell: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.small,
      borderWidth: 1,
      height: isSmallScreen ? 22 : 25,
      width: isSmallScreen ? 22 : 25,
    },
    historyCellComplete: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    historyCellToday: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
  });
}
