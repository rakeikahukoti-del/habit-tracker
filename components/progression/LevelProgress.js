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
  const currentLevelXp = Math.min(
    XP_PER_LEVEL,
    Math.max(0, levelInfo?.currentLevelXp || 0)
  );
  const level = Math.max(1, levelInfo?.level || 1);
  const nextLevelXp = Math.max(
    0,
    levelInfo?.nextLevelXp ?? XP_PER_LEVEL
  );
  const progress = (currentLevelXp / XP_PER_LEVEL) * 100;
  const xp = Math.max(0, levelInfo?.xp || 0);
  const rankLabel = rank ? `${rank} rank, ` : "";

  return (
    <View
      accessibilityLabel={`${rankLabel}level ${level}, ${xp} total XP, ${currentLevelXp} of ${XP_PER_LEVEL} XP toward level ${level + 1}. ${nextLevelXp} XP remaining.`}
      accessible
      style={[styles.wrap, compact && styles.wrapCompact]}
    >
      <View style={styles.top}>
        <View>
          <AppText style={[styles.label, { color: colors.text }]}>LEVEL {level}</AppText>
        </View>
        <AppText style={[styles.xp, { color: colors.text }]}>{xp} XP</AppText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
              width: `${progress}%`,
            },
          ]}
        />
      </View>
      <AppText style={[styles.helper, { color: colors.muted }]}>
        {nextLevelXp} XP to level {level + 1}
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
