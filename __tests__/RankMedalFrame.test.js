import { Circle, Line, Polygon } from "react-native-svg";
import { radialTicks } from "../components/progression/frameGeometry";
import { renderWithProviders, waitFor } from "../test/test-utils";
import RankMedalFrame from "../components/rank/RankMedalFrame";

// Render-smoke coverage for RankMedalFrame's per-tier renderTierMedal()
// switch, sibling to BadgeFrame.test.js (Phase 9 test-coverage survey,
// "moderate cost, worth it" tier). Same rationale as BadgeFrame.test.js:
// RankMedalFrame.js's own comments call its ornament counts (deliberately
// trimmed relative to BadgeFrame's - 8 bezel ticks here vs. BadgeFrame's
// 6/16) an explicit design lever, so this asserts element counts, not
// snapshot markup - it survives geometry tuning (radius, rotation) and only
// breaks on an actual ornament-count regression.
//
// Star and rosette shapes come from facetedRimPoints(), which - like
// polygonPoints() - packs every vertex into a single `points` string on one
// <Polygon>, not one element per vertex. Only radialTicks() (bezel ticks)
// and hexVertices() (Master's vertex dots) render one element per index via
// .map(), so those are the only counts that vary by ornament density.
//
// TICK_COUNT (8) is recomputed here via frameGeometry.radialTicks() with
// the same inner/outer radius and count RankMedalFrame.js's own
// BEZEL_TICKS declaration uses, rather than a re-typed magic number.
// hexVertices() always returns exactly 6 points regardless of radius
// (asserted directly in frameGeometry.test.js), so Master's vertex-dot
// count is hardcoded.
const TICK_COUNT = radialTicks(30, 38, 8, false).length;
const VERTEX_DOT_COUNT = 6;

const EXPECTED_COUNTS = {
  // disc + star
  Bronze: { polygon: 1, line: 0, circle: 1 },
  // disc + inner ring + star
  Silver: { polygon: 1, line: 0, circle: 2 },
  // rosette + disc + star
  Gold: { polygon: 2, line: 0, circle: 1 },
  // bezel ticks + disc + star
  Platinum: { polygon: 1, line: TICK_COUNT, circle: 1 },
  // gem-cut octagon outer + inner
  Diamond: { polygon: 2, line: 0, circle: 0 },
  // bezel ticks + rosette + disc + inner ring + vertex dots + star
  Master: {
    polygon: 2,
    line: TICK_COUNT,
    circle: 2 + VERTEX_DOT_COUNT,
  },
};

describe("RankMedalFrame renders the expected ornament element counts per tier", () => {
  test.each(Object.entries(EXPECTED_COUNTS))(
    "%s tier renders %o",
    async (tier, expected) => {
      const { UNSAFE_queryAllByType } = renderWithProviders(
        <RankMedalFrame tier={tier} />
      );

      await waitFor(() => {
        expect(UNSAFE_queryAllByType(Polygon)).toHaveLength(expected.polygon);
        expect(UNSAFE_queryAllByType(Line)).toHaveLength(expected.line);
        expect(UNSAFE_queryAllByType(Circle)).toHaveLength(expected.circle);
      });
    }
  );

  test("an unrecognized tier falls back to Bronze's disc-and-star counts", async () => {
    const { UNSAFE_queryAllByType } = renderWithProviders(
      <RankMedalFrame tier="NotATier" />
    );

    await waitFor(() => {
      expect(UNSAFE_queryAllByType(Polygon)).toHaveLength(1);
      expect(UNSAFE_queryAllByType(Line)).toHaveLength(0);
      expect(UNSAFE_queryAllByType(Circle)).toHaveLength(1);
    });
  });
});
