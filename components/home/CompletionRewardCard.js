import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Shadows, v2Typography } from "../../src/design";
import { XP_PER_LEVEL } from "../../utils/gamification";
import { PRESSED_CARD_STYLE } from "./pressedStyles";

export default function CompletionRewardCard({ reward, onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityLabel={`${reward.habitName} completed. ${reward.xpEarned} XP earned. ${reward.streak} day streak. Double tap to dismiss.`}
      accessibilityRole="button"
      onPress={onDismiss}
      style={({ pressed }) => [
        styles.completionPopup,
        pressed && PRESSED_CARD_STYLE,
      ]}
    >
      <View style={styles.completionPopupTop}>
        <AppText style={styles.completionPopupEyebrow}>Completed</AppText>
        <AppText style={styles.completionPopupXp}>
          +{reward.xpEarned} XP
        </AppText>
      </View>
      <AppText style={styles.completionPopupTitle} numberOfLines={2}>
        {reward.habitName}
      </AppText>
      <AppText style={styles.completionPopupMeta}>
        {reward.streak} day streak • {reward.rank} •{" "}
        {reward.rankProgress}/{XP_PER_LEVEL} XP
      </AppText>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    completionPopup: {
      backgroundColor: colors.card,
      borderColor: colors.accent,
      borderRadius: v2Radius.feature,
      borderWidth: 1.5,
      marginBottom: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      ...v2Shadows.medium,
      shadowColor: colors.accent,
      shadowOpacity: 0.16,
    },
    completionPopupTop: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    completionPopupEyebrow: {
      color: colors.accent,
      fontSize: v2Typography.navigationLabel.fontSize,
      fontWeight: v2FontWeight.bold,
      textTransform: "uppercase",
    },
    completionPopupXp: {
      color: colors.primary,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    completionPopupTitle: {
      color: colors.text,
      fontSize: v2Typography.cardTitle.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    completionPopupMeta: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
      marginTop: 5,
    },
  });
}
