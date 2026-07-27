import { StyleSheet, View } from "react-native";
import {
  v2FontWeight,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../../src/design";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../ui";

const rankMedalStyles = {
  Bronze: {
    accent: "#A97142",
    dark: "#5B3820",
    light: "#D6A374",
    ribbon: "#6F4A32",
    secondary: "#C58A55",
  },
  Silver: {
    accent: "#B7C0CB",
    dark: "#5F6A76",
    light: "#EEF2F5",
    ribbon: "#515B66",
    secondary: "#D5DBE2",
  },
  Gold: {
    accent: "#C9A456",
    dark: "#6F5527",
    light: "#F2D88D",
    ribbon: "#705827",
    secondary: "#DDBE6B",
  },
  Platinum: {
    accent: "#B8C9D4",
    dark: "#536A7A",
    light: "#F0F6F8",
    ribbon: "#405B6C",
    secondary: "#D5E0E6",
  },
  Diamond: {
    accent: "#86C8D5",
    dark: "#2E6F82",
    light: "#E4F8FB",
    ribbon: "#265D73",
    secondary: "#A8DCE5",
  },
  Master: {
    accent: "#A63E49",
    dark: "#4C141B",
    light: "#E6A2AA",
    ribbon: "#2A080C",
    secondary: "#C4626C",
  },
};

export default function RankMedal({
  rank = "Bronze",
  size = "medium",
  showLabel = false,
  style,
}) {
  const { colors } = useTheme();
  const palette = rankMedalStyles[rank] || rankMedalStyles.Bronze;
  const dimensions = getDimensions(size);

  return (
    <View
      accessibilityLabel={`${rank} rank medal`}
      accessible
      style={[styles.wrap, style]}
    >
      <View style={[styles.ribbonWrap, { width: dimensions.medal }]}>
        <View
          style={[
            styles.ribbon,
            styles.ribbonLeft,
            {
              backgroundColor: palette.ribbon,
              height: dimensions.ribbonHeight,
              width: dimensions.ribbonWidth,
            },
          ]}
        />
        <View
          style={[
            styles.ribbon,
            styles.ribbonRight,
            {
              backgroundColor: palette.dark,
              height: dimensions.ribbonHeight,
              width: dimensions.ribbonWidth,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.medal,
          {
            backgroundColor: palette.accent,
            borderColor: palette.light,
            height: dimensions.medal,
            width: dimensions.medal,
          },
        ]}
      >
        <View
          style={[
            styles.medalInner,
            {
              backgroundColor: palette.secondary,
              borderColor: palette.dark,
              height: dimensions.inner,
              width: dimensions.inner,
            },
          ]}
        >
          <View
            style={[
              styles.emblem,
              {
                borderBottomColor: palette.light,
                borderLeftWidth: dimensions.emblem / 2,
                borderRightWidth: dimensions.emblem / 2,
                borderBottomWidth: dimensions.emblem,
              },
            ]}
          />
        </View>
      </View>

      {showLabel ? (
        <AppText
          align="center"
          color={colors.text}
          style={styles.label}
          variant="label"
        >
          {rank}
        </AppText>
      ) : null}
    </View>
  );
}

export function getRankMedalAccent(rank) {
  return rankMedalStyles[rank]?.accent || rankMedalStyles.Bronze.accent;
}

function getDimensions(size) {
  if (size === "mini") {
    return {
      emblem: 8,
      inner: 21,
      medal: 28,
      ribbonHeight: 14,
      ribbonWidth: 8,
    };
  }

  if (size === "large") {
    return {
      emblem: 24,
      inner: 68,
      medal: 88,
      ribbonHeight: 42,
      ribbonWidth: 24,
    };
  }

  if (size === "small") {
    return {
      emblem: 13,
      inner: 34,
      medal: 44,
      ribbonHeight: 22,
      ribbonWidth: 13,
    };
  }

  return {
    emblem: 18,
    inner: 48,
    medal: 62,
    ribbonHeight: 30,
    ribbonWidth: 18,
  };
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: v2Spacing.sm,
  },
  ribbonWrap: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: -10,
  },
  ribbon: {
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  ribbonLeft: {
    transform: [{ rotate: "13deg" }],
  },
  ribbonRight: {
    transform: [{ rotate: "-13deg" }],
  },
  medal: {
    alignItems: "center",
    borderRadius: v2Radius.pill,
    borderWidth: 2,
    justifyContent: "center",
  },
  medalInner: {
    alignItems: "center",
    borderRadius: v2Radius.pill,
    borderWidth: 1,
    justifyContent: "center",
  },
  emblem: {
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    height: 0,
    width: 0,
  },
  label: {
    fontWeight: v2FontWeight.bold,
    lineHeight: v2Typography.label.lineHeight,
  },
});
