import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Shadows, v2Spacing, v2Typography } from "../../src/design";
import { getRecentAchievementIconName } from "../../constants/achievements";
import { PRESSED_BUTTON_STYLE } from "../home/pressedStyles";

export default function RecentAchievementsList({ achievements, onSelectAchievement }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return achievements?.length > 0 ? (
    achievements.slice(0, 8).map((achievement) => (
      <AchievementRow
        achievement={achievement}
        colors={colors}
        key={achievement.id}
        onPress={() => onSelectAchievement(achievement)}
        styles={styles}
      />
    ))
  ) : (
    <AppText style={styles.emptyText}>
      Achievements appear here after badges, levels, perfect days,
      or rank milestones.
    </AppText>
  );
}

function AchievementRow({ achievement, colors, onPress, styles }) {
  return (
    <Pressable
      accessibilityLabel={`View ${achievement.title} achievement details`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.achievementRow,
        pressed && PRESSED_BUTTON_STYLE,
      ]}
    >
      <View style={styles.achievementMark}>
        <AppIcon
          color={colors.text}
          name={getRecentAchievementIconName(achievement.type)}
          size={22}
          strokeWidth={2}
        />
      </View>
      <View style={styles.achievementText}>
        <AppText numberOfLines={2} style={styles.achievementTitle}>
          {achievement.title}
        </AppText>
        <AppText numberOfLines={2} style={styles.achievementDescription}>
          {achievement.description}
        </AppText>
      </View>
      <AppText style={styles.achievementDate}>
        {formatAchievementDate(achievement.unlockedAt)}
      </AppText>
    </Pressable>
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

function createStyles(colors) {
  return StyleSheet.create({
    achievementRow: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 78,
      padding: v2Spacing.lg,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
    },
    achievementMark: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    achievementText: {
      flex: 1,
      minWidth: 0,
    },
    achievementTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    achievementDescription: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: 3,
    },
    achievementDate: {
      color: colors.muted,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: 82,
      textAlign: "right",
    },
    emptyText: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
    },
  });
}
