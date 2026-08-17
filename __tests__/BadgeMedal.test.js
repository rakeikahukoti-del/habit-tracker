import { renderWithProviders, screen, waitFor } from "../test/test-utils";
import BadgeMedal from "../components/progression/BadgeMedal";
import BadgeFrame from "../components/progression/BadgeFrame";

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

// BadgeMedal is a composite wrapper around BadgeFrame (the actual SVG,
// covered element-by-element in BadgeFrame.test.js) plus BadgeGroupGlyph -
// it doesn't need its own ornament-count math. What's worth locking down
// here is that it renders without throwing for every tier, and that it
// hands BadgeFrame the tier the badge actually carries (Phase 9
// test-coverage survey, "moderate cost, worth it" tier).
describe("BadgeMedal renders across every tier and passes tier through to BadgeFrame", () => {
  const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"];

  test.each(TIERS)("%s renders without throwing", (tier) => {
    const tierBadge = { label: "Tier Badge", tier, group: "Consistency" };

    expect(() =>
      renderWithProviders(<BadgeMedal badge={tierBadge} earned />)
    ).not.toThrow();
  });

  test.each(TIERS)(
    "%s passes its own tier through to BadgeFrame's tier prop",
    (tier) => {
      const tierBadge = { label: "Tier Badge", tier, group: "Consistency" };
      const { UNSAFE_getByType } = renderWithProviders(
        <BadgeMedal badge={tierBadge} earned />
      );

      expect(UNSAFE_getByType(BadgeFrame).props.tier).toBe(tier);
    }
  );
});
