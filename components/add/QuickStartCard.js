import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Layout, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function QuickStartCard({ onOpenPicker }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.quickStartCard}>
      <View style={styles.quickStartText}>
        <AppText style={styles.quickStartTitle}>Quick start</AppText>
        <AppText style={styles.quickStartSubtitle}>
          Start manually, use a template, or add a small routine.
        </AppText>
      </View>
      <View style={styles.quickStartActions}>
        <Pressable
          accessibilityLabel="Use a habit template"
          accessibilityRole="button"
          onPress={() => onOpenPicker("template")}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && v2PressedStyles.button,
          ]}
        >
          <AppText style={styles.secondaryButtonText}>Use template</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel="Add a routine"
          accessibilityRole="button"
          onPress={() => onOpenPicker("routine")}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && v2PressedStyles.button,
          ]}
        >
          <AppText style={styles.secondaryButtonText}>Add routine</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    quickStartCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
      padding: v2Spacing.lg,
    },
    quickStartText: {
      gap: v2Spacing.xs,
    },
    quickStartTitle: {
      color: colors.text,
      ...v2Typography.cardTitle,
      fontWeight: v2FontWeight.bold,
    },
    quickStartSubtitle: {
      color: colors.muted,
      ...v2Typography.label,
      fontWeight: v2FontWeight.medium,
    },
    quickStartActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    secondaryButton: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexGrow: 1,
      justifyContent: "center",
      minHeight: v2Layout.minTapTarget,
      minWidth: 132,
      paddingHorizontal: v2Spacing.md,
    },
    secondaryButtonText: {
      color: colors.text,
      ...v2Typography.label,
      fontWeight: v2FontWeight.bold,
    },
  });
}
