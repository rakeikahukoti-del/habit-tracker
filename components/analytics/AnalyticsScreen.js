import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import BottomNav from "../BottomNav";
import { useTheme } from "../../context/ThemeContext";
import {
  v2FontWeight,
  v2Layout,
  v2Spacing,
  v2Typography,
} from "../../src/design";
import { AppText } from "../ui";

export default function AnalyticsScreen({
  bottomNav = false,
  children,
  maxWidth = v2Layout.maxContentWidth,
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet, maxWidth });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {bottomNav ? <BottomNav /> : null}
    </SafeAreaView>
  );
}

export function AnalyticsHeader({ subtitle, title }) {
  const { colors } = useTheme();
  const styles = createHeaderStyles(colors);

  return (
    <View style={styles.header}>
      <AppText style={styles.title}>{title}</AppText>
      {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
    </View>
  );
}

function createStyles(colors, { isSmallScreen, isTablet, maxWidth }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? maxWidth : "100%",
      padding: isSmallScreen
        ? v2Layout.screenPaddingCompact
        : v2Layout.screenPadding,
      paddingBottom: v2Layout.bottomNavigationClearance,
      width: "100%",
    },
  });
}

function createHeaderStyles(colors) {
  return StyleSheet.create({
    header: {
      paddingBottom: v2Spacing.lg,
      paddingTop: v2Spacing.md,
    },
    title: {
      color: colors.text,
      ...v2Typography.screenTitle,
      fontWeight: v2FontWeight.bold,
    },
    subtitle: {
      color: colors.muted,
      ...v2Typography.body,
      marginTop: v2Spacing.xs,
    },
  });
}
