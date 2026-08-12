import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Spacing, v2Typography } from "../../src/design";
import AppText from "./AppText";

// Shared titled-section wrapper, used across Progress and Analytics (and
// anywhere else a screen needs a labeled block of content). Was two
// near-identical components - components/analytics/Section.js and
// components/stats/Section.js - forked from each other with the only
// difference being this optional `action` slot next to the title, which
// stats' version had and analytics' didn't. Consolidated here as the
// superset: callers that don't pass `action` render exactly as the
// analytics version did (an empty `action` renders nothing).
export default function Section({ action, children, title }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>{title}</AppText>
        {action}
      </View>
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
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
