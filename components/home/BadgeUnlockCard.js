import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BadgeMedal } from "../progression";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Shadows, v2Typography } from "../../src/design";
import { PRESSED_CARD_STYLE } from "./pressedStyles";

export default function BadgeUnlockCard({ badge, onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityLabel={`${badge.label} achievement unlocked. ${badge.description}. Double tap to dismiss.`}
      accessibilityRole="button"
      onPress={onDismiss}
      style={({ pressed }) => [
        styles.badgeUnlockPopup,
        pressed && PRESSED_CARD_STYLE,
      ]}
    >
      <BadgeMedal badge={badge} earned large />
      <View style={styles.badgeUnlockContent}>
        <AppText style={styles.badgeUnlockEyebrow}>Badge earned</AppText>
        <AppText style={styles.badgeUnlockTitle}>{badge.label}</AppText>
        <AppText style={styles.badgeUnlockDescription}>
          {badge.description}
        </AppText>
        <View style={styles.badgeUnlockFooter}>
          <AppText style={styles.badgeUnlockTier}>{badge.tier}</AppText>
          <AppText style={styles.badgeUnlockRarity}>
            {badge.rarity}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    badgeUnlockPopup: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.accent,
      borderRadius: v2Radius.feature,
      borderWidth: 1.5,
      gap: 14,
      marginBottom: 10,
      paddingHorizontal: 18,
      paddingVertical: 20,
      ...v2Shadows.medium,
      shadowColor: colors.accent,
      shadowOpacity: 0.18,
    },
    badgeUnlockContent: {
      alignItems: "center",
      gap: 7,
      width: "100%",
    },
    badgeUnlockEyebrow: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: v2FontWeight.bold,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    badgeUnlockRarity: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.text,
      fontSize: 12,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: 10,
      paddingVertical: 5,
      textTransform: "uppercase",
    },
    badgeUnlockTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: v2FontWeight.bold,
      textAlign: "center",
    },
    badgeUnlockDescription: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: 18,
      textAlign: "center",
    },
    badgeUnlockFooter: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "space-between",
      marginTop: 4,
    },
    badgeUnlockTier: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      color: colors.text,
      fontSize: 12,
      fontWeight: v2FontWeight.bold,
      overflow: "hidden",
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
  });
}
