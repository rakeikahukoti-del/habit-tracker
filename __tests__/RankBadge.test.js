import { renderWithProviders, screen, waitFor } from "../test/test-utils";
import RankBadge from "../components/RankBadge";
import RankMedalFrame from "../components/rank/RankMedalFrame";

// The `decorative` prop toggles whether a rank badge announces itself to
// assistive tech (a standalone badge - e.g. a rank-history entry) or stays
// silent because a parent already owns the accessible label (e.g.
// RankMedal.js, which always renders its inner RankBadge decoratively -
// see RankMedal.test.js). Phase 9 accessibility re-audit, fixed in PR #32.
describe("RankBadge decorative prop", () => {
  test("decorative=true strips all four accessibility props", async () => {
    const { toJSON } = renderWithProviders(<RankBadge decorative rank="Gold" />);

    await waitFor(() => {
      const { props } = toJSON();

      expect(props.accessibilityLabel).toBeUndefined();
      expect(props.accessibilityRole).toBeUndefined();
      expect(props.accessible).toBe(false);
      expect(props.importantForAccessibility).toBe("no");
    });
  });

  test("decorative=false (default) exposes an image label built from the tier", async () => {
    renderWithProviders(<RankBadge rank="Gold" />);

    const node = await screen.findByLabelText("Gold rank");

    expect(node.props.accessibilityLabel).toBe("Gold rank");
    expect(node.props.accessibilityRole).toBe("image");
    expect(node.props.accessible).toBe(true);
    expect(node.props.importantForAccessibility).toBe("auto");
  });

  test("a locked badge's label appends ', locked'", async () => {
    renderWithProviders(<RankBadge locked rank="Gold" />);

    const node = await screen.findByLabelText("Gold rank, locked");

    expect(node.props.accessibilityLabel).toBe("Gold rank, locked");
  });

  test("the highest rank (Master) calls out 'highest rank' in the label", async () => {
    renderWithProviders(<RankBadge rank="Master" />);

    await screen.findByLabelText("Master rank, highest rank");
  });

  test("a locked Master badge combines both qualifiers", async () => {
    renderWithProviders(<RankBadge locked rank="Master" />);

    await screen.findByLabelText("Master rank, highest rank, locked");
  });
});

// RankBadge is a composite wrapper around RankMedalFrame (the actual SVG,
// covered element-by-element in RankMedalFrame.test.js) - it doesn't need
// its own ornament-count math. What's worth locking down here is that it
// renders without throwing for every tier, and that it hands
// RankMedalFrame the tier it was actually asked to render, not a stale or
// mis-normalized value (Phase 9 test-coverage survey, "moderate cost,
// worth it" tier).
describe("RankBadge renders across every tier and passes tier through to RankMedalFrame", () => {
  const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"];

  test.each(TIERS)("%s renders without throwing", (tier) => {
    expect(() => renderWithProviders(<RankBadge rank={tier} />)).not.toThrow();
  });

  test.each(TIERS)(
    "%s passes its own tier through to RankMedalFrame's tier prop",
    (tier) => {
      const { UNSAFE_getByType } = renderWithProviders(
        <RankBadge rank={tier} />
      );

      expect(UNSAFE_getByType(RankMedalFrame).props.tier).toBe(tier);
    }
  );

  test("an unrecognized rank normalizes to Bronze before reaching RankMedalFrame", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <RankBadge rank="NotATier" />
    );

    expect(UNSAFE_getByType(RankMedalFrame).props.tier).toBe("Bronze");
  });
});
