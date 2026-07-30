import { StyleSheet } from "react-native";
import {
  v2Layout,
  v2Radius,
  v2Spacing,
} from "../../src/design";
import { useTheme } from "../../context/ThemeContext";
import AppText from "./AppText";
import PressableScale from "./PressableScale";

export default function SecondaryButton({
  accessibilityState,
  children,
  disabled = false,
  style,
  textStyle,
  ...props
}) {
  const { colors } = useTheme();

  return (
    <PressableScale
      {...props}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        disabled && {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <AppText
        color={disabled ? colors.softText : colors.text}
        style={textStyle}
        variant="button"
      >
        {children}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: v2Radius.medium,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: v2Layout.minTapTarget,
    paddingHorizontal: v2Spacing.lg,
    paddingVertical: v2Spacing.md,
  },
});
