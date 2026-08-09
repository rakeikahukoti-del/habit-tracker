import { Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getAchievementBadgeAsset } from "../../constants/assets";
import { v2Radius } from "../../src/design";
import { useTheme } from "../../context/ThemeContext";

// Single source of truth for tier color. Badge art (assets/achievements/*.png)
// bakes in its own accent color per asset and is not guaranteed to agree with
// a badge's actual `tier` (see utils/gamification.js) — do not read color from
// the art. `image` is inset within `wrap` so the art's own border never sits
// flush against this ring.
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

// tier.border above is tuned against the near-black dark-theme card
// (#1C1C1E). Two of those values don't survive the trip to the light
// theme's white card, and one doesn't survive the trip to the dark card
// well enough:
//  - Silver/Platinum/Diamond (pale by design, for the dark card) drop to
//    ~1.5-2.3:1 against white - under WCAG 1.4.11's 3:1 floor for
//    meaningful graphical objects (this ring is how sighted/low-vision
//    users tell tiers apart at a glance; screen reader users already get
//    the tier from this component's accessibilityLabel below).
//  - Master's border is only 2.13:1 against the dark card as authored.
// Both fixes below darken/lighten along the same hue rather than picking a
// new color, so the tier stays recognizably the same color family.
const tierBorderLightOverrides = {
  Silver: "#899098",
  Platinum: "#80919A",
  Diamond: "#5798A8",
};
const tierBorderDarkOverrides = {
  Master: "#BC3F4D",
};

function getTierStyle(tierName, isDark) {
  const base = tierStyles[tierName] || tierStyles.Bronze;
  const overrides = isDark ? tierBorderDarkOverrides : tierBorderLightOverrides;
  const border = overrides[tierName];

  return border ? { ...base, border } : base;
}

// Tiers that get a foil sheen overlay in addition to their tier.border ring.
const MATERIAL_TIERS = new Set(["Gold", "Platinum", "Diamond", "Master"]);

export default function BadgeMedal({
  badge,
  earned = false,
  large = false,
  selected = false,
  style,
}) {
  const { colors, isDark } = useTheme();
  const tier = getTierStyle(badge?.tier, isDark);
  const size = large ? 112 : 64;
  const asset = getAchievementBadgeAsset(badge?.id);
  const showSheen = earned && MATERIAL_TIERS.has(badge?.tier);

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
      {asset ? (
        <View style={styles.artBox}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={asset}
            style={styles.image}
          />
          {showSheen ? (
            <LinearGradient
              colors={[withAlpha(tier.symbol, 0.4), withAlpha(tier.symbol, 0)]}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
              start={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          ) : null}
        </View>
      ) : (
        <View
          style={[
            styles.fallback,
            {
              backgroundColor: earned ? tier.inner : colors.surface,
              borderColor: earned ? tier.border : colors.border,
            },
          ]}
        />
      )}
    </View>
  );
}

export function getBadgeTierAccent(tierName, isDark) {
  return getTierStyle(tierName, isDark).border;
}

function withAlpha(hex, alpha) {
  const sanitized = hex.replace("#", "");
  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    borderRadius: v2Radius.large,
    borderWidth: 1.5,
    justifyContent: "center",
    overflow: "hidden",
  },
  selected: {
    borderWidth: 2,
  },
  artBox: {
    borderRadius: v2Radius.medium,
    height: "90%",
    overflow: "hidden",
    width: "90%",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  fallback: {
    alignItems: "center",
    borderRadius: v2Radius.medium,
    borderWidth: 1,
    height: "78%",
    justifyContent: "center",
    width: "78%",
  },
});
