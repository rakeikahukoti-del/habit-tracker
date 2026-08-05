import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { getRankForLevel, rankMilestones } from "../../storage/gamificationStorage";
import { getVisibleRank, getVisibleRankMilestones } from "../../utils/rankDisplay";

export default function RankPath({ currentLevel }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.rankPath}>
      {getVisibleRankMilestones(rankMilestones).map((rankItem) => {
        const unlocked = currentLevel >= rankItem.unlockLevel;
        const current = getVisibleRank(getRankForLevel(currentLevel)) === rankItem.label;

        return (
          <View
            accessibilityLabel={`${rankItem.label} rank, unlocks at level ${rankItem.unlockLevel}, ${unlocked ? "unlocked" : "locked"}`}
            accessible
            key={rankItem.key}
            style={[
              styles.rankStep,
              current && styles.rankStepCurrent,
            ]}
          >
            <View
              style={[
                styles.rankStepMarker,
                unlocked && styles.rankStepMarkerUnlocked,
                current && styles.rankStepMarkerCurrent,
              ]}
            />
            <View style={styles.rankStepText}>
              <AppText style={styles.rankStepName}>{rankItem.label}</AppText>
              <AppText style={styles.rankStepMeta}>
                Level {rankItem.unlockLevel}
              </AppText>
            </View>
            <AppText style={styles.rankStepState}>
              {current ? "Current" : unlocked ? "Unlocked" : "Locked"}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    rankPath: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      paddingHorizontal: v2Spacing.lg,
    },
    rankStep: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 58,
    },
    rankStepCurrent: {
      backgroundColor: colors.surface,
    },
    rankStepMarker: {
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      height: 14,
      width: 14,
    },
    rankStepMarkerUnlocked: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    rankStepMarkerCurrent: {
      height: 18,
      width: 18,
    },
    rankStepText: {
      flex: 1,
      minWidth: 0,
    },
    rankStepName: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    rankStepMeta: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
    rankStepState: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
