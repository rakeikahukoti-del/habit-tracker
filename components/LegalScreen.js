import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { BackIcon, IconButton } from "./ui";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  pageTitleLineHeight,
  pageTitleSize,
  spacing,
} from "../constants/typography";
import { useTheme } from "../context/ThemeContext";

export default function LegalScreen({ title, body }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <IconButton
          accessibilityLabel="Back to Settings"
          onPress={goBackSafely}
          style={styles.backButton}
        >
          <BackIcon />
        </IconButton>
        <Text style={styles.eyebrow}>Legal</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Simple terms for personal, offline habit tracking.
        </Text>

        <View style={styles.document}>
          {body.map((paragraph, index) => (
            <View key={paragraph} style={styles.paragraphBlock}>
              <Text style={styles.sectionNumber}>{String(index + 1).padStart(2, "0")}</Text>
              <Text style={styles.paragraph}>{paragraph}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function goBackSafely() {
  router.replace("/settings");
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    alignSelf: "center",
    maxWidth: isTablet ? layout.formMaxWidth : "100%",
    padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
    paddingBottom: 34,
    width: "100%",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: pageTitleSize(isSmallScreen),
    fontWeight: fontWeight.bold,
    lineHeight: pageTitleLineHeight(isSmallScreen),
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  document: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  paragraphBlock: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  sectionNumber: {
    color: colors.softText,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.caption,
    minWidth: 24,
  },
  paragraph: {
    color: colors.muted,
    flex: 1,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.regular,
    lineHeight: 24,
  },
  });
}
