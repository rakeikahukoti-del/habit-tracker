import { ActivityIndicator, StyleSheet } from "react-native";
import {
  v2Colors,
  v2Layout,
  v2Radius,
  v2Spacing,
} from "../../src/design";
import AppText from "./AppText";
import PressableScale from "./PressableScale";

export default function PrimaryButton({
  children,
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      {...props}
      accessibilityRole="button"
      disabled={isDisabled}
      style={[styles.button, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={v2Colors.accentContrast} size="small" />
      ) : (
        <AppText
          color={v2Colors.accentContrast}
          style={textStyle}
          variant="button"
        >
          {children}
        </AppText>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: v2Colors.accentPrimary,
    borderRadius: v2Radius.medium,
    justifyContent: "center",
    minHeight: v2Layout.minTapTarget,
    paddingHorizontal: v2Spacing.lg,
    paddingVertical: v2Spacing.md,
  },
  disabled: {
    backgroundColor: v2Colors.textDisabled,
  },
});
