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
import GamificationPanel from "../components/GamificationPanel";
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
import { getStatsSummary } from "../utils/habitStats";

export default function StatsScreen() {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const styles = createStyles(colors, {
    isLandscape,
    isSmallScreen,
    isTablet,
  });
  const [habits, setHabits] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      async function loadHabits() {
        try {
          setError("");
          const [storedHabits, storedGamification] = await Promise.all([
            getHabits(),
            getGamification(),
          ]);

          setHabits(storedHabits);
          setGamification(storedGamification);
        } catch {
          setError("Could not load stats. Go back and try again.");
        } finally {
          setLoading(false);
        }
      }

      loadHabits();
    }, [])
  );

  const stats = getStatsSummary(habits);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Stats</Text>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>
            Review completions, streaks, weekly activity, and level progress.
          </Text>
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : null}

        {!loading ? (
          <>
            <SectionHeader
              title="Overview"
              subtitle="Today and streaks"
              styles={styles}
            />
            <View style={styles.grid}>
              <StatCard
                label="Total habits"
                value={stats.totalHabits}
                styles={styles}
              />
              <StatCard
                label="Done today"
                value={stats.completedToday}
                styles={styles}
              />
              <StatCard
                label="Longest now"
                value={stats.currentLongestStreak}
                suffix="days"
                styles={styles}
              />
              <StatCard
                label="Best streak"
                value={stats.bestAllTimeStreak}
                suffix="days"
                styles={styles}
              />
            </View>

            <Pressable
              onPress={() => router.push("/analytics")}
              style={styles.analyticsLinkCard}
            >
              <View style={styles.analyticsLinkText}>
                <Text style={styles.analyticsLinkLabel}>Analytics</Text>
                <Text style={styles.analyticsLinkTitle}>
                  Deeper habit insights
                </Text>
                <Text style={styles.analyticsLinkHelper}>
                  Completion rates, trends, categories, and strongest habits.
                </Text>
              </View>
              <Text style={styles.analyticsLinkArrow}>{">"}</Text>
            </Pressable>
          </>
        ) : null}

        {!loading ? (
          <View style={styles.gamificationWrap}>
            <SectionHeader
              title="Level and badges"
              subtitle="XP from completed habits"
              styles={styles}
            />
            <GamificationPanel gamification={gamification} />
          </View>
        ) : null}

        {!loading ? <View style={styles.featureCard}>
          <View>
            <Text style={styles.featureLabel}>Weekly completion</Text>
            <Text style={styles.featureValue}>
              {stats.weeklyCompletionPercentage}%
            </Text>
          </View>
          <Text style={styles.featureHint}>
            {stats.completedToday}/{stats.totalHabits} completed today
          </Text>
        </View> : null}

        {!loading ? (
          <View style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <Text style={styles.sectionTitle}>Weekly activity</Text>
              <Text style={styles.sectionMeta}>Last 7 days</Text>
            </View>

            {stats.weeklySummary.map((day) => (
              <View key={day.dateKey} style={styles.weekRow}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${day.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.dayValue}>
                  {day.completedCount}/{day.totalHabits}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

function StatCard({ label, value, suffix, styles }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {suffix ? <Text style={styles.statSuffix}>{suffix}</Text> : null}
    </View>
  );
}

function SectionHeader({ title, subtitle, styles }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      <Text style={styles.sectionHeaderSubtitle}>{subtitle}</Text>
    </View>
  );
}

function createStyles(colors, { isLandscape, isSmallScreen, isTablet }) {
  const useWideCards = isTablet || (isLandscape && !isSmallScreen);

  return StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    alignSelf: "center",
    maxWidth: isTablet ? layout.maxContentWidth : "100%",
    padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
    paddingBottom: layout.screenBottomPadding,
    width: "100%",
  },
  header: {
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderTitle: {
    color: colors.text,
    fontSize: fontSize.section,
    fontWeight: fontWeight.bold,
  },
  sectionHeaderSubtitle: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    marginTop: 3,
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
  statCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: useWideCards || !isSmallScreen ? "47%" : "100%",
    flexGrow: 1,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
  },
  statValue: {
    color: colors.primary,
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
  statSuffix: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    marginTop: 3,
  },
  gamificationWrap: {
    marginTop: spacing.xl,
  },
  analyticsLinkCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    marginTop: 14,
    padding: spacing.lg,
  },
  analyticsLinkText: {
    flex: 1,
    minWidth: 0,
  },
  analyticsLinkLabel: {
    color: colors.primary,
    fontSize: fontSize.tiny,
    fontWeight: fontWeight.bold,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  analyticsLinkTitle: {
    color: colors.text,
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.bold,
  },
  analyticsLinkHelper: {
    color: colors.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
    marginTop: 5,
  },
  analyticsLinkArrow: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: fontWeight.bold,
  },
  featureCard: {
    alignItems: isSmallScreen ? "flex-start" : "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xxl,
    flexDirection: isSmallScreen ? "column" : "row",
    gap: 14,
    justifyContent: "space-between",
    marginTop: 16,
    padding: 18,
  },
  featureLabel: {
    color: colors.heroMuted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
    marginBottom: 5,
  },
  featureValue: {
    color: colors.inverseText,
    fontSize: isSmallScreen ? 30 : 34,
    fontWeight: fontWeight.bold,
  },
  featureHint: {
    color: colors.heroSoftText,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    maxWidth: isSmallScreen ? "100%" : 170,
    textAlign: isSmallScreen ? "left" : "right",
  },
  weekCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xxl,
    borderWidth: 1,
    marginTop: 16,
    padding: spacing.xl,
  },
  weekHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.section,
    fontWeight: fontWeight.bold,
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  weekRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 9,
  },
  dayLabel: {
    color: colors.text,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
    width: 24,
  },
  progressTrack: {
    backgroundColor: colors.inputBackground,
    borderRadius: 999,
    flex: 1,
    height: 12,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: "100%",
  },
  dayValue: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    textAlign: "right",
    minWidth: 38,
  },
  });
}
