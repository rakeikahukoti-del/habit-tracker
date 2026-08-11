import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from "react-native-svg";
import { ACHIEVEMENT_GROUPS } from "../../constants/achievements";

// One dedicated code-drawn mark per badge group, composited onto
// BadgeFrame's inner area (see BadgeMedal.js) and reused at icon-only size
// in AchievementsSection.js's closest-unlocks row. Phase 8 badge/rank
// survey, Proposal A: replaces both spots' previous reliance on generic
// AppIcon glyphs shared with the rest of the app (star/flame/check/
// trophy/analytics/progress via constants/achievements.js's old
// ACHIEVEMENT_ICON_MAP) with marks that exist only for this purpose, so
// the badge wall reads by group at a glance instead of by label text.
//
// Drawn on a 32x32 grid, centered at (16,16). Deliberately simple -
// these render as small as 20px, so every mark stays to 2-3 primitives.
function Sprout({ color }) {
  return (
    <G>
      <Line
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.8}
        x1={16}
        x2={16}
        y1={24}
        y2={12.5}
      />
      <Ellipse
        cx={12.3}
        cy={15.2}
        fill={color}
        rx={4}
        ry={2.1}
        transform="rotate(-35 12.3 15.2)"
      />
      <Ellipse
        cx={19.7}
        cy={15.2}
        fill={color}
        rx={4}
        ry={2.1}
        transform="rotate(35 19.7 15.2)"
      />
      <Circle cx={16} cy={11.4} fill={color} r={1.5} />
    </G>
  );
}

// Two nested flame silhouettes - a "lineage" reading (each streak built on
// the last) rather than the single flame the app already uses for streak
// counters elsewhere.
function LayeredFlame({ color }) {
  return (
    <G>
      <Path
        d="M16 6 C12 10 10 14 10 18 C10 22.5 13 25 16 25 C19 25 22 22.5 22 18 C22 14 20 10 16 6 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
      />
      <Path
        d="M16 12.5 C14.2 14.8 13.2 16.7 13.2 18.6 C13.2 20.7 14.4 22 16 22 C17.6 22 18.8 20.7 18.8 18.6 C18.8 16.7 17.8 14.8 16 12.5 Z"
        fill={color}
        opacity={0.85}
      />
    </G>
  );
}

// A same-day cluster, not a sequence - distinct from Total completions'
// tally, which accumulates over time.
function Cluster({ color }) {
  return (
    <G>
      <Circle cx={12} cy={19} fill={color} r={2.5} />
      <Circle cx={20} cy={19} fill={color} r={2.5} />
      <Circle cx={16} cy={11.6} fill={color} r={2.5} />
    </G>
  );
}

// Classic tally-five mark - four strokes and a diagonal count-off.
function Tally({ color }) {
  return (
    <G>
      <Line stroke={color} strokeLinecap="round" strokeWidth={1.7} x1={10} x2={10} y1={10} y2={23} />
      <Line stroke={color} strokeLinecap="round" strokeWidth={1.7} x1={13.5} x2={13.5} y1={10} y2={23} />
      <Line stroke={color} strokeLinecap="round" strokeWidth={1.7} x1={17} x2={17} y1={10} y2={23} />
      <Line stroke={color} strokeLinecap="round" strokeWidth={1.7} x1={20.5} x2={20.5} y1={10} y2={23} />
      <Line stroke={color} strokeLinecap="round" strokeWidth={1.7} x1={9} x2={22} y1={22} y2={11} />
    </G>
  );
}

// A summit with a small flag planted at the peak - "reached the top",
// distinct from the generic trend-arrow icon used for progress elsewhere.
function Summit({ color }) {
  return (
    <G>
      <Polygon fill={color} points="16,8 23,22 9,22" />
      <Line stroke={color} strokeLinecap="round" strokeWidth={1.5} x1={16} x2={16} y1={8} y2={4.5} />
      <Polygon fill={color} points="16,4.5 20.5,6.2 16,8" />
    </G>
  );
}

// Stacked chevrons - rank insignia stripes, distinct from Progress's
// summit even though both groups are level-gated.
function Chevrons({ color }) {
  return (
    <G>
      <Path d="M10 12 L16 7 L22 12" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="M10 18 L16 13 L22 18" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      <Path d="M10 24 L16 19 L22 24" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
    </G>
  );
}

const GROUP_GLYPHS = {
  [ACHIEVEMENT_GROUPS[0]]: Sprout, // "Getting started"
  [ACHIEVEMENT_GROUPS[1]]: LayeredFlame, // "Consistency"
  [ACHIEVEMENT_GROUPS[2]]: Cluster, // "Daily volume"
  [ACHIEVEMENT_GROUPS[3]]: Tally, // "Total completions"
  [ACHIEVEMENT_GROUPS[4]]: Summit, // "Progress"
  [ACHIEVEMENT_GROUPS[5]]: Chevrons, // "Ranks"
};

export default function BadgeGroupGlyph({ color = "#8B8B8F", group, size = 28, style }) {
  const GlyphComponent = GROUP_GLYPHS[group];

  if (!GlyphComponent) {
    return null;
  }

  return (
    <Svg height={size} style={style} viewBox="0 0 32 32" width={size}>
      <GlyphComponent color={color} />
    </Svg>
  );
}
