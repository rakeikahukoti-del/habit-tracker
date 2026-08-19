import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import BadgeFrame from "./BadgeFrame";
import BadgeGroupGlyph from "./BadgeGroupGlyph";
import { v2Radius } from "../../src/design";
import { useTheme } from "../../context/ThemeContext";

// Single source of truth for tier color. Border is the one accent color a
// badge frame ever shows (BadgeFrame.js draws fill/linework in caller-
// supplied neutrals) - do not read tier color from anywhere else. Symbol
// is used only for the earned-tier foil sheen below, a soft low-alpha
// overlay, not a fill.
//
// Platinum corrected 2026-08 (Phase 8 badge/rank survey): was #C4CCD0
// (pale grey) here while the shipped rank-medal art and the shipped
// achievement-badge art both rendered it violet - two independent art
// passes agreeing with each other against this component's own
// programmed value. The art was right; corrected to match.
const tierStyles = {
  Bronze: {
    border: "#8A6548",
    symbol: "#C09A77",
  },
  Silver: {
    border: "#A7ACB2",
    symbol: "#D2D5D8",
  },
  Gold: {
    border: "#A98A52",
    symbol: "#D3B36F",
  },
  Platinum: {
    border: "#8B6FD9",
    symbol: "#D6CCF0",
  },
  Diamond: {
    border: "#BFD8DE",
    symbol: "#EEF5F6",
  },
  Master: {
    border: "#8E303A",
    symbol: "#C75F69",
  },
};

// tier.border above is tuned against the near-black dark-theme card
// (#1C1C1E). Some of those values don't survive the trip to the light
// theme's white card, and one doesn't survive the trip to the dark card
// well enough:
//  - Silver/Diamond (pale by design, for the dark card) drop to
//    ~1.5-2.3:1 against white - under WCAG 1.4.11's 3:1 floor for
//    meaningful graphical objects (this ring is how sighted/low-vision
//    users tell tiers apart at a glance; screen reader users already get
//    the tier from this component's accessibilityLabel below).
//  - Master's border is only 2.13:1 against the dark card as authored.
// Both fixes below darken/lighten along the same hue rather than picking a
// new color, so the tier stays recognizably the same color family.
//
// Re-tuned again in Phase 11 Thread E: the light-theme card fill itself
// moved (src/design/colors.js's v2LightColors.surface, #FFFFFF -> #CBCBCB
// - that pass darkened light-theme card because #FFFFFF was already the
// max possible luminance, so there was no lighter value left to raise its
// own contrast against the page background). Checked what that did to
// every tier ring here rather than assuming the existing Silver/Diamond
// fixes still held - they didn't, and two more tiers needed a fix that
// wasn't necessary before:
//  - Silver and Diamond's overrides above (already darkened once for the
//    old white card) needed a second pass - #899098/#5798A8 dropped to
//    1.99:1/2.00:1 against the new #CBCBCB card.
//  - Platinum and Gold, previously fine at 3.91:1/3.26:1 against white
//    with no override needed, dropped to 2.41:1/2.01:1 against the new
//    card and now need one.
// All four re-tuned the same way as the original fixes above - darken
// along the same hue, verified against the WCAG relative-luminance
// formula, landing just past 3:1 rather than exactly on it.
const tierBorderLightOverrides = {
  Diamond: "#447784",
  Gold: "#856C40",
  Platinum: "#7A5AD4",
  Silver: "#697179",
};
const tierBorderDarkOverrides = {
  Master: "#BC3F4D",
};

// Tiers that get a foil sheen overlay in addition to their tier.border ring.
const MATERIAL_TIERS = new Set(["Gold", "Platinum", "Diamond", "Master"]);

function getTierStyle(tierName, isDark) {
  const base = tierStyles[tierName] || tierStyles.Bronze;
  const overrides = isDark ? tierBorderDarkOverrides : tierBorderLightOverrides;
  const border = overrides[tierName];

  return border ? { ...base, border } : base;
}

export default function BadgeMedal({
  badge,
  decorative = false,
  earned = false,
  large = false,
  selected = false,
  style,
}) {
  const { colors, isDark } = useTheme();
  const tier = getTierStyle(badge?.tier, isDark);
  const size = large ? 112 : 64;
  const frameSize = Math.round(size * 0.9);
  const showSheen = earned && MATERIAL_TIERS.has(badge?.tier);
  const label = `${badge?.label || "Badge"}, ${badge?.tier || "Bronze"} tier, ${earned ? "earned" : "locked"}`;

  return (
    <View
      accessibilityLabel={decorative ? undefined : label}
      accessibilityRole={decorative ? undefined : "image"}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no" : "auto"}
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
      <View style={styles.frameBox}>
        <BadgeFrame
          accentColor={tier.border}
          fillColor={colors.surface}
          mutedColor={colors.border}
          size={frameSize}
          tier={badge?.tier}
        />
        {/* Neutral ink, not tier.border - the frame's ring is the single
            tier-color accent; the glyph signals group, a different axis,
            and stays out of that ring's way rather than competing with it. */}
        <View pointerEvents="none" style={styles.glyphSlot}>
          <BadgeGroupGlyph
            color={colors.text}
            group={badge?.group}
            size={Math.round(frameSize * 0.48)}
          />
        </View>
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
  frameBox: {
    alignItems: "center",
    height: "90%",
    justifyContent: "center",
    width: "90%",
  },
  glyphSlot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
