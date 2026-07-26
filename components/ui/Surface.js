import { StyleSheet, View } from "react-native";
import { v2Colors, v2Radius, v2Shadows, v2Spacing } from "../../src/design";

const levels = {
  base: v2Colors.surface,
  elevated: v2Colors.surfaceElevated,
  pressed: v2Colors.surfacePressed,
};

export default function Surface({
  children,
  level = "base",
  padding = "base",
  shadow = "low",
  style,
}) {
  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: levels[level] || levels.base,
          padding: v2Spacing[padding] ?? v2Spacing.base,
        },
        v2Shadows[shadow] || v2Shadows.low,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderColor: v2Colors.borderDefault,
    borderRadius: v2Radius.large,
    borderWidth: 1,
    width: "100%",
  },
});
