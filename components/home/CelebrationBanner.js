import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { AppText, ModalShell } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { v2FontWeight, v2PressedStyles, v2Typography } from "../../src/design";

// Promoted from an inline banner to a ModalShell overlay - see
// CompletionRewardCard.js for the full rationale. Drops its own
// useEntranceAnimation fade/slide since ModalShell's own fade transition
// now covers entrance.
export default function CelebrationBanner({ celebration, onClose, visible }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();

  if (!celebration) {
    return null;
  }

  return (
    <ModalShell
      maxWidth={360}
      onClose={onClose}
      padding={22}
      reduceMotion={reduceMotion}
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Dismiss celebration message"
        accessibilityRole="button"
        onPress={onClose}
        style={({ pressed }) => [
          styles.celebrationBanner,
          pressed && v2PressedStyles.card,
        ]}
      >
        <AppText style={styles.celebrationText}>{celebration}</AppText>
      </Pressable>
    </ModalShell>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    celebrationBanner: {
      alignItems: "center",
    },
    celebrationText: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: 23,
      textAlign: "center",
    },
  });
}
