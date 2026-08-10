import { fireEvent, renderWithProviders, screen } from "../test/test-utils";
import HabitCard from "../components/HabitCard";
import { toDateKey } from "../utils/habitStats";

// HabitCard's primary interaction is a swipe gesture built on a raw
// PanResponder (not react-native-gesture-handler), which RTL has no
// supported way to simulate - there's no fireGestureHandler equivalent for
// hand-rolled PanResponder sequences, and faking the underlying touch
// sequence would test our simulation of the gesture math, not the
// component. Testing through the "toggleComplete" accessibility action
// instead exercises the exact same onToggleComplete call the swipe
// eventually makes (see components/HabitCard.js's onAccessibilityAction),
// without re-implementing gesture physics in the test.
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

    const card = await screen.findByLabelText(/Drink water/);
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

    const card = await screen.findByLabelText(/Drink water/);
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

    await screen.findByLabelText(/Drink water/);
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
