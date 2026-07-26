import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  SettingsMessage,
  SettingsRow,
  SettingsScreen as SettingsShell,
  SettingsSection,
} from "../components/settings";
import { AppText } from "../components/ui";
import { SHOW_DEMO_TOOLS } from "../constants/appConfig";
import {
  v2FontWeight,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";
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
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      "This permanently removes habits, history, progress, badges, and scheduled reminders from this device. Preferences stay unchanged.",
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
    <SettingsShell
      bottomNav
      eyebrow="Momentum"
      subtitle="Preferences, data, and app information."
      title="Settings"
    >
      <SettingsMessage>{message}</SettingsMessage>

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

      <Modal
        animationType="slide"
        onRequestClose={() => setModalMode(null)}
        transparent
        visible={Boolean(modalMode)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <AppText style={styles.modalTitle}>
              {modalMode === "export" ? "Export JSON" : "Import JSON"}
            </AppText>
            <AppText style={styles.modalHelper}>
              {modalMode === "export"
                ? "Store this backup somewhere safe."
                : "Paste a Momentum JSON backup to replace current habits."}
            </AppText>

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
                <AppText style={styles.modalCancelText}>Close</AppText>
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
                  <AppText style={styles.modalPrimaryText}>Import</AppText>
                </Pressable>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SettingsShell>
  );
}

function formatThemeLabel(themeKey) {
  return String(themeKey || "dark")
    .charAt(0)
    .toUpperCase() + String(themeKey || "dark").slice(1);
}

function createStyles(colors) {
  return StyleSheet.create({
    modalBackdrop: {
      backgroundColor: colors.modalBackdrop,
      flex: 1,
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderTopLeftRadius: v2Radius.large,
      borderTopRightRadius: v2Radius.large,
      borderWidth: 1,
      gap: v2Spacing.md,
      maxHeight: "82%",
      padding: v2Spacing.lg,
      ...v2Shadows.floating,
      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
    },
    modalTitle: {
      color: colors.text,
      fontSize: v2Typography.sectionTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.sectionTitle.lineHeight,
    },
    modalHelper: {
      color: colors.muted,
      fontSize: v2Typography.label.fontSize,
      lineHeight: v2Typography.label.lineHeight,
    },
    jsonInput: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      minHeight: 220,
      padding: v2Spacing.md,
      textAlignVertical: "top",
    },
    modalActions: {
      flexDirection: "row",
      gap: v2Spacing.md,
    },
    modalCancelButton: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 50,
    },
    modalCancelText: {
      color: colors.text,
      fontSize: v2Typography.button.fontSize,
      fontWeight: v2FontWeight.bold,
    },
    modalPrimaryButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: v2Radius.large,
      flex: 1,
      justifyContent: "center",
      minHeight: 50,
    },
    modalPrimaryText: {
      color: colors.inverseText,
      fontSize: v2Typography.button.fontSize,
      fontWeight: v2FontWeight.bold,
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
