import { StyleSheet, View } from "react-native";
import {
  v2FontWeight,
  v2Radius,
  v2Typography,
} from "../../src/design";
import { useTheme } from "../../context/ThemeContext";
import { AppText } from "../ui";

const tierStyles = {
  Bronze: {
    border: "#8A6548",
    inner: "#2A211B",
    symbol: "#C09A77",
  },
  Silver: {
    border: "#A7ACB2",
    inner: "#1F242A",
    symbol: "#D2D5D8",
  },
  Gold: {
    border: "#A98A52",
    inner: "#2B2418",
    symbol: "#D3B36F",
  },
  Platinum: {
    border: "#C4CCD0",
    inner: "#19242D",
    symbol: "#E0E5E7",
  },
  Diamond: {
    border: "#BFD8DE",
    inner: "#142330",
    symbol: "#EEF5F6",
  },
  Master: {
    border: "#8E303A",
    inner: "#16090C",
    symbol: "#C75F69",
  },
};

const groupSymbols = {
  Consistency: "III",
  "Daily volume": "V",
  "Getting started": "I",
  Progress: "LV",
  Ranks: "R",
  "Total completions": "X",
};

export default function BadgeMedal({
  badge,
  earned = false,
  large = false,
  selected = false,
  style,
}) {
  const { colors } = useTheme();
  const tier = tierStyles[badge?.tier] || tierStyles.Bronze;
  const size = large ? 112 : 64;
  const symbol = earned ? groupSymbols[badge?.group] || "M" : "?";

  return (
    <View
      accessibilityLabel={`${badge?.label || "Badge"}, ${badge?.tier || "Bronze"} tier, ${earned ? "earned" : "locked"}`}
      accessible
      style={[
        styles.wrap,
        {
          borderColor: earned ? tier.border : colors.border,
          height: size,
          opacity: earned ? 1 : 0.54,
          width: size,
        },
        selected && styles.selected,
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: earned ? tier.inner : colors.surface,
            borderColor: earned ? tier.border : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.symbolPlate,
            {
              borderColor: earned ? tier.border : colors.border,
              height: large ? 58 : 34,
              width: large ? 58 : 34,
            },
          ]}
        >
          <AppText
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              styles.symbol,
              {
                color: earned ? tier.symbol : colors.muted,
                fontSize: large
                  ? v2Typography.sectionTitle.fontSize
                  : v2Typography.caption.fontSize,
              },
            ]}
          >
            {symbol}
          </AppText>
        </View>
      </View>
    </View>
  );
}

export function getBadgeTierAccent(tierName) {
  return tierStyles[tierName]?.border || tierStyles.Bronze.border;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    borderRadius: v2Radius.large,
    borderWidth: 1.5,
    justifyContent: "center",
    overflow: "hidden",
    transform: [{ rotate: "45deg" }],
  },
  selected: {
    borderWidth: 2,
  },
  inner: {
    alignItems: "center",
    borderRadius: v2Radius.medium,
    borderWidth: 1,
    height: "78%",
    justifyContent: "center",
    width: "78%",
  },
  symbolPlate: {
    alignItems: "center",
    borderRadius: v2Radius.small,
    borderWidth: 1,
    justifyContent: "center",
    transform: [{ rotate: "-45deg" }],
  },
  symbol: {
    fontWeight: v2FontWeight.bold,
    letterSpacing: 0.4,
    textAlign: "center",
  },
});
