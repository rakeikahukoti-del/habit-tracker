import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

// Shared shell for the drill-down screen's stat cards - consolidates what
// were three near-identical hand-rolled components (HabitConsistencyCard,
// HabitWeekCard, MilestoneCard: label / big bold value / top-right pill,
// each with its own copy of the same row sub-component or its own
// progress-bar-plus-chips block). One shell, two content-slot modes:
//
// - `rows`: an array of {key, label, value} label/value pairs (what the
//   merged Consistency+Week card uses - see HabitWeekCard.js).
// - `visual`: {percentage, chips: [{key, label, completed}]} - a progress
//   bar plus a milestone-chip row (what MilestoneCard uses).
//
// Pass exactly one of the two; the shell (label/value/pill header) is
// always rendered.
export default function HabitStatCard({
  accessibilityLabel,
  isSmallScreen,
  label,
  pill,
  rows,
  value,
  visual,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View accessibilityLabel={accessibilityLabel} accessible style={styles.card}>
      <View style={styles.header}>
        <View style={styles.main}>
          <AppText style={styles.label}>{label}</AppText>
          <AppText style={styles.value}>{value}</AppText>
        </View>
        {pill ? (
          <View style={styles.pill}>
            <AppText style={styles.pillText}>{pill}</AppText>
          </View>
        ) : null}
      </View>

      {rows ? (
        <View style={styles.rows}>
          {rows.map((row) => (
            <StatRow key={row.key} label={row.label} styles={styles} value={row.value} />
          ))}
        </View>
      ) : null}

      {visual ? (
        <>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${visual.percentage}%` }]} />
          </View>
          <View style={styles.chips}>
            {visual.chips.map((chip) => (
              <View
                key={chip.key}
                style={[styles.chip, chip.completed && styles.chipComplete]}
              >
                <AppText
                  style={[
                    styles.chipText,
                    chip.completed && styles.chipTextComplete,
                  ]}
                >
                  {chip.label}
                </AppText>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function StatRow({ label, styles, value }) {
  return (
    <View style={styles.row}>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText style={styles.rowValue}>{value}</AppText>
    </View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.lg,
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    main: {
      flex: 1,
      minWidth: 0,
    },
    label: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    value: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 34 : 38,
      marginTop: 2,
    },
    pill: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      flexShrink: 0,
      justifyContent: "center",
      minHeight: 34,
      paddingHorizontal: v2Spacing.md,
    },
    pillText: {
      color: colors.text,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    rows: {
      gap: v2Spacing.sm,
      marginTop: v2Spacing.md,
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.xs,
      justifyContent: "space-between",
    },
    rowLabel: {
      color: colors.muted,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      minWidth: 130,
    },
    rowValue: {
      color: colors.text,
      flex: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: 18,
      minWidth: 130,
      textAlign: "right",
    },
    track: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      height: 8,
      marginTop: v2Spacing.md,
      overflow: "hidden",
    },
    fill: {
      backgroundColor: colors.primary,
      borderRadius: v2Radius.pill,
      height: "100%",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.xs,
      marginTop: v2Spacing.md,
    },
    chip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      minHeight: 30,
      justifyContent: "center",
      paddingHorizontal: v2Spacing.md,
    },
    chipComplete: {
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    chipTextComplete: {
      color: colors.text,
    },
  });
}
