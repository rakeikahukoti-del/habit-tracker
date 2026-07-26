import { StyleSheet } from "react-native";
import {
  v2Colors,
  v2Layout,
  v2Radius,
  v2Spacing,
} from "../../src/design";
import AppText from "./AppText";
import PressableScale from "./PressableScale";

export default function SecondaryButton({
  children,
  disabled = false,
  style,
  textStyle,
  ...props
}) {
  return (
    <PressableScale
      {...props}
      accessibilityRole="button"
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled, style]}
    >
      <AppText
        color={disabled ? v2Colors.textDisabled : v2Colors.textPrimary}
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
    backgroundColor: v2Colors.surfaceElevated,
    borderColor: v2Colors.borderDefault,
    borderRadius: v2Radius.medium,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: v2Layout.minTapTarget,
    paddingHorizontal: v2Spacing.lg,
    paddingVertical: v2Spacing.md,
  },
  disabled: {
    backgroundColor: v2Colors.surface,
    borderColor: v2Colors.borderSubtle,
  },
});
