import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SettingsScreen } from "./settings";
import { AppText } from "./ui";
import { useTheme } from "../context/ThemeContext";
import { v2FontWeight, v2Radius, v2Spacing, v2Typography } from "../src/design";

export default function LegalScreen({ title, body }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      borderRadius: v2Radius.large,
      overflow: "hidden",
    },
    paragraphBlock: {
      alignItems: "flex-start",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "column",
      gap: v2Spacing.sm,
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
      color: colors.text,
      flex: 1,
      flexShrink: 1,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.regular,
      lineHeight: v2Typography.body.lineHeight,
      minWidth: 0,
    },
  });
}
