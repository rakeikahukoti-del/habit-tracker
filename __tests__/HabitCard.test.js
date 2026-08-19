import { StyleSheet } from "react-native";
import {
  fireEvent,
  renderWithProviders,
  screen,
} from "../test/test-utils";
import {
  fireGestureHandler,
} from "react-native-gesture-handler/jest-utils";
import { GestureDetector, State } from "react-native-gesture-handler";
import HabitCard from "../components/HabitCard";
import { v2Layout } from "../src/design";
import { toDateKey } from "../utils/habitStats";

// The toggleComplete accessibility action exercises the exact same
// onToggleComplete call the swipe eventually makes (see
// components/HabitCard.js's onAccessibilityAction) - useful as a stand-in
// wherever a test just needs "the toggle fired," without gesture physics.
describe("HabitCard completion toggle", () => {
  const habit = {
    id: "habit-1",
    name: "Drink water",
    category: "Health",
    color: "#4F755B",
    emoji: "💧",
    completedDates: [],
  };

  test("the toggleComplete accessibility action calls onToggleComplete", async () => {
    const onToggleComplete = jest.fn();
    renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={onToggleComplete} />
    );

    const card = await screen.findByLabelText(/Drink water, Health/);
    fireEvent(card, "accessibilityAction", {
      nativeEvent: { actionName: "toggleComplete" },
    });

    expect(onToggleComplete).toHaveBeenCalledWith(habit, {
      source: "accessibility",
    });
  });

  test("a completed-today habit is announced as selected", async () => {
    const completedToday = {
      ...habit,
      // toDateKey (not toISOString) to match HabitCard's own local-date
      // logic - using UTC here would misfire near midnight in timezones
      // ahead of UTC.
      completedDates: [toDateKey(new Date())],
    };
    renderWithProviders(
      <HabitCard habit={completedToday} onToggleComplete={jest.fn()} />
    );

    const card = await screen.findByLabelText(/Drink water, Health/);
    expect(card.props.accessibilityState).toMatchObject({ selected: true });
  });
});

