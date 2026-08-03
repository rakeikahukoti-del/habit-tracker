import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import RankModalShell from "./RankModalShell";
import { BadgeMedal } from "../progression";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { getAchievementProgressLabel } from "../../utils/achievementProgress";
import { PRESSED_BUTTON_STYLE } from "../home/pressedStyles";

export default function BadgeDetailModal({
  badge,
  earned,
  isSmallScreen,
  onClose,
  progress,
  reduceMotion,
  unlockedAt,
  visible,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  if (!badge) {
    return null;
  }

  return (
    <RankModalShell
      isSmallScreen={isSmallScreen}
      onClose={onClose}
      reduceMotion={reduceMotion}
      visible={visible}
    >
      <ScrollView
        contentContainerStyle={styles.modalScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BadgeMedal badge={badge} earned={earned} large />
        <AppText style={styles.modalEyebrow}>
          {earned ? "Achievement unlocked" : "Locked achievement"}
        </AppText>
        <AppText style={styles.modalTitle}>{badge.label}</AppText>
        <AppText style={styles.modalDescription}>{badge.description}</AppText>
        <View style={styles.modalMetaRow}>
          <AppText style={styles.modalMeta}>{badge.tier}</AppText>
          <AppText style={styles.modalMeta}>{badge.rarity}</AppText>
          <AppText style={styles.modalMeta}>
            {getAchievementProgressLabel(progress, earned)}
          </AppText>
          {earned && unlockedAt ? (
            <AppText style={styles.modalMeta}>
              {formatAchievementDate(unlockedAt)}
            </AppText>
          ) : null}
        </View>
        <View style={styles.requirementBox}>
          <AppText style={styles.requirementLabel}>Requirement</AppText>
          <AppText style={styles.requirementText}>{badge.description}</AppText>
          {progress?.measurable ? (
            <AppText style={styles.requirementText}>
              Current progress: {progress.value} / {progress.max}
            </AppText>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="Close badge details"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.modalButton,
            pressed && PRESSED_BUTTON_STYLE,
          ]}
        >
          <AppText style={styles.modalButtonText}>Close</AppText>
        </Pressable>
      </ScrollView>
    </RankModalShell>
  );
}

function formatAchievementDate(dateString) {
  if (!dateString) {
    return "Recent";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    modalScrollContent: {
      alignItems: "center",
      width: "100%",
    },
    modalEyebrow: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.lg,
    },
    modalTitle: {
      color: colors.text,
      fontSize: isSmallScreen
        ? v2Typography.sectionTitle.fontSize
        : 24,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? v2Typography.sectionTitle.lineHeight : 30,
      marginTop: v2Spacing.sm,
      textAlign: "center",
    },
    modalDescription: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
      textAlign: "center",
    },
    modalMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginTop: v2Spacing.lg,
    },
    modalMeta: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.text,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    requirementBox: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      marginTop: v2Spacing.lg,
      padding: v2Spacing.lg,
      width: "100%",
    },
    requirementLabel: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: 4,
    },
    requirementText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
      textAlign: "center",
    },
    modalButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.medium,
      justifyContent: "center",
      marginTop: v2Spacing.xl,
      minHeight: 48,
      width: "100%",
    },
    modalButtonText: {
      color: colors.inverseText,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
