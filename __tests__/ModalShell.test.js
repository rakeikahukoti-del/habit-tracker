import { Modal, Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../test/test-utils";
import ModalShell from "../components/ui/ModalShell";

// Covers the backdrop-tap-to-dismiss and VoiceOver escape-gesture behavior
// added in the accessibility audit (components/ui/ModalShell.js).
//
// Deliberately NOT tested here: that tapping the card itself doesn't bubble
// to the backdrop's onClose. RTL's fireEvent.press calls a target element's
// own onPress directly - it doesn't simulate React Native's native touch
// responder system, which is what actually decides whether a nested
// Pressable's tap propagates to its parent. That guarantee comes from RN
// itself (every nested-Pressable pattern in the app relies on it), not from
// application logic this suite is responsible for re-verifying.
describe("ModalShell", () => {
  // ThemeProvider reads its persisted preference from AsyncStorage
  // asynchronously (see context/ThemeContext.js), so rendering settles one
  // microtask after `render()` returns. `findByTestId` (unlike getByTestId)
  // retries until that resolves, which is what keeps this act()-warning-free.
  async function renderModal(onClose = jest.fn()) {
    renderWithProviders(
      <ModalShell onClose={onClose} visible>
        <Text>Modal content</Text>
      </ModalShell>
    );
    await screen.findByTestId("modal-backdrop");

    return onClose;
  }

  test("tapping the backdrop calls onClose", async () => {
    const onClose = await renderModal();

    fireEvent.press(screen.getByTestId("modal-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("the VoiceOver escape gesture calls onClose", async () => {
    const onClose = await renderModal();

    fireEvent(screen.getByTestId("modal-card"), "accessibilityEscape");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("wires onClose to the Modal's onRequestClose (Android hardware back)", async () => {
    const onClose = await renderModal();

    expect(screen.UNSAFE_getByType(Modal).props.onRequestClose).toBe(
      onClose
    );
  });
});
