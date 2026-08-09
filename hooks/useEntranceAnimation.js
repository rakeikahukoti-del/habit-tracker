import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { v2Motion } from "../src/design";
import { useReducedMotion } from "./useReducedMotion";

const SLIDE_DISTANCE = 12;

// Shared fade + slight-upward-slide entrance, for the small dismissible
// cards (CelebrationBanner, ReturnExperienceCard, SwipeHintCard,
// TrendUnlockBanner) that previously just popped into the tree on
// conditional render with no motion at all. Not the spring/glow treatment
// BadgeUnlockCard/CompletionRewardCard use - those mark specific reward
// moments; this is the quieter, generic "a card appeared" case.
//
// `deps` re-triggers the animation - pass the content that identifies a
// "new" instance (e.g. a message string) if the same mounted component can
// show different content over time; omit it for cards that only ever
// mount once per appearance.
//
// `delay` (ms) staggers the start - used by the onboarding screen to
// sequence brand mark -> title -> points rather than fading them in at
// once. Irrelevant, and skipped entirely, under reduced motion.
export function useEntranceAnimation(deps = [], { delay = 0 } = {}) {
  const reduceMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translateY = useRef(
    new Animated.Value(reduceMotion ? 0 : SLIDE_DISTANCE)
  ).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(SLIDE_DISTANCE);

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        delay,
        duration: v2Motion.duration.standard,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        delay,
        duration: v2Motion.duration.standard,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, opacity, translateY, delay, ...deps]);

  return {
    opacity,
    style: { opacity, transform: [{ translateY }] },
    translateY,
  };
}
