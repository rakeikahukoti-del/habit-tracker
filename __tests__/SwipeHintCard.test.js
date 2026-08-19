import { fireEvent, renderWithProviders, screen } from "../test/test-utils";
import SwipeHintCard from "../components/home/SwipeHintCard";

// Thread D (onboarding/tutorial): rewritten to cover both completion
// methods - Phase 10 Thread B added the tick button as a co-existing
// alternative to swipe, but this card's copy still only mentioned swipe.
// Content change only (see components/home/SwipeHintCard.js) - the card's
// mechanism, trigger condition, and dismiss behavior are untouched, so
// there's nothing to test there beyond what already existed implicitly via
// the onDismiss prop.
describe("SwipeHintCard", () => {
  test("names both swipe and the tick button, not swipe alone", async () => {
    renderWithProviders(<SwipeHintCard onDismiss={jest.fn()} />);

    expect(await screen.findByText("Two ways to complete")).toBeTruthy();
    expect(
      screen.getByText(
        "Swipe a habit right, or tap the tick, when it is done. Tap the card to view its details."
      )
    ).toBeTruthy();
    expect(screen.queryByText("Swipe to complete")).toBeNull();
  });

  test("accessibility label names both methods", async () => {
    renderWithProviders(<SwipeHintCard onDismiss={jest.fn()} />);

    expect(
      await screen.findByLabelText(
        "Swipe right or tap the tick to complete a habit. Double tap to dismiss this tip."
      )
    ).toBeTruthy();
  });

  test("pressing the card calls onDismiss", async () => {
    const onDismiss = jest.fn();
    renderWithProviders(<SwipeHintCard onDismiss={onDismiss} />);

    const card = await screen.findByLabelText(/Swipe right or tap the tick/);
    fireEvent.press(card);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
