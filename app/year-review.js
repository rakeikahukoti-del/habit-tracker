import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AnalyticsScreen, {
  AnalyticsHeader,
} from "../components/analytics/AnalyticsScreen";
import { AppIcon, AppText, BackIcon, IconButton } from "../components/ui";
import { useTheme } from "../context/ThemeContext";
import { useEntranceAnimation } from "../hooks/useEntranceAnimation";
import {
  v2FontWeight,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { getGamification } from "../storage/gamificationStorage";
import { getHabits } from "../storage/habitsStorage";
import { getAvailableActivityYears } from "../utils/activityHistory";
import { getYearInReview } from "../utils/yearInReview";

export default function YearReviewScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );
  const [habits, setHabits] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadReviewData() {
        try {
          setError("");
          const [storedHabits, storedGamification] = await Promise.all([
            getHabits(),
            getGamification(),
          ]);

          if (!isActive) {
            return;
          }

          setHabits(storedHabits);
          setGamification(storedGamification);
        } catch {
          if (isActive) {
            setError("Could not load your year in review.");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadReviewData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const years = useMemo(() => getAvailableActivityYears(habits), [habits]);
  const review = useMemo(
    () => getYearInReview(habits, gamification, selectedYear),
    [gamification, habits, selectedYear]
  );

  return (
    <AnalyticsScreen bottomNav>
      <View style={styles.topBar}>
        <IconButton
          accessibilityLabel="Back to Progress"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/stats");
            }
          }}
        >
          <BackIcon color={colors.text} />
        </IconButton>
      </View>

      <AnalyticsHeader
        subtitle="A deterministic summary built from your local habit history."
        title="Year in Review"
      />

      {years.length > 1 ? (
        <YearPicker
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          styles={styles}
          years={years}
        />
      ) : null}

      {error ? <AppText style={styles.errorBanner}>{error}</AppText> : null}

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
          <AppText style={styles.loadingText}>Building your review...</AppText>
        </View>
      ) : null}

      {!loading && !review.hasData ? (
        <YearReviewEmptyState
          colors={colors}
          selectedYear={selectedYear}
          styles={styles}
        />
      ) : null}

      {!loading && review.hasData ? (
        <>
          <SummaryCard colors={colors} review={review} styles={styles} />
          <Section title="Highlights" styles={styles}>
            <MetricGrid review={review} styles={styles} />
          </Section>
          <Section title="Reflections" styles={styles}>
            <ReflectionList reflections={review.reflections} styles={styles} />
          </Section>
          <Section title="Monthly breakdown" styles={styles}>
            <MonthlyBreakdown months={review.monthlyBreakdown} styles={styles} />
          </Section>
          <Section title="Milestones" styles={styles}>
            <MilestoneList milestones={review.milestones} styles={styles} />
          </Section>
          <Section title="Summary preview" styles={styles}>
            <ShareablePreview review={review} styles={styles} />
          </Section>
        </>
      ) : null}
    </AnalyticsScreen>
  );
}

function YearReviewEmptyState({ colors, selectedYear, styles }) {
  const entrance = useEntranceAnimation();

  return (
    <Animated.View
      accessible
      accessibilityLabel="No yearly habit history yet."
      style={[styles.emptyCard, entrance.style]}
    >
      <View style={styles.emptyIconCircle}>
        <AppIcon color={colors.primary} name="flame" size={22} strokeWidth={2} />
      </View>
      <AppText style={styles.emptyTitle}>
        No review yet — this fills in as you complete habits
      </AppText>
      <AppText style={styles.emptyText}>
        Complete habits during {selectedYear} and Momentum will build a
        yearly summary from your saved history.
      </AppText>
    </Animated.View>
  );
}

