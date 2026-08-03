import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import ProgressDots from "../ProgressDots";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { getHabitPerformanceAccessibilityLabel } from "../../utils/analyticsPresentation";
import { PRESSED_STATS_STYLE } from "../home/pressedStyles";

export default function HabitPerformanceList({ items }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return items.length === 0 ? (
    <AppText style={styles.emptyText}>
      Complete habits to compare performance.
    </AppText>
  ) : (
    items.map((item) => (
      <HabitPerformanceRow item={item} key={item.habit.id} styles={styles} />
    ))
  );
}

function HabitPerformanceRow({ item, styles }) {
  const trendLabel =
    item.trendDelta > 5
      ? `+${item.trendDelta}%`
      : item.trendDelta < -5
        ? `${item.trendDelta}%`
        : "Stable";

  return (
    <Pressable
      accessibilityLabel={getHabitPerformanceAccessibilityLabel(
        item,
        trendLabel
      )}
      accessibilityRole="button"
      onPress={() => router.push(`/analytics/${item.habit.id}`)}
      style={({ pressed }) => [
        styles.habitRow,
        pressed && PRESSED_STATS_STYLE,
      ]}
    >
      <View style={styles.habitTopRow}>
        <View style={styles.habitMain}>
          <AppText numberOfLines={2} style={styles.habitName}>
            {item.habit.name}
          </AppText>
          <AppText numberOfLines={3} style={styles.habitMeta}>
            {item.category} · {item.currentStreak} day streak · {trendLabel}
          </AppText>
        </View>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          style={styles.habitRateValue}
        >
          {item.completionRate}%
        </AppText>
      </View>
      <View style={styles.habitTrack}>
        <View
          style={[
            styles.habitFill,
            { width: `${clampPercentage(item.completionRate)}%` },
          ]}
        />
      </View>
      <ProgressDots days={item.weeklyProgress} compact />
    </Pressable>
  );
}

function clampPercentage(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function createStyles(colors) {
  return StyleSheet.create({
    emptyText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
      marginBottom: v2Spacing.lg,
    },
    habitRow: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      gap: v2Spacing.md,
      padding: v2Spacing.lg,
    },
    habitTopRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
      maxWidth: "100%",
    },
    habitMain: {
      flex: 1,
      minWidth: 0,
    },
    habitName: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
    },
    habitMeta: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 4,
    },
    habitTrack: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      height: 6,
      marginTop: v2Spacing.md,
      overflow: "hidden",
    },
    habitFill: {
      backgroundColor: colors.text,
      borderRadius: v2Radius.pill,
      height: "100%",
    },
    habitRateValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: "32%",
      textAlign: "right",
    },
  });
}
