import {
  SafeAreaView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  pageTitleLineHeight,
  pageTitleSize,
  radius,
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
        <Pressable
          accessibilityLabel="Back to Settings"
          accessibilityRole="button"
          hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
          onPress={goBackSafely}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Settings</Text>
        </Pressable>
        <Text style={styles.eyebrow}>Momentum</Text>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.card}>
          {body.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
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
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: spacing.lg,
    minHeight: layout.minTapTarget,
    paddingHorizontal: 14,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
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
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  paragraph: {
    color: colors.muted,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.regular,
    lineHeight: 23,
    marginBottom: spacing.lg,
  },
  });
}
