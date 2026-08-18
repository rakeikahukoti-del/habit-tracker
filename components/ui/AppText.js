import { StyleSheet, Text } from "react-native";
import { v2Colors, v2Typography } from "../../src/design";

export default function AppText({
  align,
  children,
  color = v2Colors.textPrimary,
  // App-wide cap on OS-level text-size scaling (matches the value already
  // used at BottomNav.js:100). Uncapped scaling risks label/button wrapping
  // in already-tight layouts (e.g. the create-habit form) under large
  // accessibility text sizes - flagged in Phase 10 Thread A's survey as a
  // real, un-verified-live risk. Any caller can still override this by
  // passing its own maxFontSizeMultiplier.
  maxFontSizeMultiplier = 1.2,
  style,
  variant = "body",
  ...props
}) {
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
      style={[
        styles.base,
        v2Typography[variant] || v2Typography.body,
        { color },
        align && { textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
