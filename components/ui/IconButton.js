import { StyleSheet } from "react-native";
import {
  v2Layout,
  v2Typography,
} from "../../src/design";
import { useTheme } from "../../context/ThemeContext";
import AppText from "./AppText";
import PressableScale from "./PressableScale";

export default function IconButton({
  accessibilityState,
  children,
  color,
  disabled = false,
  size = v2Layout.minTapTarget,
  style,
  ...props
}) {
  const { colors } = useTheme();
  const iconColor = color || colors.text;
  const isTextIcon = typeof children === "string" || typeof children === "number";

  return (
    <PressableScale
      {...props}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      hitSlop={8}
      style={[
        styles.button,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: size / 2,
          height: Math.max(size, v2Layout.minTapTarget),
          width: Math.max(size, v2Layout.minTapTarget),
        },
        disabled && {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: 0.58,
        },
        style,
      ]}
    >
      {isTextIcon ? (
        <AppText
          align="center"
          color={disabled ? colors.softText : iconColor}
          style={styles.icon}
        >
          {children}
        </AppText>
      ) : (
        children
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
  },
  icon: {
    ...v2Typography.sectionTitle,
    lineHeight: 22,
  },
});
