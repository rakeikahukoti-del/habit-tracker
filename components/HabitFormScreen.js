import { createContext, useCallback, useContext, useRef } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import {
  v2Breakpoints,
  v2Layout,
  v2FontWeight,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { AppText } from "./ui";

// Extra breathing room (in px) kept between a focused field and the top of
// the keyboard when scrolling it into view - matches the field's own
// vertical padding so it doesn't land flush against the keyboard.
const SCROLL_INTO_VIEW_OFFSET = v2Spacing.base;

// Lets any descendant (HabitFormFields' TextInputs) ask the screen's own
// ScrollView to bring a focused field above the keyboard, without threading
// a ref through app/add.js and app/habit/[id].js - both already render
// their fields as children of this component, so a context reaches them
// directly. Default of a no-op keeps callers safe if ever used outside a
// HabitFormScreen (e.g. in isolation in a test).
export const ScrollIntoViewContext = createContext(() => {});

export function useScrollIntoView() {
  return useContext(ScrollIntoViewContext);
}

export default function HabitFormScreen({
  children,
  error,
  footer,
  header,
  topBar,
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < v2Breakpoints.smallScreenMaxWidth;
  const isTablet = width >= v2Breakpoints.tabletMinWidth;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
  const scrollViewRef = useRef(null);
  const scrollFieldIntoView = useCallback((nodeHandle) => {
    if (nodeHandle == null) {
      return;
    }

    scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(
      nodeHandle,
      SCROLL_INTO_VIEW_OFFSET,
      true
    );
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
          >
            <ScrollIntoViewContext.Provider value={scrollFieldIntoView}>
              {topBar ? <View style={styles.topBar}>{topBar}</View> : null}
              {header}
              {error ? (
                <AppText accessibilityRole="alert" style={styles.error}>
                  {error}
                </AppText>
              ) : null}
              {children}
            </ScrollIntoViewContext.Provider>
          </ScrollView>
        </TouchableWithoutFeedback>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function HabitFormHeader({ eyebrow, icon, subtitle, title }) {
  const { colors } = useTheme();
  const styles = createHeaderStyles(colors);

  if (icon) {
    return (
      <View style={styles.inlineHeader}>
        {icon}
        <View style={styles.headerText}>
          <AppText style={styles.eyebrow}>{eyebrow}</AppText>
          <AppText numberOfLines={2} style={styles.title}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText style={styles.subtitle}>{subtitle}</AppText>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.stackedHeader}>
      <AppText style={styles.eyebrow}>{eyebrow}</AppText>
      <AppText style={styles.title}>{title}</AppText>
      {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
    </View>
  );
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  const horizontalPadding = isSmallScreen
    ? v2Layout.screenPaddingCompact
    : v2Layout.screenPadding;

  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      flex: 1,
      justifyContent: "space-between",
    },
    scrollContent: {
      alignSelf: "center",
      maxWidth: isTablet ? v2Layout.formMaxWidth : "100%",
      padding: horizontalPadding,
      paddingBottom: v2Spacing.xxl,
      width: "100%",
    },
    topBar: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: v2Layout.minTapTarget,
      paddingTop: v2Spacing.xs,
    },
    error: {
      color: colors.danger,
      ...v2Typography.body,
      marginTop: v2Spacing.md,
    },
    footer: {
      alignSelf: "center",
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.md,
      maxWidth: isTablet ? v2Layout.formMaxWidth : "100%",
      paddingBottom: horizontalPadding,
      paddingHorizontal: horizontalPadding,
      paddingTop: v2Spacing.md,
      width: "100%",
    },
  });
}

function createHeaderStyles(colors) {
  return StyleSheet.create({
    stackedHeader: {
      marginBottom: v2Layout.sectionGap,
      paddingTop: v2Spacing.md,
    },
    inlineHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
      paddingTop: v2Spacing.md,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    eyebrow: {
      color: colors.primary,
      ...v2Typography.label,
      fontWeight: v2FontWeight.bold,
      marginBottom: v2Spacing.xs,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      ...v2Typography.screenTitle,
      fontWeight: v2FontWeight.bold,
    },
    subtitle: {
      color: colors.muted,
      ...v2Typography.body,
      marginTop: v2Spacing.sm,
    },
  });
}

export const habitFormSharedStyles = {
  actionButton: {
    alignItems: "center",
    borderRadius: v2Radius.medium,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingVertical: v2Spacing.base,
  },
};