// Ported from the deleted TodaysFocusSection.test.js: pinning, unpinning,
// and reordering moved from that component's dedicated buttons onto
// HabitCard itself (star tap to pin/unpin, a compact up/down row when
// pinned) as part of the Phase 6 Home restructure - see
// components/home/HomeHabitList.js for how these props are derived per item.
describe("HabitCard pin controls", () => {
  const habit = {
    id: "habit-1",
    name: "Drink water",
    category: "Health",
    color: "#4F755B",
    emoji: "💧",
    completedDates: [],
  };

  test("tapping the star on an unpinned, pinnable habit calls onTogglePin", async () => {
    const onTogglePin = jest.fn();
    renderWithProviders(
      <HabitCard
        habit={habit}
        canPin
        onToggleComplete={jest.fn()}
        onTogglePin={onTogglePin}
      />
    );

    fireEvent.press(
      await screen.findByLabelText("Pin Drink water to today's focus")
    );

    expect(onTogglePin).toHaveBeenCalledWith(habit);
  });

  test("tapping the star on a pinned habit calls onTogglePin (unpin)", async () => {
    const onTogglePin = jest.fn();
    renderWithProviders(
      <HabitCard
        habit={habit}
        isPinned
        onToggleComplete={jest.fn()}
        onTogglePin={onTogglePin}
      />
    );

    fireEvent.press(
      await screen.findByLabelText("Unpin Drink water from today's focus")
    );

    expect(onTogglePin).toHaveBeenCalledWith(habit);
  });

  test("no star renders when a habit is neither pinned nor pinnable", async () => {
    renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={jest.fn()} />
    );

    await screen.findByLabelText(/Drink water, Health/);
    expect(
      screen.queryByLabelText("Pin Drink water to today's focus")
    ).toBeNull();
  });

  test("moving a pinned habit up/down calls onMoveUp/onMoveDown", async () => {
    const onMoveDown = jest.fn();
    const onMoveUp = jest.fn();
    renderWithProviders(
      <HabitCard
        habit={habit}
        canMoveDown
        canMoveUp
        isPinned
        onMoveDown={onMoveDown}
        onMoveUp={onMoveUp}
        onToggleComplete={jest.fn()}
      />
    );

    fireEvent.press(
      await screen.findByLabelText("Move Drink water up in today's focus")
    );
    fireEvent.press(
      screen.getByLabelText("Move Drink water down in today's focus")
    );

    expect(onMoveUp).toHaveBeenCalledWith(habit);
    expect(onMoveDown).toHaveBeenCalledWith(habit);
  });

  test("up/down controls are disabled at the pinned-group boundary", async () => {
    renderWithProviders(
      <HabitCard
        habit={habit}
        canMoveDown={false}
        canMoveUp={false}
        isPinned
        onToggleComplete={jest.fn()}
      />
    );

    const moveUp = await screen.findByLabelText(
      "Move Drink water up in today's focus"
    );
    const moveDown = screen.getByLabelText(
      "Move Drink water down in today's focus"
    );

    expect(moveUp.props.accessibilityState).toMatchObject({ disabled: true });
    expect(moveDown.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});

// HabitCard's swipe is built on RNGH's Gesture.Pan(), created internally via
// useMemo and not exposed as a prop/ref - fireGestureHandler needs the real
// GestureType instance actually mounted by <GestureDetector>, not a fresh
// one built in the test, so its handlerTag matches what RNGH's test mocks
// registered at render time. UNSAFE_root.findByType(GestureDetector).props
// .gesture reaches it without changing HabitCard's public API for testing.
// UNSAFE_root (not the render result's `root`, a host-element query
// wrapper without this) is the raw react-test-renderer ReactTestInstance,
// which exposes plain findByType/findAllByType rather than the
// "UNSAFE_getByType" naming @testing-library/react-native's own docs use
// elsewhere - confirmed by inspecting the actual instance's prototype
// chain rather than assuming the docs' naming applies here verbatim.
//
// One real limit, stated plainly rather than glossed over: fireGestureHandler
// simulates a gesture the native recognizer has *already decided* to
// activate (it emits BEGAN/ACTIVE/END state transitions directly) - it does
// not exercise activeOffsetX/failOffsetY's native-side arbitration logic
// itself, which is mocked away entirely in the Jest environment. So these
// tests cover onEnd's own threshold/velocity/direction decision (real,
// meaningful coverage that was structurally impossible under the old
// PanResponder implementation), not whether the native recognizer would
// have activated the gesture in the first place.
describe("HabitCard swipe gesture (RNGH)", () => {
  const habit = {
    id: "habit-1",
    name: "Drink water",
    category: "Health",
    color: "#4F755B",
    emoji: "💧",
    completedDates: [],
  };

  function getPanGesture(UNSAFE_root) {
    return UNSAFE_root.findByType(GestureDetector).props.gesture;
  }

  function endSwipe(UNSAFE_root, { translationX, translationY = 0, velocityX = 0 }) {
    fireGestureHandler(getPanGesture(UNSAFE_root), [
      { translationX, translationY, velocityX },
    ]);
  }

  test("a deliberate drag past the distance threshold completes, even at low velocity", async () => {
    const onToggleComplete = jest.fn();
    const { UNSAFE_root } = renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={onToggleComplete} />
    );
    await screen.findByLabelText(/Drink water, Health/);

    endSwipe(UNSAFE_root, { translationX: 40, velocityX: 50 });

    expect(onToggleComplete).toHaveBeenCalledWith(habit, { source: "swipe" });
  });

  test("a fast flick under the distance threshold still completes via velocity", async () => {
    // The actual fix for root cause #1 from the Thread B interaction
    // survey ("a fast flick does nothing"): the old PanResponder release
    // handler never read gestureState.vx at all, so this exact case
    // (short distance, high speed) could not succeed before this migration.
    const onToggleComplete = jest.fn();
    const { UNSAFE_root } = renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={onToggleComplete} />
    );
    await screen.findByLabelText(/Drink water, Health/);

    endSwipe(UNSAFE_root, { translationX: 15, velocityX: 900 });

    expect(onToggleComplete).toHaveBeenCalledWith(habit, { source: "swipe" });
  });

  test("a slow drag under both the distance and velocity thresholds does not toggle", async () => {
    const onToggleComplete = jest.fn();
    const { UNSAFE_root } = renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={onToggleComplete} />
    );
    await screen.findByLabelText(/Drink water, Health/);

    endSwipe(UNSAFE_root, { translationX: 15, velocityX: 50 });

    expect(onToggleComplete).not.toHaveBeenCalled();
  });

  test("a wrong-direction drag does not toggle (onEnd's own direction check)", async () => {
    // Not completed today, so only rightward (positive translationX) is a
    // valid direction - a leftward drag should never reach onToggleComplete
    // even with threshold-clearing distance and velocity.
    const onToggleComplete = jest.fn();
    const { UNSAFE_root } = renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={onToggleComplete} />
    );
    await screen.findByLabelText(/Drink water, Health/);

    endSwipe(UNSAFE_root, { translationX: -40, velocityX: -900 });

    expect(onToggleComplete).not.toHaveBeenCalled();
  });

  test("swiping left past threshold undoes a completed-today habit", async () => {
    const completedToday = {
      ...habit,
      completedDates: [toDateKey(new Date())],
    };
    const onToggleComplete = jest.fn();
    const { UNSAFE_root } = renderWithProviders(
      <HabitCard habit={completedToday} onToggleComplete={onToggleComplete} />
    );
    await screen.findByLabelText(/Drink water, Health/);

    endSwipe(UNSAFE_root, { translationX: -40, velocityX: -50 });

    expect(onToggleComplete).toHaveBeenCalledWith(completedToday, {
      source: "swipe-undo",
    });
  });

  test("a gesture interrupted before completing (as the parent list's scroll winning would cause) does not toggle", async () => {
    const onToggleComplete = jest.fn();
    const { UNSAFE_root } = renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={onToggleComplete} />
    );
    await screen.findByLabelText(/Drink water, Health/);

    fireGestureHandler(getPanGesture(UNSAFE_root), [
      { translationX: 40, velocityX: 50 },
      { translationX: 40, velocityX: 50, state: State.CANCELLED },
    ]);

    expect(onToggleComplete).not.toHaveBeenCalled();
  });

  test("swipe is inert when enableSwipeToComplete is false", async () => {
    const onToggleComplete = jest.fn();
    const { UNSAFE_root } = renderWithProviders(
      <HabitCard
        habit={habit}
        enableSwipeToComplete={false}
        onToggleComplete={onToggleComplete}
      />
    );
    await screen.findByLabelText(/Drink water, Health/);

    expect(getPanGesture(UNSAFE_root).config.enabled).toBe(false);
  });
});

