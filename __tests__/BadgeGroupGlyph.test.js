import Svg, { Circle, Ellipse, Line, Path, Polygon } from "react-native-svg";
import { renderWithProviders, waitFor } from "../test/test-utils";
import BadgeGroupGlyph from "../components/progression/BadgeGroupGlyph";
import { ACHIEVEMENT_GROUPS } from "../constants/achievements";

// BadgeGroupGlyph's GROUP_GLYPHS map (components/progression/
// BadgeGroupGlyph.js) is keyed positionally off ACHIEVEMENT_GROUPS
// (constants/achievements.js) - a group with no matching key silently
// renders null with no error. This table-driven pass over every real
// group value is what would catch a group added to ACHIEVEMENT_GROUPS
// without a matching glyph, or the two lists drifting out of index
// alignment (Phase 9 test-coverage survey).
describe("BadgeGroupGlyph renders a glyph for every achievement group", () => {
  test.each(ACHIEVEMENT_GROUPS)("group %p renders a non-null Svg", async (group) => {
    const { UNSAFE_getByType } = renderWithProviders(
      <BadgeGroupGlyph group={group} />
    );

    await waitFor(() => {
      expect(UNSAFE_getByType(Svg)).toBeTruthy();
    });
  });
});

// BadgeGroupGlyph doesn't branch on badge tier (that's BadgeFrame/
// RankMedalFrame's axis, covered element-by-element in their own test
// files) - it branches on achievement group instead, one dedicated
// primitive-count mark per group (GROUP_GLYPHS in
// components/progression/BadgeGroupGlyph.js). There happen to be exactly
// 6 groups, same as the 6 tiers those other components render across, but
// the two axes are unrelated.
//
// Same reasoning as BadgeFrame.test.js/RankMedalFrame.test.js applies:
// assert element counts per group rather than snapshotting path data, so
// this only breaks when a glyph actually gains or loses a primitive, not
// when its coordinates get nudged.
//
// One react-native-svg implementation detail this table has to account
// for: <Polygon> is not its own native primitive - its class component's
// render() (node_modules/react-native-svg's Polygon.js) returns a nested
// <Path> element built from its points. That inner Path is a real node in
// the rendered tree, so UNSAFE_queryAllByType(Path) matches it too - every
// Polygon instance silently adds one to the Path count on top of any Path
// elements a glyph renders directly. Circle/Line/Ellipse render their own
// dedicated native components instead, so they don't have this quirk.
// Summit's `path: 2` below is exactly its two Polygons' internal Paths,
// not two directly-authored <Path> elements - Summit's own code only ever
// calls <Polygon>/<Line>.
const EXPECTED_COUNTS = {
  "Getting started": { line: 1, ellipse: 2, circle: 1, path: 0, polygon: 0 }, // Sprout
  Consistency: { line: 0, ellipse: 0, circle: 0, path: 2, polygon: 0 }, // LayeredFlame (2 direct Paths)
  "Daily volume": { line: 0, ellipse: 0, circle: 3, path: 0, polygon: 0 }, // Cluster
  "Total completions": { line: 5, ellipse: 0, circle: 0, path: 0, polygon: 0 }, // Tally
  Progress: { line: 1, ellipse: 0, circle: 0, path: 2, polygon: 2 }, // Summit (path count = Polygon-internal only)
  Ranks: { line: 0, ellipse: 0, circle: 0, path: 3, polygon: 0 }, // Chevrons (3 direct Paths)
};

describe("BadgeGroupGlyph renders the expected primitive element counts per group", () => {
  test.each(Object.entries(EXPECTED_COUNTS))(
    "group %s renders %o",
    async (group, expected) => {
      const { UNSAFE_queryAllByType } = renderWithProviders(
        <BadgeGroupGlyph group={group} />
      );

      await waitFor(() => {
        expect(UNSAFE_queryAllByType(Line)).toHaveLength(expected.line);
        expect(UNSAFE_queryAllByType(Ellipse)).toHaveLength(expected.ellipse);
        expect(UNSAFE_queryAllByType(Circle)).toHaveLength(expected.circle);
        expect(UNSAFE_queryAllByType(Path)).toHaveLength(expected.path);
        expect(UNSAFE_queryAllByType(Polygon)).toHaveLength(expected.polygon);
      });
    }
  );
});
