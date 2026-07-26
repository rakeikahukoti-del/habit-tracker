import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { v2Layout } from "../../src/design";

export default function ScreenContainer({
  avoidKeyboard = false,
  bottomInset = true,
  children,
  contentStyle,
  scroll = false,
  style,
}) {
  const { colors } = useTheme();
  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? {
        contentContainerStyle: [
          styles.content,
          bottomInset && styles.bottomInset,
          contentStyle,
        ],
        keyboardShouldPersistTaps: "handled",
        showsVerticalScrollIndicator: false,
      }
    : {
        style: [
          styles.content,
          styles.flex,
          bottomInset && styles.bottomInset,
          contentStyle,
        ],
      };
  const screen = (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }, style]}>
      <Body {...bodyProps}>{children}</Body>
    </SafeAreaView>
  );

  if (!avoidKeyboard) {
    return screen;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      {screen}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: v2Layout.screenPadding,
    paddingTop: v2Layout.headerGap,
  },
  bottomInset: {
    paddingBottom: v2Layout.bottomNavigationClearance,
  },
});
