import Svg from "react-native-svg";
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
