import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../../src/design";
import { PRESSED_STATS_STYLE } from "../home/pressedStyles";

export default function PeriodControl({ period, periods, setPeriod }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View accessibilityRole="tablist" style={styles.periodControl}>
      {periods.map((item) => {
        const selected = period === item.key;

        return (
          <Pressable
            accessibilityLabel={`${item.label} period`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={item.key}
            onPress={() => setPeriod(item.key)}
            style={({ pressed }) => [
              styles.periodItem,
              selected && styles.periodItemSelected,
              pressed && PRESSED_STATS_STYLE,
            ]}
          >
            <AppText
              style={[
                styles.periodLabel,
                selected && styles.periodLabelSelected,
              ]}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    periodControl: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.xs,
      marginBottom: v2Spacing.lg,
      padding: v2Spacing.xs,
    },
    periodItem: {
      alignItems: "center",
      borderRadius: v2Radius.medium,
      flex: 1,
      minHeight: 44,
      justifyContent: "center",
    },
    periodItemSelected: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    periodLabel: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    periodLabelSelected: {
      color: colors.text,
    },
  });
}
