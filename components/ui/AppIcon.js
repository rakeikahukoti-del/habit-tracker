import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { v2Colors, v2Radius } from "../../src/design";

// Nav-tab icons only. Converted from the hand-rolled View geometry below to
// react-native-svg path data as part of the Phase 7 nav icon redraw -
// approved via the "Nav Icon Redraw Proposal" survey artifact, anchored on
// a previously-drafted (stashed, never merged) fix for Progress/Analytics.
// Geometry is a 24x24 grid, matching the proposal's verified-at-23px specs.
const SVG_ICON_DEFS = {
  home: {
    strokes: ["M4 12 L12 5 L20 12 M6 10.5 V20 H18 V10.5"],
  },
  progress: {
    // Trend line + a solid corner-join arrowhead (not two separate thin
    // wing strokes, per the survey's finding that those went faint at 23px).
    strokes: ["M4 16 L9.5 9.5 L14 13.5 L20 6", "M14.5 6 H20 V11.5"],
  },
  analytics: {
    // Bars + baseline, carried through unchanged from the stashed concept.
    strokes: ["M4 20 H20"],
    fills: ["M6 13 h3.4 v7 h-3.4 Z", "M10.3 9 h3.4 v11 h-3.4 Z", "M14.6 5 h3.4 v15 h-3.4 Z"],
  },
  rank: {
    strokes: [
      "M8 5 H16 V11 C16 14.3 13.5 17 12 17 C10.5 17 8 14.3 8 11 Z",
      "M8 6.5 C5.5 6.5 5 8.5 6.5 10.5 C7.2 11.4 8 11.6 8 11.6",
      "M16 6.5 C18.5 6.5 19 8.5 17.5 10.5 C16.8 11.4 16 11.6 16 11.6",
      "M12 17 V19.5",
      "M8.5 20.5 H15.5",
    ],
  },
  settings: {
    circles: [{ cx: 12, cy: 12, r: 4 }],
    // Teeth overlap the ring (inner edge at radius 2.5, well inside the
    // ring; outer edge at radius 6) rather than sitting flush against its
    // outer edge - a gap there is what made an earlier draft read as a
    // sunburst instead of a gear at 23px.
    teeth: [0, 45, 90, 135, 180, 225, 270, 315],
  },
};
SVG_ICON_DEFS.trophy = SVG_ICON_DEFS.rank;

function renderSvgIcon(name, { color, size, strokeWidth }) {
  const def = SVG_ICON_DEFS[name];
  // Stroke width is an absolute pixel value in this component's contract
  // (unlike position/size, which scale with `size`) - compensate for the
  // viewBox scaling so the rendered stroke matches strokeWidth exactly at
  // any size, same contract the View-based icons below already have.
  const svgStrokeWidth = (strokeWidth * 24) / size;

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {(def.strokes || []).map((d) => (
        <Path
          d={d}
          fill="none"
          key={d}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={svgStrokeWidth}
        />
      ))}
      {(def.fills || []).map((d) => (
        <Path d={d} fill={color} key={d} />
      ))}
      {(def.circles || []).map((c) => (
        <Circle
          cx={c.cx}
          cy={c.cy}
          fill="none"
          key={`${c.cx}-${c.cy}-${c.r}`}
          r={c.r}
          stroke={color}
          strokeWidth={svgStrokeWidth}
        />
      ))}
      {(def.teeth || []).map((angle) => (
        <Rect
          fill={color}
          height={3.5}
          key={angle}
          rx={1}
          transform={`rotate(${angle} 12 12)`}
          width={2}
          x={11}
          y={6}
        />
      ))}
    </Svg>
  );
}

export default function AppIcon({
  color = v2Colors.textPrimary,
  name,
  size = 22,
  strokeWidth = 2,
  style,
}) {
  const styles = useMemo(
    () => createStyles(color, size, strokeWidth),
    [color, size, strokeWidth]
  );

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      pointerEvents="none"
      style={[styles.icon, style]}
    >
      {SVG_ICON_DEFS[name]
        ? renderSvgIcon(name, { color, size, strokeWidth })
        : renderIcon(name, styles)}
    </View>
  );
}