function YearPicker({ selectedYear, setSelectedYear, styles, years }) {
  return (
    <View accessibilityRole="tablist" style={styles.yearPicker}>
      {years.map((year) => {
        const selected = year === selectedYear;

        return (
          <Pressable
            accessibilityLabel={`${year} year review`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={year}
            onPress={() => setSelectedYear(year)}
            style={({ pressed }) => [
              styles.yearPill,
              selected && styles.yearPillSelected,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              style={[styles.yearText, selected && styles.yearTextSelected]}
            >
              {year}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function SummaryCard({ colors, review, styles }) {
  return (
    <View
      accessible
      accessibilityLabel={`${review.year} review. ${review.totalCompletions} completions across ${review.activeDays} active days.`}
      style={styles.summaryCard}
    >
      <AppText style={styles.eyebrow}>{review.year}</AppText>
      <AppText style={styles.summaryTitle}>Small habits, visible progress.</AppText>
      <View style={styles.summaryStats}>
        <SummaryStat label="Completions" styles={styles} value={review.totalCompletions} />
        <SummaryStat label="Active days" styles={styles} value={review.activeDays} />
        <SummaryStat label="Longest streak" styles={styles} value={review.longestStreak} />
      </View>
      <View style={styles.rankRow}>
        <AppIcon color={colors.primary} name="rank" size={18} />
        <AppText style={styles.rankText}>
          Level {review.level} • {review.currentRank}
        </AppText>
      </View>
    </View>
  );
}

function SummaryStat({ label, styles, value }) {
  return (
    <View style={styles.summaryStat}>
      <AppText style={styles.summaryValue}>{value}</AppText>
      <AppText style={styles.summaryLabel}>{label}</AppText>
    </View>
  );
}

function Section({ children, styles, title }) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {children}
    </View>
  );
}

function MetricGrid({ review, styles }) {
  const metrics = [
    {
      label: "Best month",
      value: review.bestMonth?.label || "None",
      caption: review.bestMonth
        ? `${review.bestMonth.completedCount} completions`
        : "No completions",
    },
    {
      label: "Most consistent",
      value: review.mostConsistentMonth?.label || "None",
      caption: review.mostConsistentMonth
        ? `${review.mostConsistentMonth.completionRate}% completion`
        : "No scheduled history",
    },
    {
      label: "Top habit",
      value: review.mostCompletedHabit?.name || "None",
      caption: review.mostCompletedHabit
        ? `${review.mostCompletedHabit.completedCount} completions`
        : "No completions",
    },
    {
      label: "XP from habits",
      value: review.totalXpEarned,
      caption: "Completion and perfect-day XP",
    },
  ];

  return (
    <View style={styles.metricGrid}>
      {metrics.map((metric) => (
        <View key={metric.label} style={styles.metricCard}>
          <AppText style={styles.metricLabel}>{metric.label}</AppText>
          <AppText numberOfLines={2} style={styles.metricValue}>
            {metric.value}
          </AppText>
          <AppText style={styles.metricCaption}>{metric.caption}</AppText>
        </View>
      ))}
    </View>
  );
}

function ReflectionList({ reflections, styles }) {
  if (reflections.length === 0) {
    return (
      <AppText style={styles.emptyInline}>
        Reflection cards appear once your history has enough saved completions.
      </AppText>
    );
  }

  return (
    <View style={styles.list}>
      {reflections.map((reflection) => (
        <View
          accessible
          accessibilityLabel={reflection.text}
          key={reflection.id}
          style={styles.reflectionCard}
        >
          <AppText style={styles.reflectionText}>{reflection.text}</AppText>
        </View>
      ))}
    </View>
  );
}

function MonthlyBreakdown({ months, styles }) {
  return (
    <View style={styles.list}>
      {months.map((month) => (
        <View
          accessible
          accessibilityLabel={`${month.label}. ${month.completedCount} completions. ${month.completionRate}% completion rate.`}
          key={month.key}
          style={styles.monthRow}
        >
          <View style={styles.monthText}>
            <AppText style={styles.monthName}>{month.label}</AppText>
            <AppText style={styles.monthCaption}>
              {month.activeDays} active days • {month.bestStreak} best streak
            </AppText>
          </View>
          <View style={styles.monthMetric}>
            <AppText style={styles.monthRate}>{month.completionRate}%</AppText>
            <AppText style={styles.monthCount}>
              {month.completedCount} done
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

function MilestoneList({ milestones, styles }) {
  if (milestones.length === 0) {
    return (
      <AppText style={styles.emptyInline}>
        Milestones appear when they are supported by your saved history.
      </AppText>
    );
  }

  return (
    <View style={styles.list}>
      {milestones.map((milestone) => (
        <View
          accessible
          accessibilityLabel={`${milestone.title}. ${milestone.description}`}
          key={milestone.id}
          style={styles.milestoneCard}
        >
          <View style={styles.timelineDot} />
          <View style={styles.milestoneBody}>
            <AppText style={styles.milestoneTitle}>{milestone.title}</AppText>
            <AppText style={styles.milestoneText}>
              {milestone.description}
            </AppText>
            {milestone.dateKey ? (
              <AppText style={styles.milestoneDate}>
                {formatDateKey(milestone.dateKey)}
              </AppText>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function ShareablePreview({ review, styles }) {
  return (
    <View
      accessible
      accessibilityLabel={`${review.year} summary preview with ${review.totalCompletions} completions, ${review.activeDays} active days, and a ${review.longestStreak} day longest streak.`}
      style={styles.previewCard}
    >
      <AppText style={styles.previewEyebrow}>Momentum</AppText>
      <AppText style={styles.previewTitle}>{review.year} in Review</AppText>
      <AppText style={styles.previewText}>
        {review.totalCompletions} completions • {review.activeDays} active days •{" "}
        {review.longestStreak} day longest streak
      </AppText>
      <AppText style={styles.previewFooter}>
        Current rank: {review.currentRank}
      </AppText>
    </View>
  );
}

function formatDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    topBar: {
      marginBottom: v2Spacing.sm,
    },
    yearPicker: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      marginBottom: v2Spacing.xl,
    },
    yearPill: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      minHeight: 40,
      paddingHorizontal: v2Spacing.lg,
      justifyContent: "center",
    },
    yearPillSelected: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    yearText: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    yearTextSelected: {
      color: colors.background,
    },
    errorBanner: {
      backgroundColor: colors.surface,
      borderRadius: v2Radius.medium,
      color: colors.text,
      marginBottom: v2Spacing.lg,
      padding: v2Spacing.md,
    },
    loadingCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      gap: v2Spacing.md,
      padding: v2Spacing.xl,
    },
    loadingText: {
      color: colors.muted,
      fontSize: v2Typography.bodySupporting.fontSize,
      fontWeight: v2FontWeight.medium,
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.xl,
    },
    emptyIconCircle: {
      alignItems: "center",
      backgroundColor: colors.accentSoft,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      height: 56,
      justifyContent: "center",
      marginBottom: v2Spacing.md,
      width: 56,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: v2Spacing.sm,
    },
    emptyText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.feature,
      marginBottom: v2Spacing.xl,
      padding: isSmallScreen ? v2Spacing.lg : v2Spacing.xl,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      letterSpacing: 0.8,
      marginBottom: v2Spacing.sm,
      textTransform: "uppercase",
    },
    summaryTitle: {
      color: colors.text,
      fontSize: isSmallScreen ? 24 : v2Typography.screenTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 30 : v2Typography.screenTitle.lineHeight,
    },
    summaryStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      marginTop: v2Spacing.xl,
    },
    summaryStat: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexBasis: "30%",
      flexGrow: 1,
      minWidth: 96,
      padding: v2Spacing.md,
    },
    summaryValue: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.sectionTitle.lineHeight,
    },
    summaryLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 2,
    },
    rankRow: {
      alignItems: "center",
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.sm,
      marginTop: v2Spacing.lg,
      paddingTop: v2Spacing.md,
    },
    rankText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    section: {
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    metricGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    metricCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      flexBasis: "47%",
      flexGrow: 1,
      minWidth: 136,
      padding: v2Spacing.lg,
    },
    metricLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: v2Spacing.sm,
      textTransform: "uppercase",
    },
    metricValue: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.sectionTitle.lineHeight,
    },
    metricCaption: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: v2Spacing.xs,
    },
    list: {
      gap: v2Spacing.md,
    },
    reflectionCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      padding: v2Spacing.lg,
    },
    reflectionText: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
    },
    emptyInline: {
      color: colors.muted,
      fontSize: v2Typography.bodySupporting.fontSize,
      lineHeight: v2Typography.bodySupporting.lineHeight,
    },
    monthRow: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 70,
      padding: v2Spacing.lg,
    },
    monthText: {
      flex: 1,
      minWidth: 0,
    },
    monthName: {
      color: colors.text,
      fontSize: v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    monthCaption: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: 3,
    },
    monthMetric: {
      alignItems: "flex-end",
      flexShrink: 0,
      minWidth: 64,
    },
    monthRate: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    monthCount: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      marginTop: 2,
    },
    milestoneCard: {
      backgroundColor: colors.card,
      borderRadius: v2Radius.large,
      flexDirection: "row",
      gap: v2Spacing.md,
      padding: v2Spacing.lg,
    },
    timelineDot: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      height: 10,
      marginTop: 5,
      width: 10,
    },
    milestoneBody: {
      flex: 1,
      minWidth: 0,
    },
    milestoneTitle: {
      color: colors.text,
      fontSize: v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.cardTitle.lineHeight,
    },
    milestoneText: {
      color: colors.muted,
      fontSize: v2Typography.bodySupporting.fontSize,
      lineHeight: v2Typography.bodySupporting.lineHeight,
      marginTop: v2Spacing.xs,
    },
    milestoneDate: {
      color: colors.primary,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.sm,
    },
    previewCard: {
      backgroundColor: colors.text,
      borderRadius: v2Radius.feature,
      padding: v2Spacing.xl,
    },
    previewEyebrow: {
      color: colors.background,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      letterSpacing: 1,
      opacity: 0.72,
      textTransform: "uppercase",
    },
    previewTitle: {
      color: colors.background,
      fontSize: v2Typography.screenTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.screenTitle.lineHeight,
      marginTop: v2Spacing.md,
    },
    previewText: {
      color: colors.background,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.lg,
      opacity: 0.9,
    },
    previewFooter: {
      color: colors.background,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.xl,
      opacity: 0.82,
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.98 }],
    },
  });
}
