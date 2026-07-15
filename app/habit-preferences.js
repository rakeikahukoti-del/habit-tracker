import { useCallback, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
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
import {
  defaultAppPreferences,
  getAppPreferences,
  setAppPreference,
} from "../storage/appPreferences";

export default function HabitPreferencesScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
  const [preferences, setPreferences] = useState(defaultAppPreferences);

  useFocusEffect(
    useCallback(() => {
      async function loadPreferences() {
        setPreferences(await getAppPreferences());
      }

      loadPreferences();
    }, [])
  );

  async function handlePreferenceChange(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }));
    const savedPreferences = await setAppPreference(key, value);

    setPreferences(savedPreferences);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <BackButton styles={styles} />
        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Habits</Text>

        <View style={styles.section}>
          <Pressable
            accessibilityLabel="Open reorder habits"
            accessibilityRole="button"
            onPress={() => router.push("/reorder-habits")}
            style={({ pressed }) => [
              styles.navigationRow,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={styles.navigationText}>
              <Text style={styles.settingLabel}>Reorder habits</Text>
              <Text style={styles.settingHelper}>
                Change the order on Home.
              </Text>
            </View>
            <Text style={styles.navigationArrow}>›</Text>
          </Pressable>
          <PreferenceSwitch
            colors={colors}
            label="Completed habits last"
            onValueChange={(value) =>
              handlePreferenceChange("moveCompletedToBottom", value)
            }
            styles={styles}
            value={preferences.moveCompletedToBottom}
          />
          <PreferenceSwitch
            colors={colors}
            label="Swipe to complete"
            onValueChange={(value) =>
              handlePreferenceChange("enableSwipeToComplete", value)
            }
            styles={styles}
            value={preferences.enableSwipeToComplete}
          />
          <PreferenceSwitch
            colors={colors}
            label="Long-press reorder"
            onValueChange={(value) =>
              handlePreferenceChange("enableLongPressReorder", value)
            }
            styles={styles}
            value={preferences.enableLongPressReorder}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BackButton({ styles }) {
  return (
    <Pressable
      accessibilityLabel="Back to Settings"
      accessibilityRole="button"
      hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
      onPress={() => router.replace("/settings")}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={styles.backButtonText}>← Settings</Text>
    </Pressable>
  );
}

function PreferenceSwitch({ colors, label, onValueChange, styles, value }) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        ios_backgroundColor={colors.border}
        onValueChange={onValueChange}
        thumbColor={value ? colors.primary : colors.surface}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        value={value}
      />
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
      maxWidth: isTablet ? layout.formMaxWidth : "100%",
      padding: isSmallScreen ? layout.screenPaddingSmall : layout.screenPadding,
      paddingBottom: layout.screenBottomPadding,
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
    section: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xl,
      borderWidth: 1,
      padding: spacing.lg,
    },
    switchRow: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      minHeight: 54,
      paddingVertical: 10,
    },
    settingLabel: {
      color: colors.text,
      flex: 1,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.bold,
    },
    settingHelper: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.caption,
      marginTop: spacing.xs,
    },
    navigationRow: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      minHeight: 58,
      paddingVertical: 10,
    },
    navigationText: {
      flex: 1,
      minWidth: 0,
    },
    navigationArrow: {
      color: colors.primary,
      fontSize: 22,
      fontWeight: fontWeight.bold,
    },
    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
    rowPressed: {
      opacity: 0.78,
    },
  });
}
