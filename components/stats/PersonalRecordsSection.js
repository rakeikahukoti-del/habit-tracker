import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function PersonalRecordsSection({ records }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return records.length > 0 ? (
    <View style={styles.recordList}>
      {records.map((record) => (
        <RecordCard key={record.id} record={record} styles={styles} />
      ))}
    </View>
  ) : (
    <AppText style={styles.emptyInlineText}>
      Records appear after a few valid completions.
    </AppText>
  );
}

function RecordCard({ record, styles }) {
  return (
    <View
      accessibilityLabel={`${record.title}. ${record.value}. ${record.description}${
        record.achievedAt ? ` Achieved on ${record.achievedAt}.` : ""
      }`}
      accessible
      style={styles.recordCard}
    >
      <View style={styles.recordHeader}>
        <AppText numberOfLines={2} style={styles.recordTitle}>
          {record.title}
        </AppText>
        <AppText style={styles.recordValue}>{record.value}</AppText>
      </View>
      <AppText style={styles.recordDescription}>{record.description}</AppText>
      {record.achievedAt ? (
        <AppText style={styles.recordDate}>{record.achievedAt}</AppText>
      ) : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    recordList: {
      gap: v2Spacing.sm,
    },
    recordCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.lg,
    },
    recordHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
    },
    recordTitle: {
      color: colors.text,
      flex: 1,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
      minWidth: 0,
    },
    recordValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: "42%",
      textAlign: "right",
    },
    recordDescription: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: v2Spacing.xs,
    },
    recordDate: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.sm,
    },
    emptyInlineText: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      padding: v2Spacing.lg,
    },
  });
}
