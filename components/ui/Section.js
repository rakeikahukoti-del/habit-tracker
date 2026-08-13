import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Spacing, v2Typography } from "../../src/design";
import AppText from "./AppText";

// Shared titled-section wrapper, used across Progress, Analytics, and Rank
// (and anywhere else a screen needs a labeled block of content). Was three
// near-identical components - components/analytics/Section.js,
// components/stats/Section.js, and components/rank/Section.js - each
// forked from the others with one small difference apiece: stats' version
// added an optional `action` slot beside the title; rank's version added
// an optional `subtitle` line below it. The first two were consolidated
// together first (they shared the same header shape); rank's wasn't at
// the time, since `subtitle` renders on a different axis than `action`
// and folding it in looked like it might force one of them into an
// awkward position. It doesn't: `action` sits beside the title in
// `sectionHeader`'s row, `subtitle` sits below that whole row as a
// sibling within `headerGroup`, so neither prop's rendering depends on or
// conflicts with the other. `headerGroup` (rather than `section` itself)
// owns the tight 3px title/subtitle gap so it doesn't inherit `section`'s
// looser v2Spacing.md gap meant for title-to-content spacing - callers
// that pass neither prop render identically to before consolidation.
export default function Section({ action, children, subtitle, title }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <View style={styles.headerGroup}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>{title}</AppText>
          {action}
        </View>
        {subtitle ? (
          <AppText style={styles.sectionSubtitle}>{subtitle}</AppText>
        ) : null}
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
    headerGroup: {
      gap: 3,
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
    sectionSubtitle: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
    },
  });
}
