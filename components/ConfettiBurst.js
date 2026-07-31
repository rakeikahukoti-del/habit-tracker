import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { v2Motion } from "../src/design";

export default function ConfettiBurst({ trigger }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const animation = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: `${8 + ((index * 23) % 84)}%`,
        rotate: `${(index * 29) % 180}deg`,
      })),
    []
  );

  useEffect(() => {
    if (!trigger || reduceMotion) {
      return;
    }

    animation.setValue(0);
    const animationHandle = Animated.timing(animation, {
      duration: v2Motion.duration.emphasis * 4,
      toValue: 1,
      useNativeDriver: true,
    });

    animationHandle.start();

    return () => animationHandle.stop();
  }, [animation, reduceMotion, trigger]);

  if (!trigger || reduceMotion) {
    return null;
  }

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 220],
  });
  const opacity = animation.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 1, 0],
  });
  const palette = [
    colors.primary,
    colors.accent,
    colors.warning,
    colors.success,
  ];

  return (
    <View pointerEvents="none" style={styles.container}>
      {pieces.map((piece, index) => (
        <Animated.View
          key={`${trigger}-${piece.id}`}
          style={[
            styles.piece,
            {
              backgroundColor: palette[index % palette.length],
              left: piece.left,
              opacity,
              transform: [{ translateY }, { rotate: piece.rotate }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  piece: {
    borderRadius: 3,
    height: 12,
    position: "absolute",
    top: 0,
    width: 7,
  },
});
