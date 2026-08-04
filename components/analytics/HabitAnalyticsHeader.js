import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { DEFAULT_HABIT_EMOJI } from "../../constants/habitOptions";

export default function HabitAnalyticsHeader({ category, emoji, isSmallScreen, name }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View style={styles.header}>
      <View style={styles.iconBadge}>
        <AppText style={styles.icon}>{emoji || DEFAULT_HABIT_EMOJI}</AppText>
      </View>
      <View style={styles.headerText}>
        <AppText style={styles.category}>{category}</AppText>
        <AppText style={styles.title} numberOfLines={3}>
          {name}
        </AppText>
      </View>
    </View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
    },
    iconBadge: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      height: 52,
      justifyContent: "center",
      width: 52,
    },
    icon: {
      fontSize: 26,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    category: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
    },
    title: {
      color: colors.text,
      fontSize: isSmallScreen ? 24 : 28,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 30 : 34,
    },
  });
}
