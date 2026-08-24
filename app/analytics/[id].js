import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import {
  AnalyticsError,
  HabitAnalyticsHeader,
  HabitHeroSection,
  HabitMetricList,
  HabitMiniTrend,
  HabitRecentDaysGrid,
  HabitWeekCard,
  MilestoneCard,
} from "../../components/analytics";
import ProgressDots from "../../components/ProgressDots";
import {
  AppText,
  BackIcon,
  IconButton,
  ScreenShell,
  Section,
} from "../../components/ui";
import { v2Breakpoints, v2FontWeight, v2Layout, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { useTheme } from "../../context/ThemeContext";
import { useHabitAnalyticsController } from "../../hooks/useHabitAnalyticsController";

export default function IndividualAnalyticsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < v2Breakpoints.smallScreenMaxWidth;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    analytics,
    error,
    focusGuidance,
    guidance,
    habit,
    habitStrength,
    historyDays,
    loading,
    milestones,
    readiness,
    retry,
    scheduleAwareWeeklyProgress,
    weeklyPattern,
  } = useHabitAnalyticsController();

  return (
    <ScreenShell maxWidth={v2Layout.formMaxWidth}>
        <IconButton
          accessibilityLabel="Back to Analytics"
          color={colors.text}
          onPress={goBackToAnalytics}
          style={styles.backButton}
        >
          <BackIcon color={colors.text} />
        </IconButton>

        {!loading && error ? (
          <AnalyticsError message={error} onRetry={retry} />
        ) : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <AppText style={styles.loadingText}>Loading habit analytics...</AppText>
          </View>
        ) : null}

        {!loading && !habit ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Habit not found</AppText>
            <AppText style={styles.emptyText}>
              This habit may have been deleted.
            </AppText>
          </View>
        ) : null}

        {!loading && habit && analytics && readiness && weeklyPattern ? (
          <>
            <HabitAnalyticsHeader
              category={analytics.category}
              emoji={habit.emoji}
              isSmallScreen={isSmallScreen}
              name={habit.name}
            />

            <HabitHeroSection
              completionRate={analytics.completionRate}
              guidance={guidance}
              isSmallScreen={isSmallScreen}
              readiness={readiness}
            />

            <HabitMetricList
              bestStreak={analytics.bestStreak}
              completedCount={analytics.completedCount}
              currentStreak={analytics.currentStreak}
            />

            <View
              accessibilityLabel={`Focus guidance. ${focusGuidance}`}
              accessible
              style={styles.guidanceCard}
            >
              <AppText style={styles.guidanceLabel}>Focus</AppText>
              <AppText style={styles.guidanceText}>{focusGuidance}</AppText>
            </View>

            <Section title="This week">
              <HabitWeekCard
                isSmallScreen={isSmallScreen}
                pattern={weeklyPattern}
                strength={habitStrength}
              />
            </Section>

            {milestones ? (
              <Section title="Milestones">
                <MilestoneCard isSmallScreen={isSmallScreen} milestones={milestones} />
              </Section>
            ) : null}

            <Section title="Last 7 days">
              <View style={styles.weekCard}>
                <ProgressDots days={scheduleAwareWeeklyProgress} compact />
              </View>
            </Section>

            <Section title="Last 30 days">
              <HabitRecentDaysGrid days={historyDays} isSmallScreen={isSmallScreen} />
            </Section>

            {readiness.state === "ready" ? (
              <Section title="Trend">
                <HabitMiniTrend points={analytics.trend} />
              </Section>
            ) : null}
          </>
        ) : null}
    </ScreenShell>
  );
}

function goBackToAnalytics() {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }

  router.replace("/analytics");
}

function createStyles(colors) {
  return StyleSheet.create({
    backButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderColor: colors.border,
      marginBottom: v2Spacing.md,
    },
    guidanceCard: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.large,
      marginBottom: v2Spacing.xl,
      padding: v2Spacing.lg,
    },
    guidanceLabel: {
      color: colors.primary,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    guidanceText: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
    },
    weekCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.lg,
    },
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
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.xl,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    emptyText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
    },
  });
}
