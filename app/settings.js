import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
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
  exportAppData,
  BACKUP_VERSION,
  getBackupPreview,
  getBackupValidationSummary,
  getImportConfirmationCopy,
  importAppData,
} from "../storage/appBackup";
import {
  resetAppPreferences,
  resetOnboarding,
} from "../storage/appPreferences";
import {
  getGamification,
  getGamificationLevelInfo,
} from "../storage/gamificationStorage";
import {
  resetAllHabits,
  seedDemoHabits,
  seedMasterDemoHabits,
} from "../storage/habitsStorage";
import { getSupportedWidgetSizes } from "../widgets/widgetDataProvider";
import packageJson from "../package.json";

export default function SettingsScreen() {
  const { colors, resolvedTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [actionLoading, setActionLoading] = useState(false);
  const [backupText, setBackupText] = useState("");
  const [exportMetadata, setExportMetadata] = useState(null);
  const [importText, setImportText] = useState("");
  const [level, setLevel] = useState(1);
  const [modalMode, setModalMode] = useState(null);
  const [message, setMessage] = useState("");
  const actionLoadingRef = useRef(false);
  const importValidation = useMemo(
    () => (importText.trim() ? getBackupPreview(importText) : null),
    [importText]
  );
  const importSummary = useMemo(
    () => getBackupValidationSummary(importValidation),
    [importValidation]
  );
  const widgetSizeLabel = useMemo(
    () => getSupportedWidgetSizes().map((size) => size.label).join(", "),
    []
  );

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

  function confirmResetOnboarding() {
    Alert.alert(
      "Reset onboarding?",
      "Momentum will show onboarding again the next time the app starts.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset onboarding",
          style: "destructive",
          onPress: () =>
            runDataAction(
              resetOnboarding,
              "Onboarding reset.",
              "Could not reset onboarding. Please try again."
            ),
        },
      ]
    );
  }

  function confirmResetPreferences() {
    Alert.alert(
      "Reset preferences?",
      "This restores app preferences to their defaults. Habits and progress stay intact.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset preferences",
          style: "destructive",
          onPress: () =>
            runDataAction(
              resetAppPreferences,
              "Preferences reset.",
              "Could not reset preferences. Please try again."
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
      const json = await exportAppData();
      const validation = getBackupPreview(json);

      setBackupText(json);
      setExportMetadata(validation.metadata);
      setModalMode("export");
      setMessage("Export ready. Store this backup somewhere safe.");
    } catch {
      setMessage("Could not export app data. Please try again.");
    } finally {
      actionLoadingRef.current = false;
      setActionLoading(false);
    }
  }

  function confirmImportData() {
    const copy = getImportConfirmationCopy(importValidation);

    Alert.alert(
      copy.title,
      copy.message,
      [
        { text: "Cancel", style: "cancel" },
        { text: copy.confirmLabel, style: "destructive", onPress: handleImportData },
      ]
    );
  }

  async function handleShareBackup() {
    if (!backupText) {
      return;
    }

    try {
      await Share.share({
        message: backupText,
        title: "Momentum backup",
      });
    } catch {
      setMessage("Could not open sharing. The JSON backup is still available here.");
    }
  }

  async function handleImportData() {
    if (actionLoadingRef.current) {
      return;
    }

    actionLoadingRef.current = true;
    setActionLoading(true);

    try {
      setMessage("");
      const result = await importAppData(importText);

      setModalMode(null);
      setImportText("");
      await refreshLevel();
      setMessage(
        getRestoreSuccessMessage(result)
      );
    } catch (error) {
      setMessage(error?.message || "Could not import that JSON backup.");
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

      <SettingsSection title="General">
        <SettingsRow
          description="Choose Light or Dark mode."
          icon="settings"
          onPress={() => router.push("/appearance")}
          title="Appearance"
          value={formatThemeLabel(resolvedTheme)}
        />
        <SettingsRow
          description="Reminder access and daily reminder preference."
          icon="flame"
          onPress={() => router.push("/notification-preferences")}
          title="Notifications"
        />
        <SettingsRow
          description="Sorting, swipe, and reorder behavior."
          icon="settings"
          onPress={() => router.push("/habit-preferences")}
          title="Habit preferences"
        />
      </SettingsSection>

      <SettingsSection title="Progress">
        <SettingsRow
          description="Levels, rank, achievements, and badges."
          icon="rank"
          onPress={() => router.push("/rank")}
          title="Rank and achievements"
          value={`Level ${level}`}
        />
        <SettingsRow
          description="Completion trends and habit insights."
          icon="analytics"
          onPress={() => router.push("/analytics")}
          title="Analytics"
        />
        <SettingsRow
          description="Home progress, reward popups, and haptics."
          icon="star"
          onPress={() => router.push("/gamification-preferences")}
          title="Reward preferences"
        />
      </SettingsSection>

      <SettingsSection
        footer="Widgets use local device data only. Quick completion follows the same habit, XP, and achievement logic as Momentum."
        title="Widgets"
      >
        <SettingsRow
          description="Glance at today's progress and remaining habits from the Home Screen."
          icon="home"
          showChevron={false}
          title="Home Screen Widgets"
          value={widgetSizeLabel}
        />
        <SettingsRow
          description="Add Momentum from your device widget gallery where native widgets are supported."
          icon="check"
          showChevron={false}
          title="Quick setup"
          value="Offline"
        />
      </SettingsSection>

      <SettingsSection
        footer="Backups are local JSON files. Export before demo, import, or reset actions if you want a copy."
        title="Data"
      >
        {SHOW_DEMO_TOOLS ? (
          <>
            <SettingsRow
              disabled={actionLoading}
              icon="plus"
              onPress={confirmLoadDemoData}
              title="Load demo data"
              value={actionLoading ? "Working" : undefined}
            />
            <SettingsRow
              description="Loads a high-progress sample profile."
              disabled={actionLoading}
              icon="rank"
              onPress={confirmLoadMasterDemoData}
              title="Load Master demo"
            />
          </>
        ) : null}
        <SettingsRow
          disabled={actionLoading}
          icon="analytics"
          onPress={handleExportData}
          title="Export Data"
          value={actionLoading ? "Working" : undefined}
        />
        <SettingsRow
          disabled={actionLoading}
          icon="plus"
          onPress={() => setModalMode("import")}
          title="Import Backup"
        />
        <SettingsRow
          description={`Current backup schema v${BACKUP_VERSION}. ${exportMetadata ? `Last export: ${formatBackupDate(exportMetadata.exportedAt)}.` : "No export this session."}`}
          icon="settings"
          showChevron={false}
          title="Backup Information"
          value={`v${BACKUP_VERSION}`}
        />
      </SettingsSection>

      <SettingsSection title="Application">
        <SettingsRow
          description="Personal habit tracking only. No account or backend."
          icon="home"
          showChevron={false}
          title="About Momentum"
          value={`v${packageJson.version}`}
        />
        <SettingsRow
          icon="settings"
          onPress={() => router.push("/privacy")}
          title="Privacy Policy"
        />
        <SettingsRow
          icon="settings"
          onPress={() => router.push("/terms")}
          title="Terms of Use"
        />
        <SettingsRow
          icon="settings"
          onPress={() => router.push("/disclaimer")}
          title="Disclaimer"
        />
      </SettingsSection>

      <SettingsSection
        footer="These actions are local to this device and require confirmation."
        title="Danger Zone"
      >
        <SettingsRow
          destructive
          disabled={actionLoading}
          icon="undo"
          onPress={confirmResetAllData}
          showChevron={false}
          title="Reset all data"
        />
        <SettingsRow
          destructive
          disabled={actionLoading}
          icon="undo"
          onPress={confirmResetOnboarding}
          showChevron={false}
          title="Reset onboarding"
        />
        <SettingsRow
          destructive
          disabled={actionLoading}
          icon="undo"
          onPress={confirmResetPreferences}
          showChevron={false}
          title="Reset preferences"
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
          <View
            accessibilityViewIsModal
            importantForAccessibility="yes"
            style={styles.modalCard}
          >
            <AppText style={styles.modalTitle}>
              {modalMode === "export" ? "Export Data" : "Import Backup"}
            </AppText>
            <AppText style={styles.modalHelper}>
              {modalMode === "export"
                ? getExportHelper(backupText, exportMetadata)
                : "Paste a Momentum JSON backup. Momentum will validate it before anything is replaced."}
            </AppText>

            {modalMode === "export" ? (
              <BackupMetadataCard
                metadata={exportMetadata}
                styles={styles}
                title="Export summary"
              />
            ) : null}
            {modalMode === "import" ? (
              <BackupPreview
                summary={importSummary}
                validation={importValidation}
                styles={styles}
              />
            ) : null}

            <TextInput
              accessibilityHint={
                modalMode === "export"
                  ? "Copy this JSON backup."
                  : "Paste a Momentum JSON backup before importing."
              }
              accessibilityLabel={
                modalMode === "export" ? "Exported JSON backup" : "Import JSON backup"
              }
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

              {modalMode === "export" ? (
                <Pressable
                  accessibilityLabel="Share Momentum backup"
                  accessibilityRole="button"
                  disabled={!backupText}
                  onPress={handleShareBackup}
                  style={({ pressed }) => [
                    styles.modalPrimaryButton,
                    !backupText && styles.disabledButton,
                    pressed && backupText && styles.buttonPressed,
                  ]}
                >
                  <AppText style={styles.modalPrimaryText}>Share</AppText>
                </Pressable>
              ) : null}

              {modalMode === "import" ? (
                <Pressable
                  accessibilityLabel="Import JSON backup"
                  accessibilityRole="button"
                  accessibilityState={{
                    busy: actionLoading,
                    disabled: actionLoading || !importValidation?.ok,
                  }}
                  disabled={actionLoading || !importValidation?.ok}
                  onPress={confirmImportData}
                  style={({ pressed }) => [
                    styles.modalPrimaryButton,
                    (actionLoading || !importValidation?.ok) && styles.disabledButton,
                    pressed &&
                      !actionLoading &&
                      importValidation?.ok &&
                      styles.buttonPressed,
                  ]}
                >
                  <AppText style={styles.modalPrimaryText}>Replace data</AppText>
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

function BackupPreview({ summary, validation, styles }) {
  if (!validation) {
    return (
      <View
        accessibilityLabel="Import preview. Paste a backup to preview its contents."
        accessible
        style={styles.previewCard}
      >
        <AppText style={styles.previewTitle}>{summary.title}</AppText>
        <AppText style={styles.previewText}>{summary.body}</AppText>
      </View>
    );
  }

  const { metadata } = validation;

  return (
    <View
      accessibilityLabel={`Import preview. ${validation.ok ? "Backup is valid." : "Backup has errors."} ${metadata.habitCount} habits. Exported ${metadata.exportedAt}.`}
      accessible
      style={styles.previewCard}
    >
      <AppText style={styles.previewTitle}>{summary.title}</AppText>
      <AppText style={styles.previewText}>{summary.body}</AppText>
      <BackupMetadataList metadata={metadata} styles={styles} />
      {validation.errors.length > 0 ? (
        <AppText style={styles.previewError}>{summary.detail}</AppText>
      ) : null}
      {validation.warnings.length > 0 ? (
        <AppText style={styles.previewWarning}>{summary.detail}</AppText>
      ) : null}
      {validation.ok && validation.warnings.length === 0 ? (
        <AppText style={styles.previewSuccess}>{summary.detail}</AppText>
      ) : null}
    </View>
  );
}

function BackupMetadataCard({ metadata, styles, title }) {
  if (!metadata) {
    return null;
  }

  return (
    <View
      accessibilityLabel={`Backup summary. ${metadata.habitCount} habits. Schema version ${metadata.version}. Exported ${formatBackupDate(metadata.exportedAt)}.`}
      accessible
      style={styles.previewCard}
    >
      <AppText style={styles.previewTitle}>{title}</AppText>
      <BackupMetadataList metadata={metadata} styles={styles} />
    </View>
  );
}

function BackupMetadataList({ metadata, styles }) {
  return (
    <View style={styles.metadataGrid}>
      <MetadataItem
        label="Exported"
        styles={styles}
        value={formatBackupDate(metadata.exportedAt)}
      />
      <MetadataItem label="App" styles={styles} value={metadata.appVersion} />
      <MetadataItem label="Schema" styles={styles} value={`v${metadata.version}`} />
      <MetadataItem
        label="Habits"
        styles={styles}
        value={String(metadata.habitCount)}
      />
      <MetadataItem
        label="History"
        styles={styles}
        value={
          metadata.hasActivityHistory
            ? `${metadata.activityHistoryCount}`
            : "Empty"
        }
      />
      <MetadataItem
        label="Routines"
        styles={styles}
        value={String(metadata.routineCount)}
      />
      <MetadataItem
        label="Templates"
        styles={styles}
        value={String(metadata.templateCount)}
      />
    </View>
  );
}

function MetadataItem({ label, styles, value }) {
  return (
    <View style={styles.metadataItem}>
      <AppText style={styles.metadataLabel}>{label}</AppText>
      <AppText numberOfLines={2} style={styles.metadataValue}>{value}</AppText>
    </View>
  );
}

function getExportHelper(backupText, metadata) {
  if (!backupText) {
    return "Store this backup somewhere safe.";
  }

  return `Export completed ${metadata ? formatBackupDate(metadata.exportedAt) : "now"}. Store this backup somewhere safe. Size: ${formatByteSize(backupText.length)}.`;
}

function getRestoreSuccessMessage(result) {
  const habitCount = Array.isArray(result?.habits) ? result.habits.length : 0;
  const habitText = `${habitCount} habit${habitCount === 1 ? "" : "s"}`;
  const warning = Array.isArray(result?.warnings) ? result.warnings[0] : "";

  if (warning) {
    return `Backup restored. ${habitText} loaded. ${warning}`;
  }

  return `Backup restored. ${habitText} loaded. Restart not required.`;
}

function formatByteSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatBackupDate(value) {
  if (!value || value === "Unknown") {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
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
    previewCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      gap: v2Spacing.xs,
      padding: v2Spacing.md,
    },
    previewTitle: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.label.lineHeight,
    },
    previewText: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      lineHeight: v2Typography.caption.lineHeight,
    },
    metadataGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
      paddingTop: v2Spacing.xs,
    },
    metadataItem: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexBasis: "30%",
      flexGrow: 1,
      minWidth: 92,
      paddingHorizontal: v2Spacing.sm,
      paddingVertical: v2Spacing.xs,
    },
    metadataLabel: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      lineHeight: v2Typography.caption.lineHeight,
    },
    metadataValue: {
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.label.lineHeight,
      marginTop: 2,
    },
    previewError: {
      color: colors.danger,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.caption.lineHeight,
    },
    previewWarning: {
      color: colors.warning || colors.primary,
      fontSize: v2Typography.caption.fontSize,
      lineHeight: v2Typography.caption.lineHeight,
    },
    previewSuccess: {
      color: colors.success || colors.primary,
      fontSize: v2Typography.caption.fontSize,
      lineHeight: v2Typography.caption.lineHeight,
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
