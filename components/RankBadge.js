import { Image, StyleSheet, View } from "react-native";
import { RANK_BADGE_ASSETS, getRankBadgeAsset } from "../constants/assets";

const HIGHEST_RANK = "master";

export default function RankBadge({
  accessibilityLabel,
  decorative = false,
  locked = false,
  rank = "Bronze",
  size = 64,
  style,
}) {
  const normalizedRank = normalizeRank(rank);
  const source = getRankBadgeAsset(normalizedRank);
  const label =
    accessibilityLabel ||
    `${formatRankLabel(normalizedRank)} rank${normalizedRank === HIGHEST_RANK ? ", highest rank" : ""}${locked ? ", locked" : ""}`;

  return (
    <View
      accessibilityLabel={decorative ? undefined : label}
      accessibilityRole={decorative ? undefined : "image"}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no" : "auto"}
      style={[styles.wrap, { height: size, width: size }, style]}
    >
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={source || RANK_BADGE_ASSETS.bronze}
        style={[
          styles.image,
          locked && styles.locked,
        ]}
      />
      {locked ? <View pointerEvents="none" style={styles.lockOverlay} /> : null}
    </View>
  );
}

function normalizeRank(rank) {
  return typeof rank === "string" ? rank.trim().toLowerCase() : "bronze";
}

function formatRankLabel(rank) {
  if (!rank) {
    return "Bronze";
  }

  return rank.charAt(0).toUpperCase() + rank.slice(1);
}

const styles = StyleSheet.create({
  image: {
    height: "100%",
    width: "100%",
  },
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
