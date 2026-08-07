import { useMemo } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { v2Radius, v2Shadows, v2Spacing } from "../../src/design";

// Shared centered-dialog modal shell (backdrop + rounded card, fade-in,
// no built-in header/footer) used by the home reward modals (level up,
// perfect day, focus mode) and the rank detail modals (badge, achievement).
//
// This intentionally does NOT cover every Modal in the app: the add-habit
// template picker and the settings data import/export dialog are bottom
// sheets (slide-up, square top corners only, full width) with their own
// header/footer/keyboard-avoiding needs. That's a structural difference,
// not a cosmetic one, so they keep their own inline Modal implementations
// rather than being forced through this shell.
export default function ModalShell({
  animationType,
  children,
  isSmallScreen = false,
  maxWidth = 390,
  onClose,
  padding,
  reduceMotion = false,
  visible,
}) {
  const { colors } = useTheme();
  const resolvedAnimationType =
    animationType ?? (reduceMotion ? "none" : "fade");
  const resolvedPadding =
    padding ?? (isSmallScreen ? v2Spacing.lg : v2Spacing.xl);
  const styles = useMemo(
    () => createStyles(colors, { maxWidth, padding: resolvedPadding }),
    [colors, maxWidth, resolvedPadding]
  );

  return (
    <Modal
      transparent
      animationType={resolvedAnimationType}
      onRequestClose={onClose}
      visible={visible}
    >
      <View style={styles.modalBackdrop}>
        <View
          accessibilityViewIsModal
          importantForAccessibility="yes"
          style={styles.modalCard}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors, { maxWidth, padding }) {
  return StyleSheet.create({
    modalBackdrop: {
      alignItems: "center",
      backgroundColor: colors.modalBackdrop,
      flex: 1,
      justifyContent: "center",
      padding: v2Spacing.lg,
    },
    modalCard: {
      alignItems: "stretch",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      maxHeight: "82%",
      maxWidth,
      padding,
      ...v2Shadows.floating,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      width: "100%",
    },
  });
}
