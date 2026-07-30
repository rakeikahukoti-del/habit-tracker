import { ActivityIndicator, StyleSheet } from "react-native";
import {
  v2Layout,
  v2Radius,
  v2Spacing,
} from "../../src/design";
import { useTheme } from "../../context/ThemeContext";
import AppText from "./AppText";
import PressableScale from "./PressableScale";

export default function PrimaryButton({
  accessibilityState,
  children,
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      {...props}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        disabled: isDisabled,
        busy: Boolean(loading),
      }}
      disabled={isDisabled}
      style={[
        styles.button,
        { backgroundColor: colors.primary },
        isDisabled && { backgroundColor: colors.border },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.inverseText} size="small" />
      ) : (
        <AppText
          color={isDisabled ? colors.softText : colors.inverseText}
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
    borderRadius: v2Radius.medium,
    justifyContent: "center",
    minHeight: v2Layout.minTapTarget,
    paddingHorizontal: v2Spacing.lg,
    paddingVertical: v2Spacing.md,
  },
});
