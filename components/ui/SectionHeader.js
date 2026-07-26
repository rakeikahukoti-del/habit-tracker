import { StyleSheet, View } from "react-native";
import { v2Colors, v2Spacing } from "../../src/design";
import AppText from "./AppText";

export default function SectionHeader({ action, subtitle, title }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textGroup}>
        <AppText variant="sectionTitle">{title}</AppText>
        {subtitle ? (
          <AppText color={v2Colors.textSecondary} variant="bodySupporting">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: v2Spacing.base,
    justifyContent: "space-between",
    width: "100%",
  },
  textGroup: {
    flex: 1,
    gap: v2Spacing.xs,
    minWidth: 0,
  },
  action: {
    flexShrink: 0,
  },
});
