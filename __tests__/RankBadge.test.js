import { renderWithProviders, screen, waitFor } from "../test/test-utils";
import RankBadge from "../components/RankBadge";

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
