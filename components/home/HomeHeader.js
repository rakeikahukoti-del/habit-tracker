import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { MomentumWolfMark } from "../brand";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Typography } from "../../src/design";

export default function HomeHeader({ isSmallScreen }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen }),
    [colors, isSmallScreen]
  );

  return (
    <View style={styles.todayHeader}>
      <View>
        <AppText style={styles.todayTitle}>Momentum</AppText>
        <AppText style={styles.todayDate}>{formatTodayDate()}</AppText>
      </View>
      <MomentumWolfMark decorative size={34} />
    </View>
  );
}

function formatTodayDate() {
  return new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

function createStyles(colors, { isSmallScreen }) {
  return StyleSheet.create({
    todayHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingBottom: 12,
      paddingTop: isSmallScreen ? 6 : 10,
    },
    todayTitle: {
      color: colors.text,
      fontSize: isSmallScreen ? 24 : 28,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 29 : 34,
    },
    todayDate: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.medium,
      marginTop: 3,
    },
  });
}