function renderIcon(name, styles) {
  if (name === "plus") {
    return (
      <>
        <View style={[styles.line, styles.plusVertical]} />
        <View style={[styles.line, styles.plusHorizontal]} />
      </>
    );
  }

  if (name === "check") {
    return (
      <>
        <View style={[styles.line, styles.checkShort]} />
        <View style={[styles.line, styles.checkLong]} />
      </>
    );
  }

  if (name === "undo") {
    return (
      <>
        <View style={[styles.line, styles.undoArc]} />
        <View style={[styles.line, styles.undoHeadA]} />
        <View style={[styles.line, styles.undoHeadB]} />
      </>
    );
  }

  if (name === "drag") {
    return (
      <>
        <View style={[styles.line, styles.dragLineTop]} />
        <View style={[styles.line, styles.dragLineMiddle]} />
        <View style={[styles.line, styles.dragLineBottom]} />
      </>
    );
  }

  if (
    name === "chevron-up" ||
    name === "chevron-down" ||
    name === "chevron-left" ||
    name === "chevron-right"
  ) {
    const isUp = name === "chevron-up";
    const isLeft = name === "chevron-left";
    const isRight = name === "chevron-right";

    return (
      <>
        <View
          style={[
            styles.line,
            isRight
              ? styles.chevronRightTop
              : isLeft
                ? styles.chevronLeftTop
              : isUp
                ? styles.chevronUpLeft
                : styles.chevronDownLeft,
          ]}
        />
        <View
          style={[
            styles.line,
            isRight
              ? styles.chevronRightBottom
              : isLeft
                ? styles.chevronLeftBottom
              : isUp
                ? styles.chevronUpRight
                : styles.chevronDownRight,
          ]}
        />
      </>
    );
  }

  if (name === "flame") {
    return (
      <>
        <View style={[styles.outline, styles.flameOuter]} />
        <View style={[styles.fill, styles.flameInner]} />
      </>
    );
  }

  if (name === "star") {
    return (
      <>
        <View style={[styles.line, styles.starA]} />
        <View style={[styles.line, styles.starB]} />
        <View style={[styles.line, styles.starC]} />
      </>
    );
  }

  if (name === "sort-asc" || name === "sort-desc") {
    const isAsc = name === "sort-asc";

    return (
      <>
        <View style={[styles.fill, styles.sortBarA]} />
        <View style={[styles.fill, styles.sortBarB]} />
        <View style={[styles.fill, styles.sortBarC]} />
        <View style={[styles.line, isAsc ? styles.sortArrowUp : styles.sortArrowDown]} />
        <View style={[styles.line, isAsc ? styles.sortArrowWingAUp : styles.sortArrowWingADown]} />
        <View style={[styles.line, isAsc ? styles.sortArrowWingBUp : styles.sortArrowWingBDown]} />
      </>
    );
  }

  return <View style={[styles.outline, styles.fallback]} />;
}

