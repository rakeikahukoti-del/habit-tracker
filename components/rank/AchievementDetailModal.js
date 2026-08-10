import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppIcon, AppText, ModalShell } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2CompactSpacing, v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { getRecentAchievementIconName } from "../../constants/achievements";

export default function AchievementDetailModal({
  achievement,
  isSmallScreen,
  onClose,
  reduceMotion,
  visible,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  if (!achievement) {
    return null;
  }

  return (
    <ModalShell
      isSmallScreen={isSmallScreen}
      onClose={onClose}
      reduceMotion={reduceMotion}
      visible={visible}
    >
      <ScrollView
        contentContainerStyle={styles.modalScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.achievementModalMark}>
          <AppIcon
            color={colors.text}
            name={getRecentAchievementIconName(achievement.type)}
            size={28}
            strokeWidth={2.2}
          />
        </View>
        <AppText style={styles.modalEyebrow}>Recent achievement</AppText>
        <AppText style={styles.modalTitle}>{achievement.title}</AppText>
        <AppText style={styles.modalDescription}>{achievement.description}</AppText>
        <View style={styles.modalMetaRow}>
          <AppText style={styles.modalMeta}>
            {formatAchievementType(achievement.type)}
          </AppText>
          <AppText style={styles.modalMeta}>
            {formatAchievementDate(achievement.unlockedAt)}
          </AppText>
        </View>
        {achievement.habitName ? (
          <AppText style={styles.requirementText}>Habit: {achievement.habitName}</AppText>
        ) : null}
        {achievement.xp ? (
          <AppText style={styles.requirementText}>Reward: +{achievement.xp} XP</AppText>
        ) : null}
        <Pressable
          accessibilityLabel="Close achievement details"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.modalButton,
            pressed && v2PressedStyles.button,
          ]}
        >
          <AppText style={styles.modalButtonText}>Close</AppText>
        </Pressable>
      </ScrollView>
    </ModalShell>
  );
}

function formatAchievementType(type) {
  return String(type || "milestone").replace("-", " ");
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
      paddingHorizontal: v2CompactSpacing.sm,
      paddingVertical: 5,
    },
    requirementText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
      textAlign: "center",
    },
    achievementModalMark: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      height: 74,
      justifyContent: "center",
      width: 74,
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
