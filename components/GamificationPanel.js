import { useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { badgeTierColors, rarityColors } from "../constants/colors";
import {
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  spacing,
} from "../constants/typography";
import {
  badges,
  getGamificationLevelInfo,
  getRankForLevel,
  XP_PER_LEVEL,
} from "../storage/gamificationStorage";
import { useTheme } from "../context/ThemeContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function GamificationPanel({ gamification }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const levelInfo = getGamificationLevelInfo(gamification);
  const rank = getRankForLevel(levelInfo.level);
  const earnedBadges = badges.filter((badge) =>
    gamification?.earnedBadges?.includes(badge.id)
  );
  const badgePreview = showAllBadges ? earnedBadges : earnedBadges.slice(0, 6);

  function toggleBadges() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllBadges((value) => !value);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Level {levelInfo.level}</Text>
          <Text style={styles.title}>{levelInfo.xp} XP</Text>
        </View>
        <View style={styles.rankPill}>
          <Text style={styles.rankText}>{rank}</Text>
          <Text style={styles.nextLevel}>
            {levelInfo.nextLevelXp} XP to next
          </Text>
        </View>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${(levelInfo.currentLevelXp / XP_PER_LEVEL) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.badges}>
        {earnedBadges.length > 0 ? (
          badgePreview.map((badge) => (
            <Pressable
              accessibilityLabel={`View ${badge.label} badge details`}
              key={badge.id}
              onPress={() => setSelectedBadge({ badge, earned: true })}
              style={({ pressed }) => [
                styles.badge,
                getBadgeTierStyle(badge.tier),
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.badgeTop}>
                <Text style={[styles.badgeLabel, getBadgeTextStyle(badge.tier)]}>
                  {badge.label}
                </Text>
                <Text
                  style={[
                    styles.badgeRarity,
                    getRarityStyle(badge.rarity),
                  ]}
                >
                  {badge.rarity}
                </Text>
              </View>
              <Text
                style={[styles.badgeDescription, getBadgeTextStyle(badge.tier)]}
                numberOfLines={2}
              >
                {badge.description}
              </Text>
              <Text style={[styles.badgeTier, getBadgeTextStyle(badge.tier)]}>
                {badge.tier}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>Earn badges as you build momentum.</Text>
        )}
      </View>

      {earnedBadges.length > 6 ? (
        <Pressable
          onPress={toggleBadges}
          style={({ pressed }) => [
            styles.showBadgesButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.showBadgesText}>
            {showAllBadges ? "Show fewer badges" : "Show all badges"}
          </Text>
        </Pressable>
      ) : null}

      <BadgeDetailModal
        badge={selectedBadge?.badge}
        earned={selectedBadge?.earned}
        onClose={() => setSelectedBadge(null)}
        styles={styles}
        visible={Boolean(selectedBadge)}
      />
    </View>
  );
}

function BadgeDetailModal({ badge, earned, onClose, styles, visible }) {
  if (!badge) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalEyebrow}>
            {earned ? "Earned badge" : "Locked badge"}
          </Text>
          <Text style={styles.modalTitle}>{badge.label}</Text>
          <Text style={styles.modalDescription}>{badge.description}</Text>
          <View style={styles.modalMetaRow}>
            <Text style={styles.modalMeta}>{badge.tier}</Text>
            <Text style={styles.modalMeta}>{badge.rarity}</Text>
          </View>
          {!earned ? (
            <Text style={styles.modalRequirement}>
              Unlock requirement: {badge.description}
            </Text>
          ) : null}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.modalButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getBadgeTierStyle(tier) {
  const tierColors = badgeTierColors[tier] || badgeTierColors.Bronze;

  return {
    backgroundColor: tierColors.background,
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

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xl,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.lg,
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "space-between",
    },
    label: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      marginBottom: 3,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: fontWeight.bold,
    },
    nextLevel: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.medium,
    },
    rankPill: {
      alignItems: "flex-end",
      gap: 3,
    },
    rankText: {
      color: colors.accent,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
    },
    track: {
      backgroundColor: colors.inputBackground,
      borderRadius: 999,
      height: 10,
      overflow: "hidden",
    },
    fill: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      height: "100%",
    },
    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.lg,
    },
    badge: {
      borderRadius: radius.lg,
      borderWidth: 1,
      flexBasis: "100%",
      gap: spacing.sm,
      maxWidth: "100%",
      minWidth: 0,
      padding: spacing.lg,
    },
    badgeTop: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
    },
    badgeTier: {
      fontSize: fontSize.tiny,
      fontWeight: fontWeight.bold,
      opacity: 0.74,
      textTransform: "uppercase",
    },
    badgeLabel: {
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
    badgeRarity: {
      alignSelf: "flex-start",
      borderRadius: 999,
      overflow: "hidden",
      paddingHorizontal: 9,
      paddingVertical: 3,
      fontSize: fontSize.tiny,
      fontWeight: fontWeight.bold,
      textTransform: "uppercase",
    },
    showBadgesButton: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.sm,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 42,
    },
    showBadgesText: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
    },
    emptyText: {
      color: colors.muted,
      fontSize: fontSize.label,
      fontWeight: fontWeight.regular,
    },
    modalBackdrop: {
      alignItems: "center",
      backgroundColor: colors.modalBackdrop,
      flex: 1,
      justifyContent: "center",
      padding: 20,
    },
  modalCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xxl,
      borderWidth: 1,
      maxWidth: 380,
      padding: 20,
      width: "100%",
    },
    modalEyebrow: {
      color: colors.primary,
      fontSize: fontSize.tiny,
      fontWeight: fontWeight.bold,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: fontWeight.bold,
      textAlign: "center",
    },
    modalDescription: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.body,
      marginTop: 8,
      textAlign: "center",
    },
    modalMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginTop: 14,
    },
    modalMeta: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      color: colors.text,
      fontSize: fontSize.tiny,
      fontWeight: fontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: 10,
      paddingVertical: 5,
      textTransform: "uppercase",
    },
    modalRequirement: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.regular,
      lineHeight: 18,
      marginTop: 12,
      textAlign: "center",
    },
    modalButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      justifyContent: "center",
      marginTop: 18,
      minHeight: 46,
      width: "100%",
    },
    modalButtonText: {
      color: colors.inverseText,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
    cardPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.995 }],
    },
  });
}
