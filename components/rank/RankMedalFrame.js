import Svg, { Circle, Line, Polygon } from "react-native-svg";
import {
  facetedRimPoints,
  hexVertices,
  polygonPoints,
  radialTicks,
} from "../progression/frameGeometry";

// Code-drawn rank-medal frame, replacing the raster medals that used to
// live in assets/ranks/*.png (Phase 9 rank-medal survey/design pass). A
// sibling to ../progression/BadgeFrame.js - same react-native-svg approach,
// same 96x96 viewBox and shared point-math (./frameGeometry.js) - but a
// deliberately different silhouette: a solid circular medallion rather
// than a hexagon outline, so rank medals stay visually distinct from
// achievement badges at a glance, and so the round shape holds up at 28px
// ("mini" size, RankMedal.js) - smaller than anything BadgeFrame has to
// survive.
//
// Escalating ornament, one tier at a time, mirroring BadgeFrame's language
// without copying its exact geometry:
//
//   Bronze    baseline - disc + star
//   Silver    + inner ring
//   Gold      + scalloped rosette rim
//   Platinum  + radial bezel ticks
//   Diamond   silhouette change - gem-cut octagon (star dropped, same move
//             BadgeFrame makes for Diamond - the silhouette alone reads as
//             different, which matters more than line count at 28px)
//   Master    circular again, every layer stacked
//
// Ornament counts are trimmed relative to BadgeFrame's (8 ticks / 8 rosette
// facets here vs. BadgeFrame's 12-16) so Master's ring of ticks doesn't
// alias into a smudge at the smallest render size.
//
// Fill and secondary linework are caller-supplied neutrals, same contract
// as BadgeFrame - the tier accent lives in the disc stroke, rosette, ticks,
// vertex dots, and star, sourced by the caller (RankBadge.js) from
// constants/colors.js's badgeTierColors, not BadgeMedal.js's tierStyles -
// the two systems intentionally disagree on Platinum's hue (this one is
// the corrected silver-blue; badges kept the violet that matched the old
// raster art) and that's deliberate, not a bug to reconcile.
const CENTER = 48;
const R_DISC = 26;
const R_INNER_RING = 20;
const STAR_OUTER = 11;
const STAR_INNER = 4.5;
const ROSETTE_OUTER = 37;
const ROSETTE_INNER = 29;
const TICK_INNER = 30;
const TICK_OUTER = 38;
const TICK_COUNT = 8;
const DIAMOND_OUTER_R = 33;
const DIAMOND_INNER_R = 23;

// Geometry is static - only color varies per render - computed once at
// module load, same discipline as BadgeFrame.js.
const STAR_POINTS = facetedRimPoints(STAR_OUTER, STAR_INNER, 10);
const ROSETTE_POINTS = facetedRimPoints(ROSETTE_OUTER, ROSETTE_INNER, 16);
const BEZEL_TICKS = radialTicks(TICK_INNER, TICK_OUTER, TICK_COUNT, false);
const VERTEX_DOTS = hexVertices(R_DISC);
const DIAMOND_OUTER = polygonPoints(DIAMOND_OUTER_R, 8, 90);
const DIAMOND_INNER = polygonPoints(DIAMOND_INNER_R, 8, 112.5);

export default function RankMedalFrame({
  accentColor = "#8B8B8F",
  fillColor = "transparent",
  mutedColor = "#8B8B8F",
  size = 64,
  strokeWidth = 2.5,
  tier = "Bronze",
  style,
}) {
  // strokeWidth is an absolute pixel value, matching BadgeFrame's contract -
  // compensate for the viewBox scaling so the rendered stroke matches
  // strokeWidth exactly at any size.
  const svgStrokeWidth = (strokeWidth * 96) / size;
  const svgStrokeWidthThin = svgStrokeWidth * 0.55;

  return (
    <Svg height={size} style={style} viewBox="0 0 96 96" width={size}>
      {renderTierMedal(tier, {
        accentColor,
        fillColor,
        mutedColor,
        svgStrokeWidth,
        svgStrokeWidthThin,
      })}
    </Svg>
  );
}

function renderTierMedal(
  tier,
  { accentColor, fillColor, mutedColor, svgStrokeWidth, svgStrokeWidthThin }
) {
  if (tier === "Silver") {
    return (
      <>
        <Circle
          cx={CENTER}
          cy={CENTER}
          fill={fillColor}
          r={R_DISC}
          stroke={accentColor}
          strokeWidth={svgStrokeWidth}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          fill="none"
          opacity={0.55}
          r={R_INNER_RING}
          stroke={mutedColor}
          strokeWidth={svgStrokeWidthThin}
        />
        <Polygon fill={accentColor} points={STAR_POINTS} />
      </>
    );
  }

  if (tier === "Gold") {
    return (
      <>
        <Polygon
          fill="none"
          points={ROSETTE_POINTS}
          stroke={accentColor}
          strokeLinejoin="round"
          strokeWidth={svgStrokeWidthThin}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          fill={fillColor}
          r={R_DISC}
          stroke={accentColor}
          strokeWidth={svgStrokeWidth}
        />
        <Polygon fill={accentColor} points={STAR_POINTS} />
      </>
    );
  }

  if (tier === "Platinum") {
    return (
      <>
        {BEZEL_TICKS.map((t, index) => (
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
        <Circle
          cx={CENTER}
          cy={CENTER}
          fill={fillColor}
          r={R_DISC}
          stroke={accentColor}
          strokeWidth={svgStrokeWidth}
        />
        <Polygon fill={accentColor} points={STAR_POINTS} />
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
        {BEZEL_TICKS.map((t, index) => (
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
          fill="none"
          points={ROSETTE_POINTS}
          stroke={accentColor}
          strokeLinejoin="round"
          strokeWidth={svgStrokeWidthThin}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          fill={fillColor}
          r={R_DISC}
          stroke={accentColor}
          strokeWidth={svgStrokeWidth}
        />
        <Circle
          cx={CENTER}
          cy={CENTER}
          fill="none"
          opacity={0.55}
          r={R_INNER_RING}
          stroke={mutedColor}
          strokeWidth={svgStrokeWidthThin}
        />
        {VERTEX_DOTS.map((v, index) => (
          <Circle cx={v.cx} cy={v.cy} fill={accentColor} key={index} r={2} />
        ))}
        <Polygon fill={accentColor} points={STAR_POINTS} />
      </>
    );
  }

  // Bronze - baseline: disc + star.
  return (
    <>
      <Circle
        cx={CENTER}
        cy={CENTER}
        fill={fillColor}
        r={R_DISC}
        stroke={accentColor}
        strokeWidth={svgStrokeWidth}
      />
      <Polygon fill={accentColor} points={STAR_POINTS} />
    </>
  );
}
