import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { v2Radius, v2Shadows, v2Spacing } from "../../src/design";

export default function Surface({
  children,
  level = "base",
  padding = "base",
  shadow = "low",
  style,
}) {
  const { colors } = useTheme();
  const levels = {
    base: colors.card,
    elevated: colors.surface,
    pressed: colors.inputBackground,
  };

  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: levels[level] || levels.base,
          borderColor: colors.border,
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
    borderRadius: v2Radius.large,
    borderWidth: 1,
    width: "100%",
  },
});
