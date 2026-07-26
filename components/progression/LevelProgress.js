import { StyleSheet, Text, View } from "react-native";
import {
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  spacing,
} from "../../constants/typography";
import { useTheme } from "../../context/ThemeContext";
import { XP_PER_LEVEL } from "../../storage/gamificationStorage";

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
          <Text style={[styles.label, { color: colors.text }]}>LEVEL {levelInfo?.level || 1}</Text>
          {rank ? <Text style={[styles.rank, { color: colors.muted }]}>{rank}</Text> : null}
        </View>
        <Text style={[styles.xp, { color: colors.text }]}>{xp} XP</Text>
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
      <Text style={[styles.helper, { color: colors.muted }]}>
        {levelInfo?.nextLevelXp || XP_PER_LEVEL} XP to level {(levelInfo?.level || 1) + 1}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  wrapCompact: {
    gap: spacing.sm,
  },
  top: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6,
  },
  rank: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    marginTop: 3,
  },
  xp: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  track: {
    borderRadius: radius.round,
    height: 7,
    overflow: "hidden",
  },
  fill: {
    borderRadius: radius.round,
    height: "100%",
  },
  helper: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.caption,
  },
});
