import { StyleSheet, Text } from "react-native";
import { v2Colors, v2Typography } from "../../src/design";

export default function AppText({
  align,
  children,
  color = v2Colors.textPrimary,
  style,
  variant = "body",
  ...props
}) {
  return (
    <Text
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
