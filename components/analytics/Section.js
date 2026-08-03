import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Spacing, v2Typography } from "../../src/design";

export default function Section({ children, title }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {children}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    section: {
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
