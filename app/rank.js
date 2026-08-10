import { useMemo } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  StyleSheet,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import {
  GamificationHeader,
  GamificationScreen,
} from "../components/progression";
import {
  AchievementDetailModal,
  AchievementsSection,
  BadgeDetailModal,
  RankError,
  RankHero,
  RankMedalsGrid,
  RankPath,
  RecentAchievementsList,
  Section,
} from "../components/rank";
import { AppText } from "../components/ui";
import { v2Breakpoints, v2FontWeight, v2Radius, v2Typography } from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useRankController } from "../hooks/useRankController";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RankScreen() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < v2Breakpoints.smallScreenMaxWidth;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    achievementSummary,
    badgePreview,
    badgeSortDirection,
    closestBadges,
    earnedBadgeIds,
    earnedBadges,
    error,
    gamification,
    levelInfo,
    loading,
    nextMilestone,
    nextRank,
    progressionSnapshot,
    rank,
    selectedAchievement,
    selectedBadge,
    setBadgeSortDirection,
    setReloadRequest,
    setSelectedAchievement,
    setSelectedBadge,
    setShowAllBadges,
    showAllBadges,
    visibleRankMilestones,
  } = useRankController();

  function toggleBadges() {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setShowAllBadges((value) => !value);
  }

  return (
    <GamificationScreen
      overlay={
        <>
          <BadgeDetailModal
            badge={selectedBadge?.badge}
            earned={selectedBadge?.earned}
            isSmallScreen={isSmallScreen}
            onClose={() => setSelectedBadge(null)}
            progress={selectedBadge?.progress}
            reduceMotion={reduceMotion}
            unlockedAt={selectedBadge?.unlockedAt}
            visible={Boolean(selectedBadge)}
          />
          <AchievementDetailModal
            achievement={selectedAchievement}
            isSmallScreen={isSmallScreen}
            onClose={() => setSelectedAchievement(null)}
            reduceMotion={reduceMotion}
            visible={Boolean(selectedAchievement)}
          />
        </>
      }
    >
        <GamificationHeader
          subtitle="Long-term progression through consistency."
          title="Rank"
        />

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <AppText style={styles.loadingText}>Preparing progression...</AppText>
          </View>
        ) : error ? (
          <RankError
            message={error}
            onRetry={() => setReloadRequest((value) => value + 1)}
          />
        ) : (
          <>
            <RankHero
              isSmallScreen={isSmallScreen}
              levelInfo={levelInfo}
              nextMilestone={nextMilestone}
              nextRank={nextRank}
              rank={rank}
            />

            <Section title="Rank path">
              <RankPath currentLevel={levelInfo.level} />
            </Section>

            <Section title="Rank medals">
              <RankMedalsGrid
                currentLevel={levelInfo.level}
                isSmallScreen={isSmallScreen}
                milestones={visibleRankMilestones}
              />
            </Section>

            <Section
              subtitle={`${achievementSummary.earnedCount} of ${achievementSummary.totalCount} unlocked`}
              title="Achievements"
            >
              <AchievementsSection
                badgePreview={badgePreview}
                badgeSortDirection={badgeSortDirection}
                closestBadges={closestBadges}
                earnedBadgeIds={earnedBadgeIds}
                earnedBadges={earnedBadges}
                isSmallScreen={isSmallScreen}
                onSelectBadge={setSelectedBadge}
                onToggleBadges={toggleBadges}
                progressionSnapshot={progressionSnapshot}
                recentAchievements={gamification?.recentAchievements}
                setBadgeSortDirection={setBadgeSortDirection}
                showAllBadges={showAllBadges}
                summary={achievementSummary}
              />
            </Section>

            <Section title="Recent achievements">
              <RecentAchievementsList
                achievements={gamification?.recentAchievements}
                onSelectAchievement={setSelectedAchievement}
              />
            </Section>
          </>
        )}

    </GamificationScreen>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    loadingCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      gap: 10,
      padding: 28,
    },
    loadingText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      textAlign: "center",
    },
  });
}
