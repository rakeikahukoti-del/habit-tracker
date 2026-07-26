import { StyleSheet, View } from "react-native";
import { v2Colors } from "../../src/design";

export default function BackIcon({ color = v2Colors.textPrimary }) {
  return (
    <View style={styles.icon}>
      <View style={[styles.lineA, { backgroundColor: color }]} />
      <View style={[styles.lineB, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  lineA: {
    borderRadius: 999,
    height: 2,
    left: 2,
    position: "absolute",
    top: 5,
    transform: [{ rotate: "-45deg" }],
    width: 11,
  },
  lineB: {
    borderRadius: 999,
    bottom: 5,
    height: 2,
    left: 2,
    position: "absolute",
    transform: [{ rotate: "45deg" }],
    width: 11,
  },
});
