import { useMemo } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { useEntranceAnimation } from "../../hooks/useEntranceAnimation";
import { v2CompactSpacing, v2FontWeight, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function CelebrationBanner({ celebration, onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const entrance = useEntranceAnimation([celebration]);

  return (
    <Animated.View style={entrance.style}>
      <Pressable
        accessibilityLabel="Dismiss celebration message"
        accessibilityRole="button"
        onPress={onDismiss}
        style={({ pressed }) => [
          styles.celebrationBanner,
          pressed && v2PressedStyles.card,
        ]}
      >
        <AppText style={styles.celebrationText}>{celebration}</AppText>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    celebrationBanner: {
      backgroundColor: colors.accentSoft,
      borderRadius: v2Radius.medium,
      marginBottom: v2Spacing.sm,
      paddingHorizontal: v2CompactSpacing.md,
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
