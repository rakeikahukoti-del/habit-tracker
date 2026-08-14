import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { RankMedal } from "../progression";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { getRankForLevel, rankMilestones } from "../../storage/gamificationStorage";
import { getVisibleRank, getVisibleRankMilestones } from "../../utils/rankDisplay";

const MEDAL_SIZE = 40;
const CONNECTOR_WIDTH = 26;
const CONNECTOR_HEIGHT = 2;

// Connected trail, replacing the plain vertical locked/unlocked list -
// Phase 8 badge/rank survey, Proposal B. Medals run in sequence joined by
// a connector that fills solid up to the user's current level and stays
// hollow beyond it, so the path reads as one walked-partway shape instead
// of five unrelated rows.
//
// Reuses RankMedal/RankBadge as-is rather than inventing new art - the
// medal is already this app's established reward visual (Home's
// collapsed header at size="mini", the Rank hero above this at
// size="large"). Only addition: a "trail" size preset on RankMedal.
// RankBadge's existing locked treatment (opacity + dark overlay) handles
// not-yet-reached tiers with no new code.
//
// Six visible tiers - Diamond un-folded from Platinum once its medal art
// landed (RankMedalFrame, PR #30). getVisibleRank/getVisibleRankMilestones
// now pass Diamond through instead of remapping it, so it renders here
// like every other tier with no changes needed in this file.
export default function RankPath({ currentLevel }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const visibleRanks = getVisibleRankMilestones(rankMilestones);
  const currentRankLabel = getVisibleRank(getRankForLevel(currentLevel));

  return (
    <View style={styles.trail}>
      {visibleRanks.map((rankItem, index) => {
        const unlocked = currentLevel >= rankItem.unlockLevel;
        const current = currentRankLabel === rankItem.label;

        return (
          <View key={rankItem.key} style={styles.node}>
            {index > 0 ? (
              <View
                style={[
                  styles.connector,
                  unlocked && styles.connectorFilled,
                ]}
              />
            ) : null}
            <View
              accessibilityLabel={`${rankItem.label} rank, unlocks at level ${rankItem.unlockLevel}, ${current ? "current" : unlocked ? "unlocked" : "locked"}`}
              accessible
              style={styles.medalColumn}
            >
              <View
                style={[
                  styles.medalRing,
                  current && styles.medalRingCurrent,
                ]}
              >
                <RankMedal locked={!unlocked} rank={rankItem.label} size="trail" />
              </View>
              <AppText style={styles.rankName}>{rankItem.label}</AppText>
              <AppText style={styles.rankLevel}>Level {rankItem.unlockLevel}</AppText>
              {current ? (
                <View style={styles.currentChip}>
                  <AppText numberOfLines={1} style={styles.currentChipText}>
                    You are here
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    trail: {
      alignItems: "flex-start",
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: v2Spacing.lg,
      paddingVertical: v2Spacing.lg,
      rowGap: v2Spacing.lg,
    },
    node: {
      alignItems: "flex-start",
      flexDirection: "row",
    },
    connector: {
      backgroundColor: colors.border,
      height: CONNECTOR_HEIGHT,
      marginTop: MEDAL_SIZE / 2 - CONNECTOR_HEIGHT / 2,
      width: CONNECTOR_WIDTH,
    },
    connectorFilled: {
      backgroundColor: colors.text,
    },
    medalColumn: {
      alignItems: "center",
      gap: 2,
      minWidth: 64,
    },
    medalRing: {
      alignItems: "center",
      borderColor: "transparent",
      borderRadius: v2Radius.pill,
      borderWidth: 2,
      justifyContent: "center",
      padding: 3,
    },
    medalRingCurrent: {
      borderColor: colors.text,
    },
    rankName: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: 4,
    },
    rankLevel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    currentChip: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.pill,
      marginTop: 2,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    currentChipText: {
      color: colors.text,
      fontSize: 10,
      fontWeight: v2FontWeight.bold,
      letterSpacing: 0.2,
      textTransform: "uppercase",
    },
  });
}
