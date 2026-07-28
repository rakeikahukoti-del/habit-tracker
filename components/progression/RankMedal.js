import { StyleSheet, View } from "react-native";
import RankBadge from "../RankBadge";
import {
  v2FontWeight,
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
  locked = false,
  rank = "Bronze",
  size = "medium",
  showLabel = false,
  style,
}) {
  const { colors } = useTheme();
  const dimensions = getDimensions(size);

  return (
    <View
      accessibilityLabel={`${rank} rank medal`}
      accessibilityRole="image"
      accessible
      style={[styles.wrap, style]}
    >
      <RankBadge decorative locked={locked} rank={rank} size={dimensions.medal} />

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
      medal: 28,
    };
  }

  if (size === "large") {
    return {
      medal: 88,
    };
  }

  if (size === "small") {
    return {
      medal: 44,
    };
  }

  return {
    medal: 62,
  };
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: v2Spacing.sm,
  },
  label: {
    fontWeight: v2FontWeight.bold,
    lineHeight: v2Typography.label.lineHeight,
  },
});
