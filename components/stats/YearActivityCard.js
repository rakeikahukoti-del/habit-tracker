import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import {
  getActivityDayAccessibilityLabel,
  getHeatmapIntensity,
  getMonthLabel,
} from "../../utils/activityHistory";

export default function YearActivityCard({
  availableYears,
  isSmallScreen,
  selectedDay,
  selectedDayKey,
  selectedYear,
  setSelectedDayKey,
  setSelectedYear,
  yearDays,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const groupedMonths = useMemo(() => groupDaysByMonth(yearDays), [yearDays]);

  return (
    <View style={styles.activityCard}>
      {availableYears.length > 1 ? (
        <View accessibilityRole="tablist" style={styles.yearTabs}>
          {availableYears.map((year) => {
            const selected = year === selectedYear;

            return (
              <Pressable
                accessibilityLabel={`${year} activity year`}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={year}
                onPress={() => setSelectedYear(year)}
                style={({ pressed }) => [
                  styles.yearTab,
                  selected && styles.yearTabSelected,
                  pressed && v2PressedStyles.stats,
                ]}
              >
                <AppText
                  style={[
                    styles.yearTabText,
                    selected && styles.yearTabTextSelected,
                  ]}
                >
                  {year}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.heatmapLegend}>
        <LegendItem label="No activity" styles={styles} variant="none" />
        <LegendItem label="Partial" styles={styles} variant="partial" />
        <LegendItem label="Complete" styles={styles} variant="complete" />
        <LegendItem label="Future" styles={styles} variant="future" />
      </View>

      {yearDays.length === 0 ? (
        <AppText style={styles.emptyInlineText}>
          Complete habits to build your activity history.
        </AppText>
      ) : (
        <View style={styles.yearGrid}>
          {groupedMonths.map((month) => (
            <View key={month.monthIndex} style={styles.monthHeatmap}>
              <AppText style={styles.monthHeatmapTitle}>
                {getMonthLabel(month.monthIndex)}
              </AppText>
              <View style={styles.monthHeatmapGrid}>
                {month.leadingBlanks.map((blank) => (
                  <View key={blank} style={styles.heatmapDaySlot} />
                ))}
                {month.days.map((day) => {
                  const selected = day.dateKey === selectedDayKey;
                  const intensity = getHeatmapIntensity(day);

                  return (
                    <View key={day.dateKey} style={styles.heatmapDaySlot}>
                      <Pressable
                        accessibilityLabel={getActivityDayAccessibilityLabel(day)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        hitSlop={4}
                        onPress={() =>
                          setSelectedDayKey((current) =>
                            current === day.dateKey ? "" : day.dateKey
                          )
                        }
                        style={({ pressed }) => [
                          styles.heatmapCell,
                          styles[`heatmapCell_${intensity}`],
                          selected && styles.heatmapCellSelected,
                          pressed && v2PressedStyles.stats,
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      {selectedDay ? (
        <SelectedDayCard selectedDay={selectedDay} styles={styles} />
      ) : (
        <AppText style={styles.activityHint}>
          Tap any day to inspect scheduled and completed habits.
        </AppText>
      )}
    </View>
  );
}

function LegendItem({ label, styles, variant }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, styles[`heatmapCell_${variant}`]]} />
      <AppText style={styles.legendLabel}>{label}</AppText>
    </View>
  );
}

function SelectedDayCard({ selectedDay, styles }) {
  return (
    <View
      accessibilityLabel={getActivityDayAccessibilityLabel(selectedDay)}
      accessible
      style={styles.selectedDayCard}
    >
      <AppText style={styles.selectedDayTitle}>
        {formatSelectedDate(selectedDay.dateKey)}
      </AppText>
      <AppText style={styles.selectedDaySummary}>
        {getSelectedDaySummary(selectedDay)}
      </AppText>
      {selectedDay.habitNames.length > 0 ? (
        <AppText numberOfLines={3} style={styles.selectedDayHabits}>
          {selectedDay.habitNames.slice(0, 4).join(", ")}
          {selectedDay.habitNames.length > 4 ? "..." : ""}
        </AppText>
      ) : null}
    </View>
  );
}

function groupDaysByMonth(days) {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const monthDays = days.filter((day) => {
      const [, month] = day.dateKey.split("-").map(Number);

      return month === monthIndex + 1;
    });
    const firstDay = monthDays[0]
      ? dateKeyToLocalDate(monthDays[0].dateKey).getDay()
      : 0;

    return {
      days: monthDays,
      leadingBlanks: Array.from(
        { length: firstDay },
        (_, index) => `blank-${monthIndex}-${index}`
      ),
      monthIndex,
    };
  });
}

function getSelectedDaySummary(day) {
  if (day.state === "future") {
    return "Future date.";
  }

  if (day.state === "beforeTracking") {
    return "Before activity tracking started.";
  }

  if (day.state === "unscheduled") {
    return "No habits scheduled.";
  }

  if (day.isPerfectDay) {
    return `Perfect day: ${day.completedCount} of ${day.scheduledCount} complete.`;
  }

  return `${day.completedCount} of ${day.scheduledCount} scheduled habits complete (${day.completionRate}%).`;
}

function formatSelectedDate(dateKey) {
  return dateKeyToLocalDate(dateKey).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dateKeyToLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    activityCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: isSmallScreen ? v2Spacing.md : v2Spacing.lg,
    },
    yearTabs: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.xs,
      marginBottom: v2Spacing.lg,
      padding: v2Spacing.xs,
    },
    yearTab: {
      alignItems: "center",
      borderRadius: v2Radius.small,
      flexGrow: 1,
      justifyContent: "center",
      minHeight: 38,
      minWidth: 72,
      paddingHorizontal: v2Spacing.sm,
    },
    yearTabSelected: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
    },
    yearTabText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    yearTabTextSelected: {
      color: colors.text,
    },
    heatmapLegend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      marginBottom: v2Spacing.lg,
    },
    legendItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      minHeight: 24,
    },
    legendSwatch: {
      borderRadius: v2Radius.small,
      height: 14,
      width: 14,
    },
    legendLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    yearGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.md,
    },
    monthHeatmap: {
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      minWidth: isSmallScreen ? "100%" : 150,
    },
    monthHeatmapTitle: {
      color: colors.text,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: v2Spacing.xs,
      textTransform: "uppercase",
    },
    monthHeatmapGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    heatmapDaySlot: {
      padding: 2,
      width: `${100 / 7}%`,
    },
    heatmapCell: {
      aspectRatio: 1,
      borderRadius: v2Radius.small,
      borderWidth: 1,
      minHeight: isSmallScreen ? 18 : 20,
      width: "100%",
    },
    heatmapCell_none: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      opacity: 0.58,
    },
    heatmapCell_empty: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    heatmapCell_partial: {
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
    },
    heatmapCell_mostly: {
      backgroundColor: colors.successSoft,
      borderColor: colors.success,
      borderWidth: 2,
    },
    heatmapCell_complete: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    heatmapCell_future: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      opacity: 0.28,
    },
    heatmapCellSelected: {
      borderColor: colors.text,
      borderWidth: 2,
      transform: [{ scale: 1.08 }],
    },
    activityHint: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: v2Spacing.lg,
    },
    selectedDayCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      marginTop: v2Spacing.lg,
      padding: v2Spacing.md,
    },
    selectedDayTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
    },
    selectedDaySummary: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: v2Spacing.xs,
    },
    selectedDayHabits: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: v2Spacing.xs,
    },
    emptyInlineText: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      padding: v2Spacing.lg,
    },
  });
}
