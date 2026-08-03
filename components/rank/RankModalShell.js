import { useMemo } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { v2Radius, v2Shadows, v2Spacing } from "../../src/design";

export default function RankModalShell({
  children,
  isSmallScreen,
  onClose,
  reduceMotion,
  visible,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <Modal
      transparent
      animationType={reduceMotion ? "none" : "fade"}
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

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    modalBackdrop: {
      alignItems: "center",
      backgroundColor: colors.modalBackdrop,
      flex: 1,
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      maxHeight: "82%",
      maxWidth: 390,
      padding: isSmallScreen ? v2Spacing.lg : v2Spacing.xl,
      ...v2Shadows.floating,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      width: "100%",
    },
  });
}
