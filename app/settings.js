import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import BottomNav from "../components/BottomNav";
import {
  SettingsRow,
  SettingsSection,
} from "../components/settings";
import { MomentumWolfMark } from "../components/brand";
import { SHOW_DEMO_TOOLS } from "../constants/appConfig";
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
  getGamification,
  getGamificationLevelInfo,
} from "../storage/gamificationStorage";
import {
  exportHabitsBackup,
  importHabitsBackup,
  resetAllHabits,
  seedDemoHabits,
  seedMasterDemoHabits,
} from "../storage/habitsStorage";
import packageJson from "../package.json";

export default function SettingsScreen() {
  const { colors, resolvedTheme } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = useMemo(
    () => createStyles(colors, { isSmallScreen, isTablet }),
    [colors, isSmallScreen, isTablet]
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [backupText, setBackupText] = useState("");
  const [importText, setImportText] = useState("");
  const [level, setLevel] = useState(1);
  const [modalMode, setModalMode] = useState(null);
  const [message, setMessage] = useState("");
  const actionLoadingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadLevel() {
        try {
          const storedGamification = await getGamification();
          const levelInfo = getGamificationLevelInfo(storedGamification);

          if (isActive) {
            setLevel(levelInfo.level);
          }
        } catch {
          if (isActive) {
            setMessage("Could not load app progress.");
          }
        }
      }

      loadLevel();

      return () => {
        isActive = false;
      };
    }, [])
  );

  async function runDataAction(action, successMessage, failureMessage) {
    if (actionLoadingRef.current) {
      return;
    }

    actionLoadingRef.current = true;
    setActionLoading(true);

    try {
      setMessage("");
      await action();
      await refreshLevel();
      setMessage(successMessage);
    } catch {
      setMessage(failureMessage);
    } finally {
      actionLoadingRef.current = false;
      setActionLoading(false);
    }
  }

  function confirmLoadDemoData() {
    Alert.alert(
      "Load demo data?",
      "This replaces your current habits with sample habits for testing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load demo data",
          style: "destructive",
          onPress: () =>
            runDataAction(
              seedDemoHabits,
              "Demo data loaded.",
              "Could not load demo data. Please try again."
            ),
        },
      ]
    );
  }

  function confirmLoadMasterDemoData() {
    Alert.alert(
      "Load Master demo?",
      "This replaces your current habits with high-progress sample habits.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load Master demo",
          style: "destructive",
          onPress: () =>
            runDataAction(
              seedMasterDemoHabits,
              "Master demo data loaded.",
              "Could not load Master demo data. Please try again."
            ),
        },
      ]
    );
  }

  function confirmResetAllData() {
    Alert.alert(
      "Reset all data?",
      "This permanently removes habits, history, progress, badges, preferences, and scheduled reminders from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () =>
            runDataAction(
              resetAllHabits,
              "All local data reset.",
              "Could not reset data. Please try again."
            ),
        },
      ]
    );
  }

  async function handleExportData() {
    if (actionLoadingRef.current) {
      return;
    }

    actionLoadingRef.current = true;
    setActionLoading(true);

    try {
      setMessage("");
      const json = await exportHabitsBackup();

      setBackupText(json);
      setModalMode("export");
    } catch {
      setMessage("Could not export habit data. Please try again.");
    } finally {
      actionLoadingRef.current = false;
      setActionLoading(false);
    }
  }

  function confirmImportData() {
    Alert.alert(
      "Import backup?",
      "This replaces your current habits with the JSON backup.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Import", onPress: handleImportData },
      ]
    );
  }

  async function handleImportData() {
    if (actionLoadingRef.current) {
      return;
    }

    actionLoadingRef.current = true;
    setActionLoading(true);

    try {
      setMessage("");
      const importedHabits = await importHabitsBackup(importText);

      setModalMode(null);
      setImportText("");
      await refreshLevel();
      setMessage(`Imported ${importedHabits.length} habits.`);
    } catch {
      setMessage("Could not import that JSON backup. Check the text and try again.");
    } finally {
      actionLoadingRef.current = false;
      setActionLoading(false);
    }
  }

  async function refreshLevel() {
    const storedGamification = await getGamification();
    const levelInfo = getGamificationLevelInfo(storedGamification);

    setLevel(levelInfo.level);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MomentumWolfMark size={42} />
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Momentum</Text>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Preferences, data, and app information.
            </Text>
          </View>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <SettingsSection title="Habits">
          <SettingsRow
            description="Sorting, swipe, and reorder behavior."
            onPress={() => router.push("/habit-preferences")}
            title="Habit preferences"
          />
          <SettingsRow
            description="Drag habits into your preferred Home order."
            onPress={() => router.push("/reorder-habits")}
            title="Reorder habits"
          />
        </SettingsSection>

        <SettingsSection title="Experience">
          <SettingsRow
            description="Mode and unlocked rank themes."
            onPress={() => router.push("/appearance")}
            title="Appearance"
            value={formatThemeLabel(resolvedTheme)}
          />
          <SettingsRow
            description="Home progress, reward popups, and haptics."
            onPress={() => router.push("/gamification-preferences")}
            title="Gamification"
          />
          <SettingsRow
            description="Daily reminder preference."
            onPress={() => router.push("/notification-preferences")}
            title="Notifications"
          />
        </SettingsSection>

        <SettingsSection
          footer="Demo actions replace current habits. Export first if you want a backup."
          title="Data"
        >
          {SHOW_DEMO_TOOLS ? (
            <>
              <SettingsRow
                disabled={actionLoading}
                onPress={confirmLoadDemoData}
                title="Load demo data"
                value={actionLoading ? "Working" : undefined}
              />
              <SettingsRow
                description="Loads a high-progress sample profile."
                disabled={actionLoading}
                onPress={confirmLoadMasterDemoData}
                title="Load Master demo"
              />
            </>
          ) : null}
          <SettingsRow
            disabled={actionLoading}
            onPress={handleExportData}
            title="Export JSON"
          />
          <SettingsRow
            disabled={actionLoading}
            onPress={() => setModalMode("import")}
            title="Import JSON"
          />
          <SettingsRow
            destructive
            disabled={actionLoading}
            onPress={confirmResetAllData}
            showChevron={false}
            title="Reset all data"
          />
        </SettingsSection>

        <SettingsSection title="Legal">
          <SettingsRow
            onPress={() => router.push("/privacy")}
            title="Privacy Policy"
          />
          <SettingsRow onPress={() => router.push("/terms")} title="Terms of Use" />
          <SettingsRow
            onPress={() => router.push("/disclaimer")}
            title="Disclaimer"
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow showChevron={false} title="App version" value={packageJson.version} />
          <SettingsRow
            description="Personal habit tracking only. No account or backend."
            showChevron={false}
            title="App info"
            value={`Level ${level}`}
          />
        </SettingsSection>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setModalMode(null)}
        transparent
        visible={Boolean(modalMode)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalMode === "export" ? "Export JSON" : "Import JSON"}
            </Text>
            <Text style={styles.modalHelper}>
              {modalMode === "export"
                ? "Store this backup somewhere safe."
                : "Paste a Momentum JSON backup to replace current habits."}
            </Text>

            <TextInput
              multiline
              onChangeText={modalMode === "export" ? setBackupText : setImportText}
              placeholder="Paste JSON here"
              placeholderTextColor={colors.muted}
              scrollEnabled
              style={styles.jsonInput}
              value={modalMode === "export" ? backupText : importText}
            />

            <View style={styles.modalActions}>
              <Pressable
                accessibilityLabel="Close data dialog"
                accessibilityRole="button"
                onPress={() => setModalMode(null)}
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </Pressable>

              {modalMode === "import" ? (
                <Pressable
                  accessibilityLabel="Import JSON backup"
                  accessibilityRole="button"
                  disabled={actionLoading || !importText.trim()}
                  onPress={confirmImportData}
                  style={({ pressed }) => [
                    styles.modalPrimaryButton,
                    (actionLoading || !importText.trim()) && styles.disabledButton,
                    pressed &&
                      !actionLoading &&
                      importText.trim() &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.modalPrimaryText}>Import</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
      <BottomNav />
    </SafeAreaView>
  );
}

function formatThemeLabel(themeKey) {
  return String(themeKey || "dark")
    .charAt(0)
    .toUpperCase() + String(themeKey || "dark").slice(1);
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
      paddingBottom: layout.screenBottomPadding + 88,
      width: "100%",
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.xl,
      paddingTop: spacing.sm,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      marginBottom: 4,
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
      marginTop: spacing.xs,
    },
    message: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.sm,
      color: colors.text,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
      marginBottom: spacing.lg,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    modalBackdrop: {
      backgroundColor: colors.modalBackdrop,
      flex: 1,
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      borderWidth: 1,
      gap: 12,
      maxHeight: "82%",
      padding: 18,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 8,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: fontWeight.bold,
    },
    modalHelper: {
      color: colors.muted,
      fontSize: fontSize.label,
      lineHeight: 19,
    },
    jsonInput: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      color: colors.text,
      fontSize: 13,
      minHeight: 220,
      padding: 14,
      textAlignVertical: "top",
    },
    modalActions: {
      flexDirection: "row",
      gap: 10,
    },
    modalCancelButton: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 50,
    },
    modalCancelText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: fontWeight.bold,
    },
    modalPrimaryButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      flex: 1,
      justifyContent: "center",
      minHeight: 50,
    },
    modalPrimaryText: {
      color: colors.inverseText,
      fontSize: 15,
      fontWeight: fontWeight.bold,
    },
    disabledButton: {
      opacity: 0.55,
    },
    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
  });
}
