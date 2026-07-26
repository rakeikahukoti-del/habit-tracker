import { StyleSheet, View } from "react-native";
import { v2Colors, v2Layout, v2Spacing } from "../../src/design";
import AppText from "./AppText";
import IconButton from "./IconButton";

export default function AppHeader({
  backLabel = "Back",
  onBack,
  rightAction,
  subtitle,
  title,
}) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton accessibilityLabel={backLabel} onPress={onBack}>
            {"<"}
          </IconButton>
        ) : null}
      </View>

      <View style={styles.titleGroup}>
        <AppText align="center" numberOfLines={1} variant="screenTitle">
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            align="center"
            color={v2Colors.textSecondary}
            numberOfLines={2}
            style={styles.subtitle}
            variant="bodySupporting"
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>

      <View style={styles.side}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: v2Spacing.md,
    minHeight: 56,
    paddingBottom: v2Layout.headerGap,
  },
  side: {
    alignItems: "center",
    minWidth: 44,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    marginTop: v2Spacing.xs,
  },
});
