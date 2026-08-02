import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Typography } from "../../src/design";
import { PRESSED_CARD_STYLE } from "./pressedStyles";

export default function CelebrationBanner({ celebration, onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityLabel="Dismiss celebration message"
      accessibilityRole="button"
      onPress={onDismiss}
      style={({ pressed }) => [
        styles.celebrationBanner,
        pressed && PRESSED_CARD_STYLE,
      ]}
    >
      <AppText style={styles.celebrationText}>{celebration}</AppText>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    celebrationBanner: {
      backgroundColor: colors.accentSoft,
      borderRadius: v2Radius.medium,
      marginBottom: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    celebrationText: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: 18,
    },
  });
}
