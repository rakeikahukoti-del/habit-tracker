import { useState } from "react";
import { fireEvent, renderWithProviders, screen } from "../test/test-utils";
import HabitFormFields from "../components/HabitFormFields";
import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_EMOJI,
  DEFAULT_HABIT_FREQUENCY,
} from "../constants/habitOptions";

// HabitFormFields is a fully controlled component - pressing an option only
// calls the setter prop, it doesn't hold or reflect selection state itself.
// That's real coverage of the callback wiring, but "updates the draft" per
// the ask means the value round-tripping back in as the new `selected`
// prop too, same as app/add.js and the habit-edit screen actually use it.
// This harness mirrors that: real useState, not a jest.fn() stub.
function FormHarness() {
  const [draft, setDraft] = useState({
    category: DEFAULT_HABIT_CATEGORY,
    color: DEFAULT_HABIT_COLOR,
    customDays: [],
    emoji: DEFAULT_HABIT_EMOJI,
    frequency: DEFAULT_HABIT_FREQUENCY,
    name: "",
    reminderTime: "",
  });

  return (
    <HabitFormFields
      category={draft.category}
      color={draft.color}
      customDays={draft.customDays}
      emoji={draft.emoji}
      frequency={draft.frequency}
      name={draft.name}
      reminderTime={draft.reminderTime}
      setCategory={(category) => setDraft((d) => ({ ...d, category }))}
      setColor={(color) => setDraft((d) => ({ ...d, color }))}
      setCustomDays={(customDays) => setDraft((d) => ({ ...d, customDays }))}
      setEmoji={(emoji) => setDraft((d) => ({ ...d, emoji }))}
      setFrequency={(frequency) => setDraft((d) => ({ ...d, frequency }))}
      setName={(name) => setDraft((d) => ({ ...d, name }))}
      setReminderTime={(reminderTime) =>
        setDraft((d) => ({ ...d, reminderTime }))
      }
    />
  );
}

describe("HabitFormFields draft updates", () => {
  test("selecting an emoji marks it selected and clears the previous one", async () => {
    renderWithProviders(<FormHarness />);

    fireEvent.press(await screen.findByLabelText("Habit emoji 💪"));

    expect(screen.getByLabelText("Habit emoji 💪").props.accessibilityState).toMatchObject(
      { selected: true }
    );
    expect(
      screen.getByLabelText(`Habit emoji ${DEFAULT_HABIT_EMOJI}`).props
        .accessibilityState
    ).toMatchObject({ selected: false });
  });

  test("selecting a category marks it selected", async () => {
    renderWithProviders(<FormHarness />);

    fireEvent.press(await screen.findByLabelText("Category Fitness"));

    expect(
      screen.getByLabelText("Category Fitness").props.accessibilityState
    ).toMatchObject({ selected: true });
    expect(
      screen.getByLabelText(`Category ${DEFAULT_HABIT_CATEGORY}`).props
        .accessibilityState
    ).toMatchObject({ selected: false });
  });

  test("selecting a color marks it selected", async () => {
    renderWithProviders(<FormHarness />);
    const otherColor = "#963F4A";

    fireEvent.press(await screen.findByLabelText(`Habit color ${otherColor}`));

    expect(
      screen.getByLabelText(`Habit color ${otherColor}`).props
        .accessibilityState
    ).toMatchObject({ selected: true });
  });

  test("switching frequency to Custom reveals the day picker, and toggling a day updates customDays", async () => {
    renderWithProviders(<FormHarness />);

    expect(screen.queryByLabelText("Custom day Wed")).toBeNull();

    fireEvent.press(await screen.findByLabelText("Frequency Custom"));

    const wednesday = await screen.findByLabelText("Custom day Wed");
    expect(wednesday.props.accessibilityState).toMatchObject({
      selected: false,
    });

    fireEvent.press(wednesday);
    expect(
      screen.getByLabelText("Custom day Wed").props.accessibilityState
    ).toMatchObject({ selected: true });

    // Toggling again removes it - the draft's customDays list actually
    // round-trips both ways, not just accumulates.
    fireEvent.press(screen.getByLabelText("Custom day Wed"));
    expect(
      screen.getByLabelText("Custom day Wed").props.accessibilityState
    ).toMatchObject({ selected: false });
  });
});
