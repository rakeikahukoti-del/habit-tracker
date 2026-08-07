import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { RankMedal } from "../progression";
import { AppText, ModalShell } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2PressedStyles, v2Radius, v2Typography } from "../../src/design";

export default function LevelUpModal({
  levelUp,
  onClose,
  reduceMotion,
  visible,
}) {
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
        <RankMedal rank={levelUp?.rank} size="large" />
        <AppText style={styles.levelModalEyebrow}>Level up</AppText>
        <AppText style={styles.levelModalTitle}>Level {levelUp?.level}</AppText>
        <AppText style={styles.levelModalRank}>{levelUp?.rank} Rank</AppText>
        <AppText style={styles.levelModalMessage}>
          Your progress has reached a new level.
        </AppText>
        <View style={styles.levelModalTrack}>
          <View
            style={[
              styles.levelModalFill,
              { width: `${levelUp?.progress || 0}%` },
            ]}
          />
        </View>
        <Pressable
          accessibilityLabel="Close level up message"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.levelModalButton,
            pressed && v2PressedStyles.button,
          ]}
        >
          <AppText style={styles.levelModalButtonText}>Continue</AppText>
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
    levelModalRank: {
      color: colors.accent,
      fontSize: 18,
      fontWeight: v2FontWeight.bold,
      marginTop: 4,
    },
    levelModalMessage: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: v2FontWeight.medium,
      lineHeight: 21,
      marginTop: 12,
    },
    levelModalTrack: {
      backgroundColor: colors.inputBackground,
      borderRadius: v2Radius.pill,
      height: 10,
      marginTop: 18,
      overflow: "hidden",
    },
    levelModalFill: {
      backgroundColor: colors.primary,
      borderRadius: v2Radius.pill,
      height: "100%",
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
