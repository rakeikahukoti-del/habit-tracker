import { fireEvent, renderWithProviders, screen } from "../test/test-utils";
import TodaysFocusSection from "../components/home/TodaysFocusSection";

function makeHabit(id, name) {
  return {
    id,
    name,
    category: "Health",
    color: "#4F755B",
    emoji: "💧",
    completedDates: [],
  };
}

const baseProps = {
  dailyPlanMessage: "",
  dailyPlanProgress: { completedCount: 0, totalCount: 2 },
  enableLongPressReorder: true,
  enableSwipeToComplete: true,
  habits: [],
  isSmallScreen: false,
  onAddPriority: jest.fn(),
  onMovePriority: jest.fn(),
  onOpenFocusMode: jest.fn(),
  onReorderPress: jest.fn(),
  onRemovePriority: jest.fn(),
  onToggleComplete: jest.fn(),
};

function renderSection(overrides) {
  const props = { ...baseProps, ...overrides };
  renderWithProviders(<TodaysFocusSection {...props} />);

  return props;
}

describe("TodaysFocusSection priority controls", () => {
  const habitA = makeHabit("a", "Drink water");
  const habitB = makeHabit("b", "Read");

  test("moving a habit down calls onMovePriority(habit, \"down\")", async () => {
    const props = renderSection({
      availablePriorityHabits: [],
      priorityHabits: [habitA, habitB],
    });

    fireEvent.press(
      await screen.findByLabelText("Move Drink water down in today's focus")
    );

    expect(props.onMovePriority).toHaveBeenCalledWith(habitA, "down");
  });

  test("moving the last habit up calls onMovePriority(habit, \"up\")", async () => {
    const props = renderSection({
      availablePriorityHabits: [],
      priorityHabits: [habitA, habitB],
    });

    fireEvent.press(
      await screen.findByLabelText("Move Read up in today's focus")
    );

    expect(props.onMovePriority).toHaveBeenCalledWith(habitB, "up");
  });

  test("the up control is disabled for the first habit, down for the last", async () => {
    renderSection({ availablePriorityHabits: [], priorityHabits: [habitA, habitB] });

    const moveFirstUp = await screen.findByLabelText(
      "Move Drink water up in today's focus"
    );
    const moveLastDown = screen.getByLabelText(
      "Move Read down in today's focus"
    );

    expect(moveFirstUp.props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(moveLastDown.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  test("removing a habit calls onRemovePriority(habit)", async () => {
    const props = renderSection({
      availablePriorityHabits: [],
      priorityHabits: [habitA],
    });

    fireEvent.press(
      await screen.findByLabelText("Remove Drink water from today's focus")
    );

    expect(props.onRemovePriority).toHaveBeenCalledWith(habitA);
  });

  test("adding a habit from the picker calls onAddPriority(habit)", async () => {
    const props = renderSection({
      availablePriorityHabits: [habitA],
      priorityHabits: [],
    });

    fireEvent.press(
      await screen.findByLabelText("Add Drink water to today's focus")
    );

    expect(props.onAddPriority).toHaveBeenCalledWith(habitA);
  });
});
