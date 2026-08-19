import { useMemo } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { useEntranceAnimation } from "../../hooks/useEntranceAnimation";
import { v2CompactSpacing, v2FontWeight, v2Layout, v2PressedStyles, v2Radius, v2Spacing, v2Typography } from "../../src/design";

export default function SwipeHintCard({ onDismiss }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const entrance = useEntranceAnimation();

  return (
    <Animated.View style={entrance.style}>
      <Pressable
        accessibilityHint="Dismisses this one-time completion tip."
        accessibilityLabel="Swipe right or tap the tick to complete a habit. Double tap to dismiss this tip."
        accessibilityRole="button"
        onPress={onDismiss}
        style={({ pressed }) => [
          styles.swipeHint,
          pressed && v2PressedStyles.card,
        ]}
      >
        <View style={styles.swipeHintIcon}>
          <AppIcon
            color={colors.primary}
            name="check"
            size={18}
            strokeWidth={2.4}
          />
        </View>
        <View style={styles.swipeHintText}>
          <AppText style={styles.swipeHintTitle}>Two ways to complete</AppText>
          <AppText style={styles.swipeHintBody}>
            Swipe a habit right, or tap the tick, when it is done. Tap the
            card to view its details.
          </AppText>
        </View>
        <AppText style={styles.swipeHintDismiss}>Got it</AppText>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    swipeHint: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: v2Radius.large,
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: v2Layout.sectionGap,
      minHeight: 64,
      paddingHorizontal: v2CompactSpacing.md,
      paddingVertical: v2CompactSpacing.sm,
    },
    swipeHintIcon: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: v2Radius.medium,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    swipeHintText: {
      flex: 1,
      minWidth: 0,
    },
    swipeHintTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    swipeHintBody: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: 2,
    },
    swipeHintDismiss: {
      color: colors.primary,
      flexShrink: 0,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
    },
  });
}
