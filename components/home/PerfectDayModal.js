import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppIcon, AppText, ModalShell } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2CompactSpacing, v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { PERFECT_DAY_BONUS_XP } from "../../utils/gamification";

export default function PerfectDayModal({ onClose, reduceMotion, visible }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ModalShell
      maxWidth={360}
      onClose={onClose}
      padding={22}
      reduceMotion={reduceMotion}
      visible={visible}
    >
      <ScrollView
        contentContainerStyle={styles.levelModalScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modalIconCircle}>
          <AppIcon
            color={colors.accent}
            name="star"
            size={34}
            strokeWidth={2.4}
          />
        </View>
        <AppText style={styles.levelModalEyebrow}>Perfect day</AppText>
        <AppText style={styles.levelModalTitle}>Every habit, done.</AppText>
        <AppText style={styles.levelModalMessage}>
          You cleared every habit today and earned the perfect day bonus.
        </AppText>
        <AppText style={styles.levelModalUnlock}>
          +{PERFECT_DAY_BONUS_XP} bonus XP
        </AppText>
        <Pressable
          accessibilityLabel="Close perfect day message"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.levelModalButton,
            pressed && v2PressedStyles.button,
          ]}
        >
          <AppText style={styles.levelModalButtonText}>Nice</AppText>
        </Pressable>
      </ScrollView>
    </ModalShell>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    levelModalScrollContent: {
      alignItems: "stretch",
    },
    modalIconCircle: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.accentSoft,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      height: 58,
      justifyContent: "center",
      marginBottom: v2Spacing.md,
      width: 58,
    },
    levelModalEyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: v2FontWeight.bold,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    levelModalTitle: {
      color: colors.text,
      fontSize: 34,
      fontWeight: v2FontWeight.bold,
    },
    levelModalMessage: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: v2FontWeight.medium,
      lineHeight: 21,
      marginTop: 12,
    },
    levelModalUnlock: {
      backgroundColor: colors.primarySoft,
      borderRadius: v2Radius.small,
      color: colors.primary,
      fontSize: 14,
      fontWeight: v2FontWeight.bold,
      marginTop: 14,
      overflow: "hidden",
      paddingHorizontal: 12,
      paddingVertical: v2CompactSpacing.sm,
      textAlign: "center",
    },
    levelModalButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.large,
      justifyContent: "center",
      marginTop: 20,
      minHeight: 50,
    },
    levelModalButtonText: {
      color: colors.inverseText,
      fontSize: 15,
      fontWeight: v2FontWeight.bold,
    },
  });
}
