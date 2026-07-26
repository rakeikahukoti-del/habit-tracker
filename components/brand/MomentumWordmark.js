import { StyleSheet } from "react-native";
import { v2Colors, v2FontWeight } from "../../src/design";
import AppText from "../ui/AppText";

export default function MomentumWordmark({
  color = v2Colors.textPrimary,
  size = 18,
  style,
}) {
  return (
    <AppText
      color={color}
      style={[
        styles.wordmark,
        {
          fontSize: size,
          lineHeight: Math.round(size * 1.35),
        },
        style,
      ]}
    >
      MOMENTUM
    </AppText>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontWeight: v2FontWeight.medium,
    letterSpacing: 8,
  },
});
