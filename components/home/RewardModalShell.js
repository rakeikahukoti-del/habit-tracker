import { useMemo } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { v2Radius, v2Shadows } from "../../src/design";

export default function RewardModalShell({
  animationType = "fade",
  children,
  onRequestClose,
  visible,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      transparent
      animationType={animationType}
      onRequestClose={onRequestClose}
      visible={visible}
    >
      <View style={styles.levelModalBackdrop}>
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

function createStyles(colors) {
  return StyleSheet.create({
    levelModalBackdrop: {
      alignItems: "center",
      backgroundColor: colors.modalBackdrop,
      flex: 1,
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      alignItems: "stretch",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      maxHeight: "82%",
      maxWidth: 360,
      padding: 22,
      ...v2Shadows.floating,
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      width: "100%",
    },
  });
}
