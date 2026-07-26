import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SettingsScreen } from "./settings";
import { AppText } from "./ui";
import { useTheme } from "../context/ThemeContext";
import {
  v2FontWeight,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";

export default function LegalScreen({ title, body }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SettingsScreen
      eyebrow="Legal"
      onBack={goBackSafely}
      subtitle="Simple terms for personal, offline habit tracking."
      title={title}
    >
      <View style={styles.document}>
        {body.map((paragraph, index) => (
          <View key={paragraph} style={styles.paragraphBlock}>
            <AppText style={styles.sectionNumber}>
              {String(index + 1).padStart(2, "0")}
            </AppText>
            <AppText style={styles.paragraph}>{paragraph}</AppText>
          </View>
        ))}
      </View>
    </SettingsScreen>
  );
}

function goBackSafely() {
  router.replace("/settings");
}

function createStyles(colors) {
  return StyleSheet.create({
    document: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      overflow: "hidden",
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.07,
    },
    paragraphBlock: {
      alignItems: "flex-start",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.md,
      paddingHorizontal: v2Spacing.lg,
      paddingVertical: v2Spacing.lg,
    },
    sectionNumber: {
      color: colors.softText,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.caption.lineHeight,
      minWidth: 24,
    },
    paragraph: {
      color: colors.muted,
      flex: 1,
      flexShrink: 1,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.regular,
      lineHeight: v2Typography.body.lineHeight,
      minWidth: 0,
    },
  });
}
