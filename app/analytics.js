import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import BottomNav from "../components/BottomNav";
import ProgressDots from "../components/ProgressDots";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  pageTitleLineHeight,
  pageTitleSize,
  radius,
  spacing,
} from "../constants/typography";
import { useTheme } from "../context/ThemeContext";
import { getGamification } from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import { getAnalyticsSummary, getWeeklyProgress } from "../utils/habitStats";

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      async function loadAnalytics() {
        try {
          setError("");
          const [storedHabits, storedGamification] = await Promise.all([
            getHabits(),
            getGamification(),
          ]);

          setAnalytics(getAnalyticsSummary(storedHabits, storedGamification));
        } catch {
          setError("Could not load analytics. Please try again.");
        } finally {
          setLoading(false);
        }
      }

      loadAnalytics();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityLabel="Back to Progress"
          accessibilityRole="button"
          hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
          onPress={goBackToStats}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Progress</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>Analytics</Text>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>
            See patterns after you complete habits for a few days.
          </Text>
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : null}

        {!loading && analytics ? (
          <>
            <View style={styles.grid}>
              <MetricCard
                label="This week"
                value={analytics.habitsCompletedThisWeek}
                helper="completions"
                styles={styles}
              />
              <MetricCard
                label="This month"
                value={analytics.habitsCompletedThisMonth}
                helper="completions"
                styles={styles}
              />
              <MetricCard
                label="Total completions"
                value={analytics.totalCompletions}
                styles={styles}
              />
              <MetricCard
                label="Total XP"
                value={analytics.totalXpEarned}
                styles={styles}
              />
            </View>

            <View style={styles.summaryCard}>
              <SummaryRow
                label="Best category"
                value={analytics.bestCategory?.name || "None yet"}
                styles={styles}
              />
              <SummaryRow
                label="Most consistent"
                value={analytics.mostConsistentHabit?.habit.name || "None yet"}
                styles={styles}
              />
              <SummaryRow
                label="Weakest habit"
                value={analytics.weakestHabit?.habit.name || "None yet"}
                styles={styles}
              />
            </View>

            <Section title="Insights" styles={styles}>
              {analytics.insights.map((insight) => (
                <Text key={insight} style={styles.insightText}>
                  {insight}
                </Text>
              ))}
            </Section>

            <Section title="Individual habits" styles={styles}>
              {analytics.habitAnalytics.length === 0 ? (
                <Text style={styles.emptyText}>
                  Individual insights appear after you create and complete a habit.
                </Text>
              ) : (
                analytics.habitAnalytics.map((item) => (
                  <HabitAnalyticsCard
                    item={item}
                    key={item.habit.id}
                    styles={styles}
                  />
                ))
              )}
            </Section>
          </>
        ) : null}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

function MetricCard({ helper, label, styles, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {helper ? <Text style={styles.metricHelper}>{helper}</Text> : null}
    </View>
  );
}

function SummaryRow({ label, styles, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Section({ children, styles, title }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function HabitAnalyticsCard({ item, styles }) {
  const weeklyProgress = getWeeklyProgress(item.habit);

  return (
    <View style={styles.habitCard}>
      <View style={styles.habitHeader}>
        <View style={styles.habitTitleGroup}>
          <Text numberOfLines={1} style={styles.habitName}>
            {item.habit.name}
          </Text>
          <Text style={styles.habitCategory}>{item.category}</Text>
        </View>
        <View style={styles.ratePill}>
          <Text style={styles.ratePillValue}>{item.completionRate}%</Text>
          <Text style={styles.ratePillLabel}>rate</Text>
        </View>
      </View>

      <View style={styles.habitStatsRow}>
        <SmallStat
          label="Current streak"
          value={item.currentStreak}
          styles={styles}
        />
        <SmallStat
          label="Best streak"
          value={item.bestStreak}
          styles={styles}
        />
      </View>

      <View style={styles.weekProgressRow}>
        <Text style={styles.weekProgressLabel}>Last 7 days</Text>
        <ProgressDots days={weeklyProgress} compact />
      </View>
    </View>
  );
}

function SmallStat({ label, styles, value }) {
  return (
    <View style={styles.smallStat}>
      <Text style={styles.smallStatValue}>{value}</Text>
      <Text style={styles.smallStatLabel}>{label}</Text>
    </View>
  );
}

function goBackToStats() {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }

  router.replace("/stats");
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? 860 : "100%",
      padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
      paddingBottom: layout.screenBottomPadding,
      width: "100%",
    },
    header: {
      marginBottom: spacing.xl,
      paddingTop: spacing.sm,
    },
    backButton: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.round,
      borderWidth: 1,
      justifyContent: "center",
      marginBottom: spacing.lg,
      minHeight: layout.minTapTarget,
      paddingHorizontal: spacing.lg,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: pageTitleSize(isSmallScreen),
      fontWeight: fontWeight.bold,
      lineHeight: pageTitleLineHeight(isSmallScreen),
    },
    subtitle: {
      color: colors.muted,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.bodyLarge,
      marginTop: spacing.sm,
    },
    errorBanner: {
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.sm,
      color: colors.danger,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xl,
      borderWidth: 1,
      gap: 10,
      padding: 28,
    },
    loadingText: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    metricCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xl,
      borderWidth: 1,
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      padding: spacing.lg,
    },
    metricValue: {
      color: colors.primary,
      fontSize: isSmallScreen ? 28 : 32,
      fontWeight: fontWeight.bold,
    },
    metricLabel: {
      color: colors.text,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
      marginTop: spacing.sm,
    },
    metricHelper: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      marginTop: 3,
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xl,
      borderWidth: 1,
      marginTop: 14,
      padding: spacing.lg,
    },
    summaryRow: {
      alignItems: "center",
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      paddingVertical: 11,
    },
    summaryLabel: {
      color: colors.muted,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
    },
    summaryValue: {
      color: colors.text,
      flex: 1,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
      textAlign: "right",
    },
    section: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xl,
      borderWidth: 1,
      gap: spacing.md,
      marginTop: 14,
      padding: spacing.lg,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    insightText: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      color: colors.text,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
      padding: spacing.md,
    },
    emptyText: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.body,
    },
    habitCard: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.md,
      maxWidth: "100%",
      padding: spacing.md,
      width: "100%",
    },
    habitHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
    },
    habitTitleGroup: {
      flex: 1,
      minWidth: 0,
    },
    habitName: {
      color: colors.text,
      fontSize: fontSize.cardTitle,
      fontWeight: fontWeight.bold,
    },
    habitCategory: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      marginTop: 4,
    },
    ratePill: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: 999,
      overflow: "hidden",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    ratePillValue: {
      color: colors.primary,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    ratePillLabel: {
      color: colors.primary,
      fontSize: fontSize.tiny,
      fontWeight: fontWeight.medium,
      marginTop: -2,
    },
    habitStatsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    smallStat: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.sm,
      borderWidth: 1,
      flexBasis: "47%",
      flexGrow: 1,
      padding: spacing.md,
    },
    smallStatValue: {
      color: colors.text,
      fontSize: fontSize.cardTitle,
      fontWeight: fontWeight.bold,
    },
    smallStatLabel: {
      color: colors.muted,
      fontSize: fontSize.tiny,
      fontWeight: fontWeight.medium,
      marginTop: 3,
    },
    weekProgressRow: {
      gap: spacing.sm,
      maxWidth: "100%",
    },
    weekProgressLabel: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
      textTransform: "uppercase",
    },
  });
}
