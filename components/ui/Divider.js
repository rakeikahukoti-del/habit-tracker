import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { v2Spacing } from "../../src/design";

export default function Divider({ inset = 0, style }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.border,
          marginLeft: inset,
          marginRight: inset,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: v2Spacing.sm,
  },
});
