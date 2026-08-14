import Svg, { Circle, Line, Polygon } from "react-native-svg";
import {
  facetedRimPoints,
  hexVertices,
  polygonPoints,
  radialTicks,
} from "./frameGeometry";

// Code-drawn achievement-badge frame, replacing the 26 flat raster PNGs
// that used to live in assets/achievements/*.png. Converted to
// react-native-svg following the same pattern Phase 7 used for the nav
// icons (components/ui/AppIcon.js) - one component, one shape per tier,
// theme-correct automatically since color always comes in as a prop.
//
// Escalating shape language, one tier at a time (Phase 8 badge/rank
// survey, Proposal A): each tier keeps the hexagon-and-glyph structure
// players already recognize, but earns one new piece of frame geometry on
// top of the last, so climbing tiers reads as visibly earning more
// ornamentation, not just a different ring color.
//
//   Bronze    baseline - single ring
//   Silver    + inner ring
//   Gold      + faceted rim
//   Platinum  + instrument ticks
//   Diamond   silhouette change - gem-cut octagon
//   Master    + full sunburst + vertex marks
//
// Fill and secondary linework are always caller-supplied neutrals (kept
// grayscale by every current caller) - the tier accent lives in exactly
// one place, the single ring stroke, sourced by the caller from
// BadgeMedal.js's tierStyles. That closes the three-way color drift the
// survey found between this component, the shipped rank-medal art, and
// the old baked-in achievement-badge ring colors.
//
// Point-math helpers (pointAt/polygonPoints/facetedRimPoints/radialTicks/
// hexVertices) live in ./frameGeometry.js, shared with
// ../rank/RankMedalFrame.js (Phase 9) rather than duplicated per component.
const R_OUTER = 36;
const R_INNER = 30;
const GOLD_INNER_R = 28;

// Geometry is static - only color varies per render - so every shape is
// computed once at module load rather than recomputed on each render.
const OUTER_HEX = polygonPoints(R_OUTER, 6);
const INNER_HEX = polygonPoints(R_INNER, 6);
const GOLD_INNER_HEX = polygonPoints(GOLD_INNER_R, 6);
const GOLD_RIM = facetedRimPoints(R_OUTER, 32.5, 12);
const PLATINUM_TICKS = radialTicks(R_OUTER, 43, 6, false);
const MASTER_TICKS = radialTicks(R_OUTER, 44, 16, true);
const MASTER_VERTICES = hexVertices(R_OUTER);
const DIAMOND_OUTER = polygonPoints(34, 8, 90);
const DIAMOND_INNER = polygonPoints(24, 8, 112.5);

export default function BadgeFrame({
  accentColor = "#8B8B8F",
  fillColor = "transparent",
  mutedColor = "#8B8B8F",
  size = 64,
  strokeWidth = 2.5,
  tier = "Bronze",
  style,
}) {
  // strokeWidth is an absolute pixel value in this component's contract,
  // matching AppIcon's - compensate for the viewBox scaling so the
  // rendered stroke matches strokeWidth exactly at any size.
  const svgStrokeWidth = (strokeWidth * 96) / size;
  const svgStrokeWidthThin = svgStrokeWidth * 0.55;

  return (
    <Svg height={size} style={style} viewBox="0 0 96 96" width={size}>
      {renderTierFrame(tier, {
        accentColor,
        fillColor,
        mutedColor,
        svgStrokeWidth,
        svgStrokeWidthThin,
      })}
    </Svg>
  );
}

function renderTierFrame(
  tier,
  { accentColor, fillColor, mutedColor, svgStrokeWidth, svgStrokeWidthThin }
) {
  if (tier === "Silver") {
    return (
      <>
        <Polygon
          fill={fillColor}
          points={OUTER_HEX}
          stroke={accentColor}
          strokeWidth={svgStrokeWidth}
        />
        <Polygon
          fill="none"
          opacity={0.55}
          points={INNER_HEX}
          stroke={mutedColor}
          strokeWidth={svgStrokeWidthThin}
        />
      </>
    );
  }

  if (tier === "Gold") {
    return (
      <>
        <Polygon
          fill={fillColor}
          points={GOLD_RIM}
          stroke={accentColor}
          strokeLinejoin="round"
          strokeWidth={svgStrokeWidth}
        />
        <Polygon
          fill="none"
          opacity={0.5}
          points={GOLD_INNER_HEX}
          stroke={mutedColor}
          strokeWidth={svgStrokeWidthThin}
        />
      </>
    );
  }

  if (tier === "Platinum") {
    return (
      <>
        {PLATINUM_TICKS.map((t, index) => (
          <Line
            key={index}
            stroke={mutedColor}
            strokeLinecap="round"
            strokeWidth={svgStrokeWidthThin}
            x1={t.x1}
            x2={t.x2}
            y1={t.y1}
            y2={t.y2}
          />
        ))}
        <Polygon
          fill={fillColor}
          points={OUTER_HEX}
          stroke={accentColor}
          strokeWidth={svgStrokeWidth}
        />
        <Polygon
          fill="none"
          opacity={0.55}
          points={INNER_HEX}
          stroke={mutedColor}
          strokeWidth={svgStrokeWidthThin}
        />
      </>
    );
  }

  if (tier === "Diamond") {
    return (
      <>
        <Polygon
          fill={fillColor}
          points={DIAMOND_OUTER}
          stroke={accentColor}
          strokeWidth={svgStrokeWidth * 0.85}
        />
        <Polygon
          fill="none"
          opacity={0.5}
          points={DIAMOND_INNER}
          stroke={mutedColor}
          strokeWidth={svgStrokeWidthThin * 0.75}
        />
      </>
    );
  }

  if (tier === "Master") {
    return (
      <>
        {MASTER_TICKS.map((t, index) => (
          <Line
            key={index}
            stroke={mutedColor}
            strokeLinecap="round"
            strokeWidth={svgStrokeWidthThin}
            x1={t.x1}
            x2={t.x2}
            y1={t.y1}
            y2={t.y2}
          />
        ))}
        <Polygon
          fill={fillColor}
          points={OUTER_HEX}
          stroke={accentColor}
          strokeWidth={svgStrokeWidth}
        />
        <Polygon
          fill="none"
          opacity={0.55}
          points={INNER_HEX}
          stroke={mutedColor}
          strokeWidth={svgStrokeWidthThin}
        />
        {MASTER_VERTICES.map((v, index) => (
          <Circle cx={v.cx} cy={v.cy} fill={accentColor} key={index} r={2} />
        ))}
      </>
    );
  }

  // Bronze - baseline, single ring.
  return (
    <Polygon
      fill={fillColor}
      points={OUTER_HEX}
      stroke={accentColor}
      strokeWidth={svgStrokeWidth}
    />
  );
}
