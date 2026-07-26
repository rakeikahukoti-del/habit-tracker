import { StyleSheet } from "react-native";
import {
  v2Colors,
  v2Layout,
  v2Radius,
  v2Typography,
} from "../../src/design";
import AppText from "./AppText";
import PressableScale from "./PressableScale";

export default function IconButton({
  children,
  color = v2Colors.textPrimary,
  disabled = false,
  size = v2Layout.minTapTarget,
  style,
  ...props
}) {
  const isTextIcon = typeof children === "string" || typeof children === "number";

  return (
    <PressableScale
      {...props}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      style={[
        styles.button,
        {
          borderRadius: size / 2,
          height: Math.max(size, v2Layout.minTapTarget),
          width: Math.max(size, v2Layout.minTapTarget),
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {isTextIcon ? (
        <AppText
          align="center"
          color={disabled ? v2Colors.textDisabled : color}
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
    backgroundColor: v2Colors.surfaceElevated,
    borderColor: v2Colors.borderDefault,
    borderWidth: 1,
    justifyContent: "center",
  },
  disabled: {
    backgroundColor: v2Colors.surface,
    borderColor: v2Colors.borderSubtle,
  },
  icon: {
    ...v2Typography.sectionTitle,
    lineHeight: 22,
  },
});
