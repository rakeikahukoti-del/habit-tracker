import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { RankMedal } from "../progression";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function RankMedalsGrid({ currentLevel, isSmallScreen, milestones }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View style={styles.medalGrid}>
      {milestones.map((rankItem) => (
        <RankReward
          key={rankItem.key}
          locked={currentLevel < rankItem.unlockLevel}
          styles={styles}
          rankItem={rankItem}
        />
      ))}
    </View>
  );
}

function RankReward({ locked, rankItem, styles }) {
  return (
    <View
      accessibilityLabel={`${rankItem.label} medal, ${locked ? `locked until level ${rankItem.unlockLevel}` : "unlocked"}`}
      accessible
      style={[styles.medalReward, locked && styles.medalRewardLocked]}
    >
      <RankMedal locked={locked} rank={rankItem.label} size="small" />
      <AppText style={styles.medalName}>{rankItem.label}</AppText>
      <AppText style={styles.medalMeta}>
        {locked ? `Unlocks at level ${rankItem.unlockLevel}` : "Unlocked"}
      </AppText>
    </View>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    medalGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.md,
    },
    medalReward: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      minHeight: 94,
      padding: v2Spacing.lg,
    },
    medalRewardLocked: {
      opacity: 0.58,
    },
    medalName: {
      color: colors.text,
      fontSize: v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.md,
      textAlign: "center",
    },
    medalMeta: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: v2Spacing.xs,
      textAlign: "center",
    },
  });
}
