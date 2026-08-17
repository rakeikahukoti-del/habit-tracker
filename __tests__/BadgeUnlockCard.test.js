import { act } from "react-test-renderer";
import { Animated, StyleSheet } from "react-native";
import { renderWithProviders, screen, waitFor } from "../test/test-utils";
import BadgeUnlockCard from "../components/home/BadgeUnlockCard";
import { getBadgeGlowDuration } from "../utils/badgeUnlockTiming";

// Covers the mixed native/JS Animated driver-mode bug that crashed Phase 8
// PR #23 (see BadgeUnlockCard.js's own comment above its two nested
// Animated.Views for the exact failure mode: RN tracks native/JS driver
// mode per rendered node, not per Animated.Value, so a native-driven prop
// (scaleAnim's transform, useNativeDriver: true) and a JS-driven prop
// (glowAnim's shadowOpacity, useNativeDriver: false) can never share one
// Animated.View's style array without RN eventually throwing "Attempting
// to run JS driven animation on animated node that has been moved to
// 'native' earlier". That bug class has zero coverage anywhere else in
// this suite.
//
// useReducedMotion isn't mocked anywhere else in this suite (grepped
// __tests__/ - no existing jest.mock for it), so it's mocked directly here
// per-file, kept controllable per test via mockReturnValue.
jest.mock("../hooks/useReducedMotion", () => ({
  useReducedMotion: jest.fn(),
}));

const { useReducedMotion } = require("../hooks/useReducedMotion");

function makeBadge(tier, idSuffix = tier) {
  return {
    id: `badge-${idSuffix}`,
    label: `${tier} Badge`,
    description: "Complete a habit before 8am.",
    tier,
    rarity: tier === "Diamond" || tier === "Master" ? "Legendary" : "Rare",
    group: "Consistency",
  };
}

// Reads an Animated.View's flattened style, resolving any interpolated
// Animated node found under a given key down to its current numeric value
// via the private-but-suite-standard __getValue() (there's no public RN
// API to read a live Animated.Value/interpolation synchronously - reaching
// past the public API here is what every Animated-value test in the RN
// ecosystem does).
function getStyleValue(view, key) {
  const flat = StyleSheet.flatten(view.props.style) || {};
  const raw = flat[key];

  return raw && typeof raw.__getValue === "function" ? raw.__getValue() : raw;
}

function getScale(view) {
  const flat = StyleSheet.flatten(view.props.style) || {};
  const transform = flat.transform;

  if (!Array.isArray(transform)) {
    return undefined;
  }

  const scaleEntry = transform.find((t) => "scale" in t);

  return scaleEntry?.scale?.__getValue
    ? scaleEntry.scale.__getValue()
    : scaleEntry?.scale;
}

beforeEach(() => {
  jest.useFakeTimers();
  useReducedMotion.mockReturnValue(false);
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

// The structural fix itself: the actual bug is per-*node*, so the fix that
// matters is keeping the native-driven prop (transform/scale) and the
// JS-driven prop (shadowOpacity) on two different Animated.View instances,
// permanently. This is directly assertable from the rendered tree - no
// timer advancement needed, and it's a stronger guarantee than a smoke
// test: it fails immediately if anyone ever collapses the two nested
// Animated.Views back into one (the exact regression that would
// reintroduce the crash), rather than only failing if a future test
// happens to reproduce the native runtime's crash path.
describe("BadgeUnlockCard native/JS Animated driver isolation", () => {
  test("scaleAnim (native-driven transform) and glowAnim (JS-driven shadowOpacity) never share one Animated.View's style array", async () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <BadgeUnlockCard badge={makeBadge("Gold")} onClose={() => {}} visible />
    );

    await waitFor(() => {
      const animatedViews = UNSAFE_getAllByType(Animated.View);
      const viewsWithTransform = animatedViews.filter((view) => {
        const flat = StyleSheet.flatten(view.props.style) || {};

        return Array.isArray(flat.transform);
      });
      const viewsWithShadowOpacity = animatedViews.filter((view) => {
        const flat = StyleSheet.flatten(view.props.style) || {};

        return "shadowOpacity" in flat;
      });

      // Both animated props are actually present somewhere in the tree...
      expect(viewsWithTransform.length).toBeGreaterThan(0);
      expect(viewsWithShadowOpacity.length).toBeGreaterThan(0);

      // ...but never on the same node.
      for (const view of animatedViews) {
        const flat = StyleSheet.flatten(view.props.style) || {};
        const hasTransform = Array.isArray(flat.transform);
        const hasShadowOpacity = "shadowOpacity" in flat;

        expect(hasTransform && hasShadowOpacity).toBe(false);
      }
    });
  });
});

