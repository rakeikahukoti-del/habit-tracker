import { StyleSheet, View } from "react-native";
import RankBadge from "../RankBadge";
import {
  v2FontWeight,
  v2Spacing,
  v2Typography,
} from "../../src/design";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../ui";

export default function RankMedal({
  decorative = false,
  labelColor,
  locked = false,
  rank = "Bronze",
  size = "medium",
  showLabel = false,
  style,
}) {
  const { colors } = useTheme();
  const dimensions = getDimensions(size);
  const label = `${rank} rank medal${locked ? ", locked" : ""}`;

  return (
    <View
      accessibilityLabel={decorative ? undefined : label}
      accessibilityRole={decorative ? undefined : "image"}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no" : "auto"}
      style={[styles.wrap, style]}
    >
      <RankBadge decorative locked={locked} rank={rank} size={dimensions.medal} />

      {showLabel ? (
        <AppText
          align="center"
          color={labelColor || colors.text}
          numberOfLines={1}
          style={styles.label}
          variant="label"
        >
          {rank}
        </AppText>
      ) : null}
    </View>
  );
}

function getDimensions(size) {
  if (size === "mini") {
    return {
      medal: 28,
    };
  }

  // Rank path trail (components/rank/RankPath.js, Phase 8) - between
  // "mini" (Home's collapsed header) and "small", sized for five medals
  // to sit comfortably in a row on phone width.
  if (size === "trail") {
    return {
      medal: 40,
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
