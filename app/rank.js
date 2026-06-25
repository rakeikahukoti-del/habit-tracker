import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import BottomNav from "../components/BottomNav";
import { badgeTierColors, rarityColors, themes } from "../constants/colors";
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
import {
  badges,
  getGamification,
  getGamificationLevelInfo,
  getRankForLevel,
  rankThemes,
} from "../storage/gamificationStorage";

export default function RankScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
  const [gamification, setGamification] = useState(null);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadRank() {
        const storedGamification = await getGamification();

        setGamification(storedGamification);
        setLoading(false);
      }

      loadRank();
    }, [])
  );

  const levelInfo = getGamificationLevelInfo(gamification);
  const rank = getRankForLevel(levelInfo.level);
  const nextRank = getNextRankUnlock(levelInfo.level);
  const previousRank = getPreviousRankUnlock(levelInfo.level);
  const rankProgress = getUnlockProgress(levelInfo.level, previousRank, nextRank);
  const badgePreview = showAllBadges ? badges : badges.slice(0, 6);
  const unlockedThemes = rankThemes.filter(
    (theme) => levelInfo.level >= theme.unlockLevel
  );
  const lockedThemes = rankThemes.filter(
    (theme) => levelInfo.level < theme.unlockLevel
  );
  const nextTheme = lockedThemes[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Progress</Text>
          <Text style={styles.title}>Rank</Text>
          <Text style={styles.subtitle}>
            Track levels, badges, and unlocked themes.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading rank...</Text>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Current rank</Text>
              <Text style={styles.rankTitle}>{rank}</Text>
              <Text style={styles.levelText}>Level {levelInfo.level}</Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${levelInfo.currentLevelXp}%` },
                  ]}
                />
              </View>
              <Text style={styles.helperText}>
                {levelInfo.nextLevelXp} XP to level {levelInfo.level + 1}
              </Text>
              <Text style={styles.helperText}>
                {nextRank
                  ? `${nextRank.label} unlocks at level ${nextRank.unlockLevel}`
                  : "All rank themes unlocked."}
              </Text>
            </View>

            <Section title="Next unlock" styles={styles}>
              <View style={styles.unlockCard}>
                <View style={styles.unlockTop}>
                  <View>
                    <Text style={styles.unlockLabel}>Progress to next rank</Text>
                    <Text style={styles.unlockTitle}>
                      {nextRank ? nextRank.label : "Mastered"}
                    </Text>
                  </View>
                  <Text style={styles.unlockPercent}>{rankProgress}%</Text>
                </View>
                <View style={styles.unlockTrack}>
                  <View
                    style={[
                      styles.unlockFill,
                      { width: `${rankProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.unlockText}>
                  {nextRank
                    ? `${nextRank.unlockLevel - levelInfo.level} levels until ${nextRank.label}.`
                    : "You have unlocked every rank."}
                </Text>
                <Text style={styles.unlockText}>
                  {nextTheme
                    ? `Next theme unlock: ${nextTheme.label} at level ${nextTheme.unlockLevel}.`
                    : "Next theme unlock: all themes are available."}
                </Text>
                <Text style={styles.unlockReward}>
                  Next reward: {nextTheme ? `${nextTheme.label} theme` : "Master collection complete"}
                </Text>
              </View>
            </Section>

            <Section title="Unlocked themes" styles={styles}>
              <View style={styles.themeGrid}>
                {unlockedThemes.map((theme) => (
                  <ThemePreview key={theme.key} theme={theme} styles={styles} />
                ))}
              </View>
            </Section>

            <Section title="Locked themes" styles={styles}>
              <View style={styles.themeGrid}>
                {lockedThemes.length > 0 ? (
                  lockedThemes.map((theme) => (
                    <ThemePreview
                      key={theme.key}
                      locked
                      theme={theme}
                      styles={styles}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>No locked themes remain.</Text>
                )}
              </View>
            </Section>

            <Section title="Badges" styles={styles}>
              <View style={styles.badgeGrid}>
                {badgePreview.map((badge) => {
                  const earned = gamification?.earnedBadges?.includes(badge.id);

                  return (
                    <BadgeCard
                      badge={badge}
                      earned={earned}
                      key={badge.id}
                      onPress={() => setSelectedBadge({ badge, earned })}
                      styles={styles}
                    />
                  );
                })}
              </View>
              <Pressable
                onPress={() => setShowAllBadges((value) => !value)}
                style={styles.showBadgesButton}
              >
                <Text style={styles.showBadgesText}>
                  {showAllBadges ? "Show fewer badges ↑" : "Show all badges ↓"}
                </Text>
              </Pressable>
            </Section>

            <Section title="Recent achievements" styles={styles}>
              {gamification?.recentAchievements?.length > 0 ? (
                gamification.recentAchievements.slice(0, 8).map((achievement) => (
                  <AchievementRow
                    achievement={achievement}
                    key={achievement.id}
                    onPress={() => setSelectedAchievement(achievement)}
                    styles={styles}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>
                  Complete habits to build your achievement feed.
                </Text>
              )}
            </Section>
          </>
        )}
      </ScrollView>
      <BadgeDetailModal
        badge={selectedBadge?.badge}
        earned={selectedBadge?.earned}
        onClose={() => setSelectedBadge(null)}
        styles={styles}
        visible={Boolean(selectedBadge)}
      />
      <AchievementDetailModal
        achievement={selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
        styles={styles}
        visible={Boolean(selectedAchievement)}
      />
      <BottomNav />
    </SafeAreaView>
  );
}

function Section({ title, children, styles }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}


function ThemePreview({ locked = false, theme, styles }) {
  const previewColors = themes[theme.key];

  return (
    <View
      style={[
        styles.themePreview,
        {
          backgroundColor: previewColors.card,
          borderColor: previewColors.border,
        },
        locked && styles.themePreviewLocked,
      ]}
    >
      <View style={styles.themeDots}>
        <View
          style={[styles.themeDot, { backgroundColor: previewColors.primary }]}
        />
        <View
          style={[styles.themeDot, { backgroundColor: previewColors.accent }]}
        />
      </View>
      <Text style={[styles.themeName, { color: previewColors.text }]}>
        {locked ? "🔒 " : ""}
        {theme.label}
      </Text>
      <Text style={[styles.themeMeta, { color: previewColors.muted }]}>
        {locked ? `Level ${theme.unlockLevel}` : "Unlocked"}
      </Text>
    </View>
  );
}

function getNextRankUnlock(level) {
  return rankThemes.find((theme) => theme.unlockLevel > level);
}

function getPreviousRankUnlock(level) {
  return [...rankThemes]
    .reverse()
    .find((theme) => theme.unlockLevel <= level);
}

function getUnlockProgress(level, previousRank, nextRank) {
  if (!nextRank) {
    return 100;
  }

  const previousLevel = previousRank?.unlockLevel || 1;
  const totalLevels = nextRank.unlockLevel - previousLevel;
  const completedLevels = Math.max(0, level - previousLevel);

  if (totalLevels <= 0) {
    return 100;
  }

  return Math.min(100, Math.round((completedLevels / totalLevels) * 100));
}

function BadgeCard({ badge, earned, onPress, styles }) {
  const tierStyle = getBadgeTierStyle(badge.tier);
  const rarityStyle = getRarityStyle(badge.rarity);
  const textStyle = earned ? getBadgeTextStyle(badge.tier) : styles.badgeLockedText;

  return (
    <Pressable
      accessibilityLabel={`View ${badge.label} badge details`}
      onPress={onPress}
      style={[
        styles.badgeCard,
        tierStyle,
        !earned && styles.badgeLocked,
      ]}
    >
      <View style={styles.badgeCardTop}>
        <Text style={[styles.badgeName, textStyle]}>{badge.label}</Text>
        <Text style={[styles.badgeRarity, rarityStyle]}>{badge.rarity}</Text>
      </View>
      <Text style={[styles.badgeDescription, textStyle]} numberOfLines={2}>
        {badge.description}
      </Text>
      <Text style={[styles.badgeTier, textStyle]}>
        {earned ? badge.tier : "Locked"}
      </Text>
    </Pressable>
  );
}

function getBadgeTierStyle(tier) {
  const tierColors = badgeTierColors[tier] || badgeTierColors.Bronze;

  return {
    backgroundColor: tierColors.background,
    borderColor: tierColors.border,
  };
}

function getBadgeIconStyle(tier) {
  const tierColors = badgeTierColors[tier] || badgeTierColors.Bronze;

  return {
    backgroundColor: tierColors.iconBackground,
    borderColor: tierColors.border,
  };
}

function getBadgeTextStyle(tier) {
  const tierColors = badgeTierColors[tier] || badgeTierColors.Bronze;

  return {
    color: tierColors.text,
  };
}

function getRarityStyle(rarity) {
  const rarityColor = rarityColors[rarity] || rarityColors.Common;

  return {
    backgroundColor: rarityColor.background,
    color: rarityColor.text,
  };
}

function BadgeDetailModal({ badge, earned, onClose, styles, visible }) {
  if (!badge) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.badgeModalBackdrop}>
        <View style={styles.badgeModalCard}>
          <View style={[styles.badgeModalIcon, getBadgeIconStyle(badge.tier)]}>
            <Text
              style={[
                styles.badgeModalIconText,
                getBadgeTextStyle(badge.tier),
              ]}
            >
              {earned ? getBadgeIcon(badge.tier) : "○"}
            </Text>
          </View>
          <Text style={styles.badgeModalEyebrow}>
            {earned ? "Earned badge" : "Locked badge"}
          </Text>
          <Text style={styles.badgeModalTitle}>{badge.label}</Text>
          <Text style={styles.badgeModalDescription}>
            {badge.description}
          </Text>
          <View style={styles.badgeModalMetaRow}>
            <Text style={styles.badgeModalMeta}>{badge.tier}</Text>
            <Text style={styles.badgeModalMeta}>{badge.rarity}</Text>
          </View>
          {!earned ? (
            <Text style={styles.badgeModalRequirement}>
              Unlock requirement: {badge.description}
            </Text>
          ) : null}
          <Pressable onPress={onClose} style={styles.badgeModalButton}>
            <Text style={styles.badgeModalButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getBadgeIcon(tier) {
  if (tier === "Master") {
    return "◆";
  }

  if (tier === "Diamond") {
    return "◇";
  }

  if (tier === "Platinum") {
    return "✦";
  }

  if (tier === "Gold") {
    return "★";
  }

  if (tier === "Silver") {
    return "●";
  }

  return "◉";
}

function AchievementRow({ achievement, onPress, styles }) {
  return (
    <Pressable
      accessibilityLabel={`View ${achievement.title} achievement details`}
      onPress={onPress}
      style={styles.achievementRow}
    >
      <View style={styles.achievementIcon}>
        <Text style={styles.achievementIconText}>
          {getAchievementIcon(achievement.type)}
        </Text>
      </View>
      <View style={styles.achievementText}>
        <Text style={styles.achievementTitle}>{achievement.title}</Text>
        <Text style={styles.achievementDescription}>
          {achievement.description}
        </Text>
      </View>
      <Text style={styles.achievementType}>{formatAchievementType(achievement.type)}</Text>
    </Pressable>
  );
}

function AchievementDetailModal({ achievement, onClose, styles, visible }) {
  if (!achievement) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.badgeModalBackdrop}>
        <View style={styles.badgeModalCard}>
          <View style={styles.achievementModalIcon}>
            <Text style={styles.achievementModalIconText}>
              {getAchievementIcon(achievement.type)}
            </Text>
          </View>
          <Text style={styles.badgeModalEyebrow}>Recent achievement</Text>
          <Text style={styles.badgeModalTitle}>{achievement.title}</Text>
          <Text style={styles.badgeModalDescription}>
            {achievement.description}
          </Text>
          <View style={styles.badgeModalMetaRow}>
            <Text style={styles.badgeModalMeta}>
              {formatAchievementType(achievement.type)}
            </Text>
            <Text style={styles.badgeModalMeta}>
              {formatAchievementDate(achievement.unlockedAt)}
            </Text>
          </View>
          {achievement.habitName ? (
            <Text style={styles.badgeModalRequirement}>
              Habit: {achievement.habitName}
            </Text>
          ) : null}
          {achievement.xp ? (
            <Text style={styles.badgeModalRequirement}>
              Reward: +{achievement.xp} XP
            </Text>
          ) : null}
          <Pressable onPress={onClose} style={styles.badgeModalButton}>
            <Text style={styles.badgeModalButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getAchievementIcon(type) {
  if (type === "badge") {
    return "◆";
  }

  if (type === "perfect-day") {
    return "★";
  }

  if (type === "theme") {
    return "✦";
  }

  if (type === "level") {
    return "▲";
  }

  return "●";
}

function formatAchievementType(type) {
  return String(type || "milestone").replace("-", " ");
}

function formatAchievementDate(dateString) {
  if (!dateString) {
    return "Recently";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function createStyles(colors, { isSmallScreen, isTablet }) {
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
      marginTop: 8,
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
    heroCard: {
      backgroundColor: colors.primaryDark,
      borderRadius: radius.xxl,
      gap: 10,
      marginBottom: 16,
      padding: 20,
    },
    heroLabel: {
      color: colors.heroMuted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
      textTransform: "uppercase",
    },
    rankTitle: {
      color: colors.inverseText,
      fontSize: isSmallScreen ? 32 : 34,
      fontWeight: fontWeight.bold,
    },
    levelText: {
      color: colors.heroSoftText,
      fontSize: fontSize.cardTitle,
      fontWeight: fontWeight.bold,
    },
    track: {
      backgroundColor: colors.heroBadge,
      borderRadius: 999,
      height: 12,
      overflow: "hidden",
    },
    fill: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      height: "100%",
    },
    helperText: {
      color: colors.heroSoftText,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
    },
    unlockCard: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: 10,
      padding: 14,
    },
    unlockTop: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
    },
    unlockLabel: {
      color: colors.muted,
      fontSize: fontSize.tiny,
      fontWeight: fontWeight.bold,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    unlockTitle: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    unlockPercent: {
      color: colors.primary,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    unlockTrack: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 12,
      overflow: "hidden",
    },
    unlockFill: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      height: "100%",
    },
    unlockText: {
      color: colors.muted,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
      lineHeight: 19,
    },
    unlockReward: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      lineHeight: 19,
    },
    section: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xl,
      borderWidth: 1,
      marginBottom: 14,
      padding: spacing.lg,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
      marginBottom: 12,
    },
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    themePreview: {
      borderRadius: 18,
      borderWidth: 1,
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      minHeight: 100,
      padding: 14,
    },
    themePreviewLocked: {
      opacity: 0.58,
    },
    themeDots: {
      flexDirection: "row",
      gap: 6,
      marginBottom: 12,
    },
    themeDot: {
      borderRadius: 999,
      height: 16,
      width: 16,
    },
    themeName: {
      fontSize: fontSize.cardTitle,
      fontWeight: fontWeight.bold,
    },
    themeMeta: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
      marginTop: 4,
    },
    badgeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    showBadgesButton: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: "center",
      marginTop: 12,
      minHeight: 44,
    },
    showBadgesText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: fontWeight.bold,
    },
    badgeCard: {
      borderWidth: 1,
      borderRadius: radius.lg,
      flexBasis: isSmallScreen ? "100%" : "47%",
      flexGrow: 1,
      gap: spacing.sm,
      maxWidth: "100%",
      minHeight: 106,
      minWidth: 0,
      padding: spacing.md,
    },
    badgeCardTop: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
    },
    badgeTier: {
      fontSize: fontSize.tiny,
      fontWeight: fontWeight.bold,
      opacity: 0.74,
      minWidth: 0,
      textTransform: "uppercase",
    },
    badgeRarity: {
      borderRadius: 999,
      overflow: "hidden",
      paddingHorizontal: 8,
      paddingVertical: 3,
      fontSize: 8,
      fontWeight: fontWeight.bold,
      textTransform: "uppercase",
    },
    badgeName: {
      flex: 1,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.body,
      minWidth: 0,
    },
    badgeDescription: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.caption,
    },
    badgeLocked: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
    },
    badgeLockedText: {
      color: colors.muted,
    },
    emptyText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: fontWeight.medium,
      lineHeight: 19,
    },
    achievementRow: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      padding: 12,
    },
    badgeModalBackdrop: {
      alignItems: "center",
      backgroundColor: colors.modalBackdrop,
      flex: 1,
      justifyContent: "center",
      padding: 20,
    },
    badgeModalCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      maxWidth: 390,
      padding: 20,
      width: "100%",
    },
    badgeModalIcon: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 58,
      justifyContent: "center",
      marginBottom: 12,
      width: 58,
    },
    badgeModalIconText: {
      color: colors.primary,
      fontSize: 26,
      fontWeight: fontWeight.bold,
    },
    badgeModalEyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: fontWeight.bold,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    badgeModalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: fontWeight.bold,
      textAlign: "center",
    },
    badgeModalDescription: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
      marginTop: 8,
      textAlign: "center",
    },
    badgeModalMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginTop: 14,
    },
    badgeModalMeta: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      color: colors.text,
      fontSize: 11,
      fontWeight: fontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: 10,
      paddingVertical: 5,
      textTransform: "uppercase",
    },
    badgeModalRequirement: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
      marginTop: 12,
      textAlign: "center",
    },
    badgeModalButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: 16,
      justifyContent: "center",
      marginTop: 18,
      minHeight: 46,
      width: "100%",
    },
    badgeModalButtonText: {
      color: colors.inverseText,
      fontSize: 14,
      fontWeight: fontWeight.bold,
    },
    achievementIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: 14,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    achievementIconText: {
      color: colors.primary,
      fontSize: 19,
      fontWeight: fontWeight.bold,
    },
    achievementModalIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 58,
      justifyContent: "center",
      marginBottom: 12,
      width: 58,
    },
    achievementModalIconText: {
      color: colors.primary,
      fontSize: 26,
      fontWeight: fontWeight.bold,
    },
    achievementText: {
      flex: 1,
      minWidth: 0,
    },
    achievementTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: fontWeight.bold,
    },
    achievementDescription: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: fontWeight.medium,
      lineHeight: 17,
      marginTop: 3,
    },
    achievementType: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: fontWeight.bold,
      textTransform: "uppercase",
    },
  });
}
