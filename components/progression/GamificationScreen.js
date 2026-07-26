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

export default function GamificationScreen({ children, overlay }) {
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
        {children}
      </ScrollView>
      {overlay}
      <BottomNav />
    </SafeAreaView>
  );
}

export function GamificationHeader({ subtitle, title }) {
  const { colors } = useTheme();
  const styles = createHeaderStyles(colors);

  return (
    <View style={styles.header}>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.subtitle}>{subtitle}</AppText>
    </View>
  );
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? v2Layout.maxContentWidth : "100%",
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
      paddingBottom: v2Spacing.xl,
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
