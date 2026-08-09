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