// The actual native "moved to 'native' earlier" crash is thrown by RN's
// native animated runtime, which doesn't exist in the Jest/jsdom-less
// react-test-renderer environment this suite runs in - there is no native
// module to move a node to "native" in the first place (confirmed by
// experiment: scaleAnim's useNativeDriver:true value never ticks under
// fake timers here at all, unlike glowAnim's JS-driven value, which does).
// So this suite can't reproduce the native crash directly - the structural
// test above is what actually guards the bug class. What these tests add
// on top is a regression net for the surrounding JS: that repeated
// show/hide cycles - which is what actually exposed the original bug,
// since it only reproduced from the second popup onward - don't throw for
// any *other* reason (effect cleanup ordering, stale closures, etc.).
describe("BadgeUnlockCard across multiple consecutive badge-unlock popups", () => {
  const TIERS = ["Bronze", "Gold", "Diamond", "Master"];

  test("does not throw across repeated fresh mount/unmount cycles, one per tier", () => {
    expect(() => {
      for (const tier of TIERS) {
        const badge = makeBadge(tier);
        const { unmount } = renderWithProviders(
          <BadgeUnlockCard badge={badge} onClose={() => {}} visible />
        );

        act(() => {
          jest.advanceTimersByTime(getBadgeGlowDuration(tier) + 200);
        });

        unmount();
      }
    }).not.toThrow();
  });

  // app/index.js never unmounts BadgeUnlockCard between popups - it's a
  // single persistent instance whose `visible`/`badge` props toggle
  // (activeRewardType === "badge"), which is what keeps the same
  // Animated.View nodes alive across every popup in a session and is the
  // scenario the driver-mode bug actually needs. This is the more
  // faithful reproduction of "multiple popups in one session" than a
  // fresh mount/unmount per popup would be.
  test("does not throw when the same instance re-shows for consecutive badges via prop changes", async () => {
    const onClose = jest.fn();
    const { rerender, findByText } = renderWithProviders(
      <BadgeUnlockCard badge={makeBadge("Bronze")} onClose={onClose} visible={false} />
    );

    expect(() => {
      for (const tier of TIERS) {
        const badge = makeBadge(tier);

        act(() => {
          rerender(
            <BadgeUnlockCard badge={badge} onClose={onClose} visible />
          );
          jest.advanceTimersByTime(getBadgeGlowDuration(tier) + 200);
        });

        act(() => {
          rerender(
            <BadgeUnlockCard badge={badge} onClose={onClose} visible={false} />
          );
        });
      }
    }).not.toThrow();

    // One more show, left mounted, to confirm the component is still in a
    // working state after the full cycle above - not just "didn't throw".
    const finalBadge = makeBadge("Master", "final");

    act(() => {
      rerender(
        <BadgeUnlockCard badge={finalBadge} onClose={onClose} visible />
      );
    });

    await findByText("Master Badge");
  });
});

// reduceMotion's branch (BadgeUnlockCard.js's `if (reduceMotion) { ...
// return undefined; }`) sets both values directly via setValue() and never
// calls Animated.parallel/.start() at all - it should be immediately at
// its end state on the very first render, with no timer advancement
// needed, and unaffected by the driver-mode split above since neither
// value is ever mid-animation.
describe("BadgeUnlockCard reduceMotion", () => {
  test("skips the animation entirely and jumps straight to end-state values, with no timer advancement", async () => {
    useReducedMotion.mockReturnValue(true);

    const { UNSAFE_getAllByType } = renderWithProviders(
      <BadgeUnlockCard badge={makeBadge("Gold")} onClose={() => {}} visible />
    );

    await waitFor(() => {
      const [scaleView, glowView] = UNSAFE_getAllByType(Animated.View);

      expect(getScale(scaleView)).toBe(1);
      // glowOpacity = glowAnim.interpolate({inputRange: [0, 1], outputRange: [0, 0.5]})
      expect(getStyleValue(glowView, "shadowOpacity")).toBe(0.5);
    });
  });
});

// The outer Pressable's own accessibilityLabel makes the nested
// badgeUnlockTier/badgeUnlockRarity AppText nodes unreachable to a screen
// reader (same RN opaque-accessible-node mechanism as the Phase 9
// accessibility audit's finding #1/#3) - tier and rarity are visible on
// screen but were never spoken. Fixed by folding both into the outer
// label directly, mirroring BadgeMedal.js's own "X tier" convention.
describe("BadgeUnlockCard accessibility label", () => {
  test("includes both tier and rarity, not just the badge name and description", async () => {
    const badge = {
      id: "badge-gold",
      label: "Early Riser",
      description: "Complete a habit before 8am",
      tier: "Gold",
      rarity: "Rare",
      group: "Consistency",
    };

    renderWithProviders(<BadgeUnlockCard badge={badge} onClose={() => {}} visible />);

    const node = await screen.findByLabelText(
      "Early Riser achievement unlocked, Gold tier, Rare. Complete a habit before 8am. Double tap to dismiss."
    );

    expect(node.props.accessibilityLabel).toBe(
      "Early Riser achievement unlocked, Gold tier, Rare. Complete a habit before 8am. Double tap to dismiss."
    );
  });
});
