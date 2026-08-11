import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { RankMedal } from "../progression";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2CompactSpacing, v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function DailyProgressionPanel({
  completedTodayCount,
  completionLabel,
  completionPercentage,
  habitCount,
  isSmallScreen,
  levelInfo,
  longestCurrentStreak,
  progressExpanded,
  rank,
  remainingTodayCount,
  scheduledTodayCount,
  showProgressCard,
  showXpRankOnHome,
  statusMessage,
  todayXp,
  toggleProgressExpanded,
  weeklyContext,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  // With zero habits there's no progress to summarize - Level/XP/streak are
  // all at their defaults, and this panel's only substantive copy would
  // just repeat what EmptyState already says in full. See Phase 7 survey,
  // thread 2 ("five separate renderings of 'you have no habits'").
  if (!showProgressCard || habitCount === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.progressPanel}>
        <Pressable
          accessibilityLabel={
            progressExpanded
              ? `Collapse daily progression. ${completedTodayCount} of ${scheduledTodayCount} scheduled habits complete. ${statusMessage}.`
              : `Expand daily progression. ${completedTodayCount} of ${scheduledTodayCount} scheduled habits complete. ${statusMessage}.`
          }
          accessibilityRole="button"
          accessibilityState={{ expanded: Boolean(progressExpanded) }}
          onPress={toggleProgressExpanded}
          style={({ pressed }) => [
            styles.progressHeader,
            pressed && v2PressedStyles.button,
          ]}
        >
          <View style={styles.progressHeaderText}>
            <AppText style={styles.progressLabel}>Today</AppText>
            <AppText style={styles.progressValue}>{completionLabel}</AppText>
            {!progressExpanded ? (
              <AppText style={styles.progressCompactHint} numberOfLines={2}>
                {statusMessage}
              </AppText>
            ) : null}
          </View>
          <View style={styles.progressHeaderRight}>
            {!progressExpanded && showXpRankOnHome ? (
              <RankMedal rank={rank} size="mini" />
            ) : null}
            <AppIcon
              color={colors.muted}
              name={progressExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              strokeWidth={2}
            />
          </View>
        </Pressable>

        {progressExpanded ? (
          <>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>

            <View style={styles.progressMetaRow}>
              {showXpRankOnHome ? (
                <>
                  <AppText style={styles.progressMeta}>
                    Level {levelInfo.level}
                  </AppText>
                  <AppText style={styles.progressMeta}>
                    {todayXp} XP today
                  </AppText>
                  <View style={styles.rankMeta}>
                    <RankMedal rank={rank} size="mini" />
                    <AppText style={styles.progressMeta}>{rank}</AppText>
                  </View>
                </>
              ) : null}
              <View style={styles.streakMeta}>
                <AppIcon
                  color={colors.muted}
                  name="flame"
                  size={15}
                  strokeWidth={1.6}
                />
                <AppText style={styles.progressMeta}>
                  {longestCurrentStreak} streak
                </AppText>
              </View>
              <AppText style={styles.progressMeta}>
                {remainingTodayCount === 0
                  ? "Scheduled work clear"
                  : `${remainingTodayCount} remaining`}
              </AppText>
            </View>
          </>
        ) : null}
      </View>

      {progressExpanded ? (
        <View style={styles.focusNote}>
          <AppText style={styles.focusNoteLabel}>Next</AppText>
          <AppText style={styles.focusNoteText}>{statusMessage}</AppText>
          <AppText style={styles.weeklyContextText}>{weeklyContext}</AppText>
        </View>
      ) : null}
    </>
  );
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    progressPanel: {
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: v2Spacing.sm,
      marginBottom: v2Spacing.sm,
      paddingVertical: v2Spacing.md,
    },
    progressHeader: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    progressHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    progressLabel: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      marginBottom: 4,
    },
    progressValue: {
      color: colors.text,
      fontSize: isSmallScreen ? 28 : v2Typography.largeMetric.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 33 : v2Typography.largeMetric.lineHeight,
    },
    progressCompactHint: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
      marginTop: 3,
      maxWidth: isSmallScreen ? 190 : 240,
    },
    progressHeaderRight: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      justifyContent: "flex-end",
      maxWidth: "48%",
    },
    progressMetaRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "space-between",
    },
    progressMeta: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    rankMeta: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.xs,
    },
    streakMeta: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.xs,
    },
    focusNote: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      marginBottom: v2Spacing.sm,
      paddingHorizontal: v2CompactSpacing.md,
      paddingVertical: v2Spacing.md,
    },
    focusNoteLabel: {
      color: colors.primary,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    focusNoteText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
    },
    weeklyContextText: {
      color: colors.softText,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
      marginTop: 6,
    },
    progressTrack: {
      backgroundColor: colors.inputBackground,
      borderRadius: v2Radius.pill,
      height: 12,
      overflow: "hidden",
    },
    progressFill: {
      backgroundColor: colors.accent,
      borderRadius: v2Radius.pill,
      height: "100%",
    },
  });
}
