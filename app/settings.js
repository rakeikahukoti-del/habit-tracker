import { useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
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
import { useReducedMotion } from "../hooks/useReducedMotion";
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
  resetAllHabits,
  seedDemoHabits,
  seedMasterDemoHabits,
} from "../storage/habitsStorage";
import { getSettingsConfirmation } from "../utils/settingsPresentation";
import packageJson from "../package.json";

export default function SettingsScreen() {
  const { colors, resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [actionLoading, setActionLoading] = useState(false);
  const [backupText, setBackupText] = useState("");
  const [exportMetadata, setExportMetadata] = useState(null);
  const [importText, setImportText] = useState("");
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

  async function runDataAction(action, successMessage, failureMessage) {
    if (actionLoadingRef.current) {
      return;
    }

    actionLoadingRef.current = true;
    setActionLoading(true);

    try {
      setMessage("");
      await action();
      setMessage(successMessage);
    } catch {
      setMessage(failureMessage);
    } finally {
      actionLoadingRef.current = false;
      setActionLoading(false);
    }
  }

  function confirmDataAction(
    confirmationKey,
    action,
    successMessage,
    failureMessage
  ) {
    const copy = getSettingsConfirmation(confirmationKey);

    if (!copy) {
      return;
    }

    Alert.alert(copy.title, copy.message, [
      { text: "Cancel", style: "cancel" },
      {
        text: copy.confirmLabel,
        style: "destructive",
        onPress: () => runDataAction(action, successMessage, failureMessage),
      },
    ]);
  }

  function confirmLoadDemoData() {
    confirmDataAction(
      "demo-data",
      seedDemoHabits,
      "Demo data loaded.",
      "Could not load demo data. Please try again."
    );
  }

  function confirmLoadMasterDemoData() {
    confirmDataAction(
      "master-demo",
      seedMasterDemoHabits,
      "Master demo data loaded.",
      "Could not load Master demo data. Please try again."
    );
  }

  function confirmResetAllData() {
    confirmDataAction(
      "reset-data",
      resetAllHabits,
      "All local data reset.",
      "Could not reset data. Please try again."
    );
  }

  function confirmResetOnboarding() {
    confirmDataAction(
      "reset-onboarding",
      resetOnboarding,
      "Onboarding reset.",
      "Could not reset onboarding. Please try again."
    );
  }

  function confirmResetPreferences() {
    confirmDataAction(
      "reset-preferences",
      resetAppPreferences,
      "Preferences reset.",
      "Could not reset preferences. Please try again."
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

  return (
    <SettingsShell
      bottomNav
      eyebrow="Momentum"
      subtitle="Preferences, data, and app information."
      title="Settings"
    >
      <SettingsMessage>{message}</SettingsMessage>

      <SettingsSection title="Appearance">
        <SettingsRow
          description="Choose a light or dark appearance."
          onPress={() => router.push("/appearance")}
          title="Appearance"
          value={formatThemeLabel(resolvedTheme)}
        />
      </SettingsSection>

      <SettingsSection title="Daily experience">
        <SettingsRow
          description="Permission, reminder status, and scheduling preference."
          onPress={() => router.push("/notification-preferences")}
          title="Notifications"
        />
        <SettingsRow
          description="Sorting, completion gestures, and habit order."
          onPress={() => router.push("/habit-preferences")}
          title="Habit preferences"
        />
      </SettingsSection>

      <SettingsSection title="Gamification">
        <SettingsRow
          description="Home progress, reward popups, and reward haptics."
          onPress={() => router.push("/gamification-preferences")}
          title="Gamification preferences"
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
          title="Export data"
          value={actionLoading ? "Working" : undefined}
        />
        <SettingsRow
          disabled={actionLoading}
          onPress={() => setModalMode("import")}
          title="Import backup"
        />
        <SettingsRow
          description={`Current backup schema v${BACKUP_VERSION}. ${exportMetadata ? `Last export: ${formatBackupDate(exportMetadata.exportedAt)}.` : "No export this session."}`}
          showChevron={false}
          title="Backup information"
          value={`v${BACKUP_VERSION}`}
        />
      </SettingsSection>

      <SettingsSection title="Privacy and legal">
        <SettingsRow
          onPress={() => router.push("/privacy")}
          title="Privacy Policy"
        />
        <SettingsRow
          onPress={() => router.push("/terms")}
          title="Terms of Use"
        />
        <SettingsRow
          onPress={() => router.push("/disclaimer")}
          title="Disclaimer"
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow
          description="Personal habit tracking only. No account or backend."
          showChevron={false}
          title="About Momentum"
          value={`v${packageJson.version}`}
        />
      </SettingsSection>

      <SettingsSection
        footer="These actions are local to this device and require confirmation."
        title="Reset"
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

      {/*
        This owns its own Modal rather than using components/ui/ModalShell:
        it's a keyboard-avoiding slide-up bottom sheet with a scrollable body
        and a fixed footer action bar, for editing/pasting JSON backup text.
        ModalShell is a centered fade-in dialog with no header/footer
        structure or keyboard handling, used by the home reward modals and
        rank detail modals. The two bottom sheets in this app (this one and
        components/add/TemplateRoutinePicker.js) also differ from each other
        (this one needs KeyboardAvoidingView + a footer action row; the
        template picker needs a persistent title/close header instead), so
        rather than force both into one shared bottom-sheet primitive for
        only two single-use call sites, each keeps its own implementation.
      */}
      <Modal
        animationType={reduceMotion ? "none" : "slide"}
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
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              <AppText accessibilityRole="header" style={styles.modalTitle}>
                {modalMode === "export" ? "Export data" : "Import backup"}
              </AppText>
              <AppText style={styles.modalHelper}>
                {modalMode === "export"
                  ? getExportHelper(backupText, exportMetadata)
                  : "Paste a Momentum JSON backup. Momentum validates it before replacing any data."}
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
                  modalMode === "export"
                    ? "Exported JSON backup"
                    : "Import JSON backup"
                }
                multiline
                onChangeText={
                  modalMode === "export" ? setBackupText : setImportText
                }
                placeholder={
                  modalMode === "export" ? "Backup JSON" : "Paste JSON here"
                }
                placeholderTextColor={colors.muted}
                scrollEnabled
                style={styles.jsonInput}
                value={modalMode === "export" ? backupText : importText}
              />
            </ScrollView>

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
      maxHeight: "82%",
      padding: v2Spacing.lg,
      ...v2Shadows.floating,
      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
    },
    modalContent: {
      gap: v2Spacing.md,
      paddingBottom: v2Spacing.md,
    },
    modalScroll: {
      flexShrink: 1,
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
      paddingTop: v2Spacing.sm,
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
