import { renderWithProviders, screen, waitFor } from "../test/test-utils";
import BadgeMedal from "../components/progression/BadgeMedal";

// The `decorative` prop toggles whether an achievement badge medal
// announces itself to assistive tech. Phase 9 accessibility re-audit,
// fixed in PR #32.
describe("BadgeMedal decorative prop", () => {
  const badge = { label: "Early Riser", tier: "Gold" };

  test("decorative=true strips all four accessibility props", async () => {
    const { toJSON } = renderWithProviders(
      <BadgeMedal badge={badge} decorative earned />
    );

    await waitFor(() => {
      const { props } = toJSON();

      expect(props.accessibilityLabel).toBeUndefined();
      expect(props.accessibilityRole).toBeUndefined();
      expect(props.accessible).toBe(false);
      expect(props.importantForAccessibility).toBe("no");
    });
  });

  test("decorative=false (default) labels with badge name, tier, and earned state", async () => {
    renderWithProviders(<BadgeMedal badge={badge} earned />);

    const node = await screen.findByLabelText("Early Riser, Gold tier, earned");

    expect(node.props.accessibilityLabel).toBe("Early Riser, Gold tier, earned");
    expect(node.props.accessibilityRole).toBe("image");
    expect(node.props.accessible).toBe(true);
    expect(node.props.importantForAccessibility).toBe("auto");
  });

  test("an unearned badge is labeled locked instead of earned", async () => {
    renderWithProviders(<BadgeMedal badge={badge} />);

    const node = await screen.findByLabelText("Early Riser, Gold tier, locked");

    expect(node.props.accessibilityLabel).toBe("Early Riser, Gold tier, locked");
  });
});
