import { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { v2Motion } from "../../src/design";

export default function PressableScale({
  accessibilityState,
  children,
  disabled = false,
  onPressIn,
  onPressOut,
  scaleTo = v2Motion.scale.pressed,
  style,
  ...props
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(
    () => () => {
      scale.stopAnimation();
    },
    [scale]
  );

  function animate(toValue) {
    Animated.spring(scale, {
      damping: v2Motion.spring.damping,
      mass: v2Motion.spring.mass,
      stiffness: v2Motion.spring.stiffness,
      toValue,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      {...props}
      accessibilityState={{
        ...accessibilityState,
        disabled: Boolean(disabled || accessibilityState?.disabled),
      }}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
          animate(scaleTo);
        }

        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!disabled) {
          animate(1);
        }

        onPressOut?.(event);
      }}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            { opacity: disabled ? 0.52 : 1, transform: [{ scale }] },
            typeof style === "function" ? style({ pressed }) : style,
          ]}
        >
          {typeof children === "function" ? children({ pressed }) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
