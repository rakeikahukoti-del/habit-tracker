import { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { v2Motion } from "../../src/design";
import { useReducedMotion } from "../../hooks/useReducedMotion";

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
  const reduceMotion = useReducedMotion();

  useEffect(
    () => () => {
      scale.stopAnimation();
    },
    [scale]
  );

  function animate(toValue) {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }

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
            pressed && reduceMotion && !disabled ? { opacity: 0.82 } : null,
            typeof style === "function" ? style({ pressed }) : style,
          ]}
        >
          {typeof children === "function" ? children({ pressed }) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