function createStyles(color, size, strokeWidth) {
  const unit = size / 24;
  const lineRadius = strokeWidth / 2;

  return StyleSheet.create({
    icon: {
      height: size,
      position: "relative",
      width: size,
    },
    line: {
      backgroundColor: color,
      borderRadius: lineRadius,
      height: strokeWidth,
      position: "absolute",
    },
    fill: {
      backgroundColor: color,
      position: "absolute",
    },
    outline: {
      borderColor: color,
      borderWidth: strokeWidth,
      position: "absolute",
    },
    plusVertical: {
      height: 16 * unit,
      left: 11 * unit,
      top: 4 * unit,
      width: strokeWidth,
    },
    plusHorizontal: {
      left: 4 * unit,
      top: 11 * unit,
      width: 16 * unit,
    },
    checkShort: {
      left: 5 * unit,
      top: 13 * unit,
      transform: [{ rotate: "45deg" }],
      width: 7 * unit,
    },
    checkLong: {
      left: 10 * unit,
      top: 11 * unit,
      transform: [{ rotate: "-45deg" }],
      width: 12 * unit,
    },
    undoArc: {
      borderBottomColor: color,
      borderBottomWidth: strokeWidth,
      borderLeftColor: color,
      borderLeftWidth: strokeWidth,
      borderRadius: 9 * unit,
      height: 15 * unit,
      left: 5 * unit,
      top: 5 * unit,
      width: 15 * unit,
    },
    undoHeadA: {
      left: 4 * unit,
      top: 6 * unit,
      transform: [{ rotate: "-35deg" }],
      width: 7 * unit,
    },
    undoHeadB: {
      left: 4 * unit,
      top: 6 * unit,
      transform: [{ rotate: "55deg" }],
      width: 7 * unit,
    },
    dragLineTop: {
      left: 5 * unit,
      top: 6 * unit,
      width: 14 * unit,
    },
    dragLineMiddle: {
      left: 5 * unit,
      top: 11 * unit,
      width: 14 * unit,
    },
    dragLineBottom: {
      left: 5 * unit,
      top: 16 * unit,
      width: 14 * unit,
    },
    chevronDownLeft: {
      left: 5 * unit,
      top: 10 * unit,
      transform: [{ rotate: "45deg" }],
      width: 9 * unit,
    },
    chevronDownRight: {
      right: 5 * unit,
      top: 10 * unit,
      transform: [{ rotate: "-45deg" }],
      width: 9 * unit,
    },
    chevronUpLeft: {
      left: 5 * unit,
      top: 11 * unit,
      transform: [{ rotate: "-45deg" }],
      width: 9 * unit,
    },
    chevronUpRight: {
      right: 5 * unit,
      top: 11 * unit,
      transform: [{ rotate: "45deg" }],
      width: 9 * unit,
    },
    chevronRightTop: {
      right: 6 * unit,
      top: 8 * unit,
      transform: [{ rotate: "45deg" }],
      width: 9 * unit,
    },
    chevronRightBottom: {
      right: 6 * unit,
      top: 14 * unit,
      transform: [{ rotate: "-45deg" }],
      width: 9 * unit,
    },
    chevronLeftTop: {
      left: 6 * unit,
      top: 8 * unit,
      transform: [{ rotate: "-45deg" }],
      width: 9 * unit,
    },
    chevronLeftBottom: {
      left: 6 * unit,
      top: 14 * unit,
      transform: [{ rotate: "45deg" }],
      width: 9 * unit,
    },
    flameOuter: {
      borderBottomLeftRadius: 9 * unit,
      borderBottomRightRadius: 9 * unit,
      borderTopLeftRadius: 12 * unit,
      borderTopRightRadius: 5 * unit,
      height: 17 * unit,
      left: 6 * unit,
      top: 3 * unit,
      transform: [{ rotate: "18deg" }],
      width: 12 * unit,
    },
    flameInner: {
      borderRadius: 999,
      height: 5 * unit,
      left: 10 * unit,
      top: 12 * unit,
      width: 4 * unit,
    },
    starA: {
      left: 5 * unit,
      top: 11 * unit,
      width: 14 * unit,
    },
    starB: {
      left: 5 * unit,
      top: 11 * unit,
      transform: [{ rotate: "60deg" }],
      width: 14 * unit,
    },
    starC: {
      left: 5 * unit,
      top: 11 * unit,
      transform: [{ rotate: "-60deg" }],
      width: 14 * unit,
    },
    sortBarA: {
      borderRadius: v2Radius.pill,
      height: 2 * unit,
      left: 3 * unit,
      top: 7 * unit,
      width: 9 * unit,
    },
    sortBarB: {
      borderRadius: v2Radius.pill,
      height: 2 * unit,
      left: 3 * unit,
      top: 12 * unit,
      width: 12 * unit,
    },
    sortBarC: {
      borderRadius: v2Radius.pill,
      height: 2 * unit,
      left: 3 * unit,
      top: 17 * unit,
      width: 15 * unit,
    },
    sortArrowUp: {
      height: 13 * unit,
      right: 3 * unit,
      top: 5 * unit,
      width: strokeWidth,
    },
    sortArrowDown: {
      height: 13 * unit,
      right: 3 * unit,
      top: 5 * unit,
      width: strokeWidth,
    },
    sortArrowWingAUp: {
      right: 1 * unit,
      top: 6 * unit,
      transform: [{ rotate: "45deg" }],
      width: 6 * unit,
    },
    sortArrowWingBUp: {
      right: 5 * unit,
      top: 6 * unit,
      transform: [{ rotate: "-45deg" }],
      width: 6 * unit,
    },
    sortArrowWingADown: {
      right: 1 * unit,
      top: 17 * unit,
      transform: [{ rotate: "-45deg" }],
      width: 6 * unit,
    },
    sortArrowWingBDown: {
      right: 5 * unit,
      top: 17 * unit,
      transform: [{ rotate: "45deg" }],
      width: 6 * unit,
    },
    fallback: {
      borderRadius: 999,
      height: 16 * unit,
      left: 4 * unit,
      top: 4 * unit,
      width: 16 * unit,
    },
  });
}
