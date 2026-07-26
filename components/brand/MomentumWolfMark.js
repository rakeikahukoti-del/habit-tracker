import { StyleSheet, View } from "react-native";
import { v2Colors } from "../../src/design";

export default function MomentumWolfMark({
  color = v2Colors.textPrimary,
  cutoutColor = v2Colors.background,
  size = 96,
  style,
}) {
  const unit = size / 96;

  return (
    <View
      accessibilityIgnoresInvertColors
      accessibilityLabel="Momentum wolf mark"
      accessible
      style={[styles.wrap, { height: size, width: size }, style]}
    >
      <View
        style={[
          styles.ear,
          styles.leftEar,
          triangle(16 * unit, 40 * unit, color, "up"),
        ]}
      />
      <View
        style={[
          styles.ear,
          styles.rightEar,
          triangle(16 * unit, 40 * unit, color, "up"),
        ]}
      />

      <View
        style={[
          styles.cheek,
          styles.leftCheek,
          {
            backgroundColor: color,
            height: 48 * unit,
            width: 24 * unit,
          },
        ]}
      />
      <View
        style={[
          styles.cheek,
          styles.rightCheek,
          {
            backgroundColor: color,
            height: 48 * unit,
            width: 24 * unit,
          },
        ]}
      />

      <View
        style={[
          styles.centerFacet,
          {
            backgroundColor: color,
            height: 54 * unit,
            marginLeft: -11 * unit,
            width: 22 * unit,
          },
        ]}
      />
      <View
        style={[
          styles.muzzle,
          { marginLeft: -11 * unit },
          triangle(22 * unit, 28 * unit, color, "down"),
        ]}
      />
      <View
        style={[
          styles.nose,
          { marginLeft: -3.5 * unit },
          triangle(7 * unit, 6 * unit, cutoutColor, "down"),
        ]}
      />
      <View
        style={[
          styles.eye,
          styles.leftEye,
          {
            borderBottomWidth: 5 * unit,
            borderLeftWidth: 2 * unit,
            borderRightWidth: 7 * unit,
            borderTopWidth: 0,
            borderBottomColor: cutoutColor,
          },
        ]}
      />
      <View
        style={[
          styles.eye,
          styles.rightEye,
          {
            borderBottomWidth: 5 * unit,
            borderLeftWidth: 7 * unit,
            borderRightWidth: 2 * unit,
            borderTopWidth: 0,
            borderBottomColor: cutoutColor,
          },
        ]}
      />
    </View>
  );
}

function triangle(width, height, color, direction) {
  if (direction === "down") {
    return {
      borderLeftColor: "transparent",
      borderLeftWidth: width / 2,
      borderRightColor: "transparent",
      borderRightWidth: width / 2,
      borderTopColor: color,
      borderTopWidth: height,
      height: 0,
      width: 0,
    };
  }

  return {
    borderBottomColor: color,
    borderBottomWidth: height,
    borderLeftColor: "transparent",
    borderLeftWidth: width / 2,
    borderRightColor: "transparent",
    borderRightWidth: width / 2,
    height: 0,
    width: 0,
  };
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  ear: {
    position: "absolute",
    top: "6%",
  },
  leftEar: {
    left: "18%",
    transform: [{ rotate: "-16deg" }],
  },
  rightEar: {
    right: "18%",
    transform: [{ rotate: "16deg" }],
  },
  cheek: {
    position: "absolute",
    top: "31%",
  },
  leftCheek: {
    left: "22%",
    transform: [{ rotate: "-24deg" }, { skewY: "-12deg" }],
  },
  rightCheek: {
    right: "22%",
    transform: [{ rotate: "24deg" }, { skewY: "12deg" }],
  },
  centerFacet: {
    left: "50%",
    position: "absolute",
    top: "22%",
    transform: [{ rotate: "45deg" }],
  },
  muzzle: {
    left: "50%",
    position: "absolute",
    top: "61%",
  },
  nose: {
    left: "50%",
    position: "absolute",
    top: "70%",
  },
  eye: {
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    position: "absolute",
    top: "49%",
  },
  leftEye: {
    left: "35%",
    transform: [{ rotate: "8deg" }],
  },
  rightEye: {
    right: "35%",
    transform: [{ rotate: "-8deg" }],
  },
});
