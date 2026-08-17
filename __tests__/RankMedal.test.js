import { renderWithProviders, screen, waitFor } from "../test/test-utils";
import RankMedal from "../components/progression/RankMedal";
import RankMedalFrame from "../components/rank/RankMedalFrame";

// RankMedal's own `decorative` prop controls its outer wrapper View only -
// it always renders its inner RankBadge decoratively regardless (see
// components/progression/RankMedal.js: `<RankBadge decorative ... />`),
// so a screen reader only ever hears one label for the whole medal, not
// two. These tests target that outer wrapper, which is the root node
// RTL renders for `<RankMedal />` on its own.
//
// Phase 9 accessibility re-audit finding #4: before PR #32, this label
// never reflected `locked` at all. Locking that in directly below.
describe("RankMedal decorative prop", () => {
  test("decorative=true strips all four accessibility props", async () => {
    const { toJSON } = renderWithProviders(<RankMedal decorative rank="Gold" />);

    await waitFor(() => {
      const { props } = toJSON();

      expect(props.accessibilityLabel).toBeUndefined();
      expect(props.accessibilityRole).toBeUndefined();
      expect(props.accessible).toBe(false);
      expect(props.importantForAccessibility).toBe("no");
    });
  });

  test("decorative=false (default) exposes an image label with the rank name", async () => {
    renderWithProviders(<RankMedal rank="Gold" />);

    const node = await screen.findByLabelText("Gold rank medal");

    expect(node.props.accessibilityLabel).toBe("Gold rank medal");
    expect(node.props.accessibilityRole).toBe("image");
    expect(node.props.accessible).toBe(true);
    expect(node.props.importantForAccessibility).toBe("auto");
  });

  test("a locked medal's label reflects the locked state", async () => {
    renderWithProviders(<RankMedal locked rank="Gold" />);

    const node = await screen.findByLabelText("Gold rank medal, locked");

    expect(node.props.accessibilityLabel).toBe("Gold rank medal, locked");
  });

  test("an unlocked medal's label omits the locked qualifier", async () => {
    renderWithProviders(<RankMedal locked={false} rank="Gold" />);

    const node = await screen.findByLabelText("Gold rank medal");

    expect(node.props.accessibilityLabel).not.toMatch(/locked/);
  });
});

// RankMedal is a composite wrapper - it renders a decorative RankBadge
// (itself covered in RankBadge.test.js), which in turn renders
// RankMedalFrame (the actual SVG, covered element-by-element in
// RankMedalFrame.test.js). Neither needs its own ornament-count math here.
// What's worth locking down is that RankMedal renders without throwing for
// every tier and every size, and that the rank it was given actually
// reaches RankMedalFrame at the bottom of the chain unchanged (Phase 9
// test-coverage survey, "moderate cost, worth it" tier).
describe("RankMedal renders across every tier and passes rank through to RankMedalFrame", () => {
  const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"];

  test.each(TIERS)("%s renders without throwing", (tier) => {
    expect(() =>
      renderWithProviders(<RankMedal rank={tier} showLabel />)
    ).not.toThrow();
  });

  test.each(TIERS)(
    "%s passes its own rank through to RankMedalFrame's tier prop",
    (tier) => {
      const { UNSAFE_getByType } = renderWithProviders(<RankMedal rank={tier} />);

      expect(UNSAFE_getByType(RankMedalFrame).props.tier).toBe(tier);
    }
  );
});
