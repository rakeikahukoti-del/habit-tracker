import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { v2Colors } from "../../src/design";

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
      {renderIcon(name, styles)}
    </View>
  );
}

function renderIcon(name, styles) {
  if (name === "home") {
    return (
      <>
        <View style={[styles.line, styles.homeRoofLeft]} />
        <View style={[styles.line, styles.homeRoofRight]} />
        <View style={[styles.outline, styles.homeBody]} />
      </>
    );
  }

  if (name === "progress" || name === "analytics") {
    return (
      <View style={styles.barGroup}>
        {[0.45, 0.72, 1].map((scale, index) => (
          <View
            key={`${name}-${scale}`}
            style={[
              styles.fill,
              styles.bar,
              {
                height: `${scale * 78}%`,
                opacity: name === "analytics" && index === 1 ? 0.68 : 1,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (name === "rank" || name === "trophy") {
    return (
      <>
        <View style={[styles.outline, styles.trophyCup]} />
        <View style={[styles.fill, styles.trophyStem]} />
        <View style={[styles.fill, styles.trophyBase]} />
      </>
    );
  }

  if (name === "settings") {
    return (
      <>
        <View style={[styles.outline, styles.gearOuter]} />
        <View style={[styles.fill, styles.gearInner]} />
        <View style={[styles.line, styles.gearTickA]} />
        <View style={[styles.line, styles.gearTickB]} />
      </>
    );
  }

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
    homeRoofLeft: {
      left: 4 * unit,
      top: 8 * unit,
      transform: [{ rotate: "-42deg" }],
      width: 10 * unit,
    },
    homeRoofRight: {
      right: 4 * unit,
      top: 8 * unit,
      transform: [{ rotate: "42deg" }],
      width: 10 * unit,
    },
    homeBody: {
      borderTopWidth: 0,
      bottom: 3 * unit,
      height: 11 * unit,
      left: 6 * unit,
      width: 12 * unit,
    },
    barGroup: {
      alignItems: "flex-end",
      bottom: 3 * unit,
      flexDirection: "row",
      gap: 3 * unit,
      height: 18 * unit,
      left: 3 * unit,
      position: "absolute",
      width: 18 * unit,
    },
    bar: {
      borderRadius: 2 * unit,
      bottom: 0,
      flex: 1,
      position: "relative",
    },
    trophyCup: {
      borderBottomLeftRadius: 8 * unit,
      borderBottomRightRadius: 8 * unit,
      borderTopLeftRadius: 3 * unit,
      borderTopRightRadius: 3 * unit,
      height: 10 * unit,
      left: 5 * unit,
      top: 4 * unit,
      width: 14 * unit,
    },
    trophyStem: {
      borderRadius: lineRadius,
      height: 6 * unit,
      left: 11 * unit,
      top: 14 * unit,
      width: strokeWidth,
    },
    trophyBase: {
      borderRadius: lineRadius,
      bottom: 3 * unit,
      height: strokeWidth,
      left: 7 * unit,
      width: 10 * unit,
    },
    gearOuter: {
      borderRadius: 999,
      height: 16 * unit,
      left: 4 * unit,
      top: 4 * unit,
      width: 16 * unit,
    },
    gearInner: {
      borderRadius: 999,
      height: 5 * unit,
      left: 9.5 * unit,
      top: 9.5 * unit,
      width: 5 * unit,
    },
    gearTickA: {
      left: 2 * unit,
      top: 11 * unit,
      width: 20 * unit,
    },
    gearTickB: {
      left: 2 * unit,
      top: 11 * unit,
      transform: [{ rotate: "90deg" }],
      width: 20 * unit,
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
