import { StyleSheet, View } from "react-native";
import { v2Spacing } from "../../src/design";
import MomentumWolfMark from "./MomentumWolfMark";
import MomentumWordmark from "./MomentumWordmark";

export default function MomentumLogo({
  color,
  decorative,
  markSize = 96,
  showWordmark = true,
  style,
}) {
  const markIsDecorative = decorative ?? showWordmark;

  return (
    <View style={[styles.logo, style]}>
      <MomentumWolfMark
        decorative={markIsDecorative}
        size={markSize}
      />
      {showWordmark ? <MomentumWordmark color={color} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: "center",
    gap: v2Spacing.xl,
  },
});
