import { Circle, Line, Polygon } from "react-native-svg";
import { radialTicks } from "../components/progression/frameGeometry";
import { renderWithProviders, waitFor } from "../test/test-utils";
import BadgeFrame from "../components/progression/BadgeFrame";

// Render-smoke coverage for BadgeFrame's per-tier renderTierFrame() switch
// (Phase 9 test-coverage survey, "moderate cost, worth it" tier).
//
// Deliberately count elements, not snapshot markup: BadgeFrame.js's own
// comments call ornament counts "an explicit, ongoing design lever" - a
// snapshot of exact SVG output (coordinates, point strings) would break on
// every deliberate geometry tweak (radius, rotation, stroke width) for
// reasons that have nothing to do with correctness. An element-count
// assertion survives that kind of tuning and only breaks when a tier
// actually gains or loses an ornament, which is correctly a signal to
// update the test.
//
// Tick counts (Platinum 6, Master 16) are recomputed here via the same
// frameGeometry.radialTicks() helper BadgeFrame.js calls at module load,
// with the same arguments BadgeFrame.js uses (R_OUTER=36, and the
// outer-radius/count pairs read directly from BadgeFrame.js's own
// PLATINUM_TICKS/MASTER_TICKS declarations) - not re-typed magic numbers -
// so this test only drifts if BadgeFrame.js's tick-count arguments
// actually change. hexVertices() is asserted elsewhere
// (frameGeometry.test.js) to always return exactly 6 points regardless of
// radius, so Master's vertex-dot count (6) is hardcoded directly.
const R_OUTER = 36;
const PLATINUM_TICK_COUNT = radialTicks(R_OUTER, 43, 6, false).length;
const MASTER_TICK_COUNT = radialTicks(R_OUTER, 44, 16, true).length;
const MASTER_VERTEX_COUNT = 6;

const EXPECTED_COUNTS = {
  Bronze: { polygon: 1, line: 0, circle: 0 },
  Silver: { polygon: 2, line: 0, circle: 0 },
  Gold: { polygon: 2, line: 0, circle: 0 },
  Platinum: { polygon: 2, line: PLATINUM_TICK_COUNT, circle: 0 },
  Diamond: { polygon: 2, line: 0, circle: 0 },
  Master: { polygon: 2, line: MASTER_TICK_COUNT, circle: MASTER_VERTEX_COUNT },
};

describe("BadgeFrame renders the expected ornament element counts per tier", () => {
  test.each(Object.entries(EXPECTED_COUNTS))(
    "%s tier renders %o",
    async (tier, expected) => {
      const { UNSAFE_queryAllByType } = renderWithProviders(
        <BadgeFrame tier={tier} />
      );

      await waitFor(() => {
        expect(UNSAFE_queryAllByType(Polygon)).toHaveLength(expected.polygon);
        expect(UNSAFE_queryAllByType(Line)).toHaveLength(expected.line);
        expect(UNSAFE_queryAllByType(Circle)).toHaveLength(expected.circle);
      });
    }
  );

  test("an unrecognized tier falls back to Bronze's single-ring counts", async () => {
    const { UNSAFE_queryAllByType } = renderWithProviders(
      <BadgeFrame tier="NotATier" />
    );

    await waitFor(() => {
      expect(UNSAFE_queryAllByType(Polygon)).toHaveLength(1);
      expect(UNSAFE_queryAllByType(Line)).toHaveLength(0);
      expect(UNSAFE_queryAllByType(Circle)).toHaveLength(0);
    });
  });
});