// Phase 10 Thread B's tick button: a real, coexisting alternative to swipe,
// not a replacement - both call the same onToggleComplete with a distinct
// `source` tag, matching the pattern swipe/swipe-undo/accessibility already
// established.
describe("HabitCard tick button", () => {
  const habit = {
    id: "habit-1",
    name: "Drink water",
    category: "Health",
    color: "#4F755B",
    emoji: "💧",
    completedDates: [],
  };

  test("tapping the tick button on a not-completed habit completes it", async () => {
    const onToggleComplete = jest.fn();
    renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={onToggleComplete} />
    );

    fireEvent.press(
      await screen.findByLabelText("Complete Drink water for today")
    );

    expect(onToggleComplete).toHaveBeenCalledWith(habit, { source: "tick" });
  });

  test("tapping the tick button on a completed-today habit undoes it", async () => {
    const completedToday = {
      ...habit,
      completedDates: [toDateKey(new Date())],
    };
    const onToggleComplete = jest.fn();
    renderWithProviders(
      <HabitCard habit={completedToday} onToggleComplete={onToggleComplete} />
    );

    fireEvent.press(
      await screen.findByLabelText("Undo today's completion of Drink water")
    );

    expect(onToggleComplete).toHaveBeenCalledWith(completedToday, {
      source: "tick",
    });
  });

  test("the tick button is not hidden from accessibility (it's interactive now, not decorative)", async () => {
    // Regression guard: the corner it lives in used to be
    // accessibilityElementsHidden/importantForAccessibility="no-hide-
    // descendants"/pointerEvents="none" when it only held a decorative dot
    // and streak badge. That has to be gone now that a real button is there.
    renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={jest.fn()} />
    );

    const tickButton = await screen.findByLabelText(
      "Complete Drink water for today"
    );

    expect(tickButton.props.accessibilityElementsHidden).not.toBe(true);
    expect(tickButton.props.importantForAccessibility).not.toBe(
      "no-hide-descendants"
    );
  });

  test("the tick button guarantees the app's minimum tap target in both dimensions", async () => {
    // Same convention Thread A enforced on category buttons
    // (v2Layout.minTapTarget, 44x44).
    renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={jest.fn()} />
    );

    const tickButton = await screen.findByLabelText(
      "Complete Drink water for today"
    );
    const flattened = StyleSheet.flatten(
      typeof tickButton.props.style === "function"
        ? tickButton.props.style({ pressed: false })
        : tickButton.props.style
    );

    expect(flattened.height).toBe(v2Layout.minTapTarget);
    expect(flattened.width).toBe(v2Layout.minTapTarget);
  });

  test("the streak badge still renders (relocated, not removed) alongside the week's progress dots", async () => {
    renderWithProviders(
      <HabitCard habit={habit} onToggleComplete={jest.fn()} />
    );

    await screen.findByLabelText(/Drink water, Health/);
    // habit has no completedDates, so the (relocated, not removed) streak
    // badge should still be showing a real "0" - proof it moved, not
    // vanished, when the tick button took over its old corner.
    expect(screen.getByText("0")).toBeTruthy();
  });
});
