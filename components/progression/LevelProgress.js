import { StyleSheet, View } from "react-native";
import {
  v2FontWeight,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../../src/design";
import { useTheme } from "../../context/ThemeContext";
import { XP_PER_LEVEL } from "../../storage/gamificationStorage";
import { AppText } from "../ui";

export default function LevelProgress({ levelInfo, rank, compact = false }) {
  const { colors } = useTheme();
  const progress = ((levelInfo?.currentLevelXp || 0) / XP_PER_LEVEL) * 100;
  const xp = levelInfo?.xp || 0;

  return (
    <View
      accessibilityLabel={`Level ${levelInfo?.level || 1}, ${xp} XP, ${Math.round(progress)}% to next level`}
      accessible
      style={[styles.wrap, compact && styles.wrapCompact]}
    >
      <View style={styles.top}>
        <View>
          <AppText style={[styles.label, { color: colors.text }]}>LEVEL {levelInfo?.level || 1}</AppText>
          {rank ? <AppText style={[styles.rank, { color: colors.muted }]}>{rank}</AppText> : null}
        </View>
        <AppText style={[styles.xp, { color: colors.text }]}>{xp} XP</AppText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.text,
              width: `${progress}%`,
            },
          ]}
        />
      </View>
      <AppText style={[styles.helper, { color: colors.muted }]}>
        {levelInfo?.nextLevelXp || XP_PER_LEVEL} XP to level {(levelInfo?.level || 1) + 1}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: v2Spacing.md,
  },
  wrapCompact: {
    gap: v2Spacing.sm,
  },
  top: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: v2Typography.label.fontSize,
    fontWeight: v2FontWeight.bold,
    letterSpacing: 0.6,
  },
  rank: {
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.medium,
    marginTop: 3,
  },
  xp: {
    fontSize: v2Typography.body.fontSize,
    fontWeight: v2FontWeight.bold,
  },
  track: {
    borderRadius: v2Radius.pill,
    height: 7,
    overflow: "hidden",
  },
  fill: {
    borderRadius: v2Radius.pill,
    height: "100%",
  },
  helper: {
    fontSize: v2Typography.caption.fontSize,
    fontWeight: v2FontWeight.medium,
    lineHeight: v2Typography.caption.lineHeight,
  },
});
