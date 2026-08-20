import { StyleSheet, View } from "react-native";
import RankMedalFrame from "./rank/RankMedalFrame";
import { badgeTierColors } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";

const HIGHEST_RANK = "Master";
const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"];

// Border overrides for the tiers whose badgeTierColors.border doesn't clear
// WCAG 1.4.11's 3:1 floor against every real background a rank medal sits
// on once the theme flips (Phase 9 rank-medal conversion). Same fix shape
// as BadgeMedal.js's tierBorderLightOverrides/tierBorderDarkOverrides:
// darken/lighten along the same hue rather than picking a new color, so
// the tier stays recognizably the same color family.
//
// Reference backgrounds, the tightest real case per theme (not just the
// card): light theme's #F6F6F6 screen background (RankHero and
// DailyProgressionPanel's "mini" instances sit directly on it, and it was
// tighter than the white card every other light-theme surface used - see
// the Phase 11 Thread E note below for why that's no longer true); dark
// theme's #1C1C1E card, the same reference BadgeMedal.js uses.
//
//  - Silver/Gold/Platinum/Diamond (pale-to-mid by design, tuned for the
//    dark background) drop under 3:1 against the light background as
//    authored.
//  - Master's border is tuned for light and drops under 3:1 against the
//    dark card, the same shape as BadgeMedal.js's Master issue.
//  - Bronze needs no override: clears 3:1 against both themes as authored.
//
// Re-tuned again in Phase 11 Thread E, same root cause and same discovery
// process as BadgeMedal.js's matching note: the light-theme card fill
// moved (#FFFFFF -> #CBCBCB), which flips which reference is actually
// tightest - card is now darker than the #F6F6F6 background it used to be
// lighter than, so it's the binding constraint here now, not background.
// Checked all six tiers against the new card rather than assuming the
// background-tuned values still covered it - they didn't: every tier
// except Master (already comfortably clear at 4.63:1) dropped to
// 2.2-2.3:1 against the new card, including Bronze, which had never
// needed an override before. All five re-tuned the same way as the
// existing fixes above - darken along the same hue, verified against both
// the new card and the still-unchanged background (both stay well clear
// of 3:1 at the new values).
const tierBorderLightOverrides = {
  Bronze: "#916742",
  Diamond: "#337985",
  Gold: "#856D34",
  Platinum: "#457592",
  Silver: "#637186",
};
const tierBorderDarkOverrides = {
  Master: "#C1434E",
};

function getTierColor(tierName, isDark) {
  const base = badgeTierColors[tierName] || badgeTierColors.Bronze;
  const overrides = isDark ? tierBorderDarkOverrides : tierBorderLightOverrides;
  const border = overrides[tierName];

  return border ? { ...base, border } : base;
}

export default function RankBadge({
  accessibilityLabel,
  decorative = false,
  locked = false,
  rank = "Bronze",
  size = 64,
  style,
}) {
  const { colors, isDark } = useTheme();
  const tierName = normalizeTier(rank);
  const tier = getTierColor(tierName, isDark);
  const label =
    accessibilityLabel ||
    `${tierName} rank${tierName === HIGHEST_RANK ? ", highest rank" : ""}${locked ? ", locked" : ""}`;

  return (
    <View
      accessibilityLabel={decorative ? undefined : label}
      accessibilityRole={decorative ? undefined : "image"}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no" : "auto"}
      style={[styles.wrap, { height: size, width: size }, style]}
    >
      <RankMedalFrame
        accentColor={tier.border}
        fillColor={colors.surface}
        mutedColor={colors.border}
        size={size}
        style={locked ? styles.locked : undefined}
        tier={tierName}
      />
      {locked ? <View pointerEvents="none" style={styles.lockOverlay} /> : null}
    </View>
  );
}

function normalizeTier(rank) {
  if (typeof rank !== "string") {
    return "Bronze";
  }

  const trimmed = rank.trim().toLowerCase();
  const match = TIERS.find((tierName) => tierName.toLowerCase() === trimmed);

  return match || "Bronze";
}

const styles = StyleSheet.create({
  locked: {
    opacity: 0.42,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 17, 21, 0.18)",
  },
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
