import { StyleSheet, View } from "react-native";
import { v2Colors, v2Spacing } from "../../src/design";

export default function Divider({ inset = 0, style }) {
  return (
    <View
      style={[
        styles.divider,
        {
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
    backgroundColor: v2Colors.borderSubtle,
    height: StyleSheet.hairlineWidth,
    marginVertical: v2Spacing.sm,
  },
});
