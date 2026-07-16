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
import { applyDailyReminderPreference } from "../storage/habitsStorage";

export default function NotificationPreferencesScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
  const [preferences, setPreferences] = useState(defaultAppPreferences);
  const [message, setMessage] = useState("");

  useFocusEffect(
    useCallback(() => {
      async function loadPreferences() {
        setPreferences(await getAppPreferences());
      }

      loadPreferences();
    }, [])
  );

  async function handleDailyReminderChange(value) {
    try {
      setMessage("");
      setPreferences((current) => ({
        ...current,
        enableDailyReminders: value,
      }));
      const savedPreferences = await setAppPreference(
        "enableDailyReminders",
        value
      );
      await applyDailyReminderPreference(value);
      setPreferences(savedPreferences);
    } catch {
      setMessage("Could not update reminders. Please try again.");
      setPreferences(await getAppPreferences());
    }
  }

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
          onPress={() => router.replace("/settings")}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.backButtonText}>← Settings</Text>
        </Pressable>

        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          Control local habit reminders. Momentum still works if reminders are off.
        </Text>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Daily reminders</Text>
              <Text style={styles.settingHelper}>
                Send reminders for habits with a reminder time.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Daily reminders"
              accessibilityRole="switch"
              accessibilityState={{
                checked: preferences.enableDailyReminders,
              }}
              ios_backgroundColor={colors.border}
              onValueChange={handleDailyReminderChange}
              thumbColor={
                preferences.enableDailyReminders ? colors.primary : colors.surface
              }
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              value={preferences.enableDailyReminders}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
      marginBottom: spacing.sm,
    },
    subtitle: {
      color: colors.muted,
      fontSize: fontSize.body,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.body,
      marginBottom: spacing.lg,
    },
    message: {
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.sm,
      color: colors.danger,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
      marginBottom: spacing.lg,
      padding: spacing.md,
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
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      minHeight: 58,
    },
    settingText: {
      flex: 1,
      minWidth: 0,
    },
    settingLabel: {
      color: colors.text,
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
    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
  });
}
