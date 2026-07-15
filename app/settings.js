import { useCallback, useState } from "react";
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
import { Link, useFocusEffect } from "expo-router";
import BottomNav from "../components/BottomNav";
import { SHOW_DEMO_TOOLS } from "../constants/appConfig";
import { themes } from "../constants/colors";
import { getQuoteOfTheDay } from "../constants/quotes";
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
  rankThemes,
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
  const {
    colors,
    resolvedTheme,
    setThemePreference,
    themePreference,
  } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });
  const [actionLoading, setActionLoading] = useState(false);
  const [backupText, setBackupText] = useState("");
  const [importText, setImportText] = useState("");
  const [level, setLevel] = useState(1);
  const [modalMode, setModalMode] = useState(null);
  const [message, setMessage] = useState("");
  const quote = getQuoteOfTheDay();

  useFocusEffect(
    useCallback(() => {
      async function loadGamification() {
        const storedGamification = await getGamification();
        const levelInfo = getGamificationLevelInfo(storedGamification);

        setLevel(levelInfo.level);

        if (isLockedTheme(themePreference, levelInfo.level)) {
          setThemePreference("system");
        }
      }

      loadGamification();
    }, [setThemePreference, themePreference])
  );

  async function handleLoadDemoData() {
    setActionLoading(true);

    try {
      setMessage("");
      await seedDemoHabits();
      await refreshLevel();
      setMessage("Demo data loaded.");
    } catch {
      setMessage("Could not load demo data. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLoadMasterDemoData() {
    setActionLoading(true);

    try {
      setMessage("");
      await seedMasterDemoHabits();
      await refreshLevel();
      setMessage("Master demo data loaded.");
    } catch {
      setMessage("Could not load Master demo data. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  function confirmResetAllData() {
    Alert.alert(
      "Reset all data?",
      "This deletes every habit and clears scheduled reminders.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: handleResetAllData,
        },
      ]
    );
  }

  async function handleResetAllData() {
    setActionLoading(true);

    try {
      setMessage("");
      await resetAllHabits();
      await refreshLevel();
      setMessage("All local data reset.");
    } catch {
      setMessage("Could not reset data. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExportData() {
    setActionLoading(true);

    try {
      setMessage("");
      const json = await exportHabitsBackup();
      setBackupText(json);
      setModalMode("export");
    } catch {
      setMessage("Could not export habit data. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  function confirmImportData() {
    Alert.alert(
      "Import backup?",
      "This replaces your current habits with the JSON backup.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: handleImportData,
        },
      ]
    );
  }

  async function handleImportData() {
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
      setActionLoading(false);
    }
  }

  async function refreshLevel() {
    const storedGamification = await getGamification();
    const levelInfo = getGamificationLevelInfo(storedGamification);

    setLevel(levelInfo.level);

    if (isLockedTheme(themePreference, levelInfo.level)) {
      await setThemePreference("system");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Momentum</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage appearance, data, legal info, and app preferences.
          </Text>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <SettingsSection title="Preferences" styles={styles}>
          <SettingsLink
            href="/habit-preferences"
            label="Habits"
            value="Sort, swipe, reorder"
            styles={styles}
          />
          <SettingsLink
            href="/gamification-preferences"
            label="Gamification"
            value="XP, badges, haptics"
            styles={styles}
          />
          <SettingsLink
            href="/notification-preferences"
            label="Notifications"
            value="Daily reminders"
            styles={styles}
          />
        </SettingsSection>

        <SettingsSection title="Appearance" styles={styles}>
          <ThemePreferenceControl
            selectedPreference={themePreference}
            resolvedTheme={resolvedTheme}
            setThemePreference={setThemePreference}
            userLevel={level}
            styles={styles}
          />
        </SettingsSection>

        <SettingsSection title="Data" styles={styles}>
          <View style={styles.buttonRow}>
            {SHOW_DEMO_TOOLS ? (
              <>
                <Pressable
                  accessibilityLabel="Load demo data"
                  accessibilityRole="button"
                  disabled={actionLoading}
                  onPress={handleLoadDemoData}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    actionLoading && styles.disabledButton,
                    pressed && !actionLoading && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    {actionLoading ? "Working..." : "Load demo data"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Load master demo data"
                  accessibilityRole="button"
                  disabled={actionLoading}
                  onPress={handleLoadMasterDemoData}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    actionLoading && styles.disabledButton,
                    pressed && !actionLoading && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>
                    Master demo
                  </Text>
                </Pressable>
              </>
            ) : null}

            <Pressable
              accessibilityLabel="Export habit data as JSON"
              accessibilityRole="button"
              disabled={actionLoading}
              onPress={handleExportData}
              style={({ pressed }) => [
                styles.secondaryButton,
                actionLoading && styles.disabledButton,
                pressed && !actionLoading && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Export JSON</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Import habit data from JSON"
              accessibilityRole="button"
              disabled={actionLoading}
              onPress={() => setModalMode("import")}
              style={({ pressed }) => [
                styles.secondaryButton,
                actionLoading && styles.disabledButton,
                pressed && !actionLoading && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Import JSON</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Reset all data"
              accessibilityRole="button"
              disabled={actionLoading}
              onPress={confirmResetAllData}
              style={({ pressed }) => [
                styles.dangerButton,
                actionLoading && styles.disabledButton,
                pressed && !actionLoading && styles.buttonPressed,
              ]}
            >
              <Text style={styles.dangerButtonText}>Reset all data</Text>
            </Pressable>
          </View>
        </SettingsSection>

        <SettingsSection title="Legal" styles={styles}>
          <LegalLink href="/privacy" label="Privacy Policy" styles={styles} />
          <LegalLink href="/terms" label="Terms of Use" styles={styles} />
          <LegalLink href="/disclaimer" label="Disclaimer" styles={styles} />
        </SettingsSection>

        <SettingsSection title="About" styles={styles}>
          <SettingRow
            label="App version"
            value={packageJson.version}
            styles={styles}
          />
          <SettingRow
            helper="Personal habit tracking only. No account or backend."
            label="App info"
            value="Offline"
            styles={styles}
          />
          <View style={styles.quoteBox}>
            <Text style={styles.quoteLabel}>Motivation</Text>
            <Text style={styles.quoteText}>{quote}</Text>
          </View>
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
                    (actionLoading || !importText.trim()) &&
                      styles.disabledButton,
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

function SettingsSection({ title, children, styles }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SettingRow({ label, value, helper, styles }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {helper ? <Text style={styles.settingHelper}>{helper}</Text> : null}
      </View>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

function LegalLink({ href, label, styles }) {
  return <SettingsLink href={href} label={label} styles={styles} />;
}

function SettingsLink({ href, label, styles, value }) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityLabel={`Open ${label}`}
        accessibilityRole="button"
        hitSlop={4}
        style={({ pressed }) => [
          styles.legalRow,
          pressed && styles.rowPressed,
        ]}
      >
        <View style={styles.settingText}>
          <Text style={styles.legalLabel}>{label}</Text>
          {value ? <Text style={styles.settingHelper}>{value}</Text> : null}
        </View>
        <Text style={styles.legalArrow}>{">"}</Text>
      </Pressable>
    </Link>
  );
}

function ThemePreferenceControl({
  selectedPreference,
  resolvedTheme,
  setThemePreference,
  userLevel,
  styles,
}) {
  const baseOptions = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "System", value: "system" },
  ];
  const options = [
    ...baseOptions.map((option) => ({ ...option, unlocked: true })),
    ...rankThemes.map((theme) => ({
      label: theme.label,
      requiredLevel: theme.unlockLevel,
      unlocked: userLevel >= theme.unlockLevel,
      value: theme.key,
    })),
  ];

  return (
    <View style={styles.themeControl}>
      <View>
        <Text style={styles.settingLabel}>Theme</Text>
        <Text style={styles.settingHelper}>
          Current appearance: {formatThemeLabel(resolvedTheme)}.
        </Text>
      </View>

      <Text style={styles.themeGroupLabel}>Base appearance</Text>
      <View style={styles.themeOptions}>
        {options.slice(0, 3).map((option) => {
          const selected = selectedPreference === option.value;

          return renderThemeOption({
            option,
            selected,
            setThemePreference,
            styles,
          });
        })}
      </View>

      <Text style={styles.themeGroupLabel}>Rank themes</Text>
      <View style={styles.themeOptions}>
        {options.slice(3).map((option) => {
          const selected = selectedPreference === option.value;

          return renderThemeOption({
            option,
            selected,
            setThemePreference,
            styles,
          });
        })}
      </View>
    </View>
  );
}

function renderThemeOption({ option, selected, setThemePreference, styles }) {
  const previewColors = getPreviewColors(option.value);

  return (
    <Pressable
      accessibilityLabel={`${option.label} theme${option.unlocked ? "" : `, locked until level ${option.requiredLevel}`}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !option.unlocked, selected }}
      key={option.value}
      disabled={!option.unlocked}
      onPress={() => setThemePreference(option.value)}
      style={({ pressed }) => [
        styles.themeOption,
        selected && styles.themeOptionSelected,
        !option.unlocked && styles.themeOptionLocked,
        pressed && option.unlocked && styles.cardPressed,
      ]}
    >
      <View style={styles.themePreviewRow}>
        <View
          style={[
            styles.themePreviewDot,
            { backgroundColor: previewColors.background },
          ]}
        />
        <View
          style={[
            styles.themePreviewDot,
            { backgroundColor: previewColors.primary },
          ]}
        />
        <View
          style={[
            styles.themePreviewDot,
            { backgroundColor: previewColors.accent },
          ]}
        />
      </View>
      <Text
        style={[
          styles.themeOptionText,
          selected && styles.themeOptionTextSelected,
          !option.unlocked && styles.themeOptionTextLocked,
        ]}
      >
        {!option.unlocked ? "🔒 " : ""}
        {option.label}
      </Text>
      <Text style={styles.themeLockText}>
        {option.unlocked ? (selected ? "Selected" : "Available") : `Level ${option.requiredLevel}`}
      </Text>
    </Pressable>
  );
}

function getPreviewColors(themeKey) {
  if (themeKey === "system") {
    return {
      accent: themes.light.accent,
      background: themes.dark.background,
      primary: themes.light.primary,
    };
  }

  return themes[themeKey] || themes.light;
}

function formatThemeLabel(themeKey) {
  return themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
}

function isLockedTheme(themePreference, userLevel) {
  const rankTheme = rankThemes.find((theme) => theme.key === themePreference);

  return Boolean(rankTheme && userLevel < rankTheme.unlockLevel);
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
  header: {
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
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
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.bodyLarge,
    marginTop: spacing.sm,
  },
  message: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    color: colors.primaryDark,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xxl,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.section,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  quoteBox: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  quoteLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: fontWeight.bold,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  quoteText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  settingRow: {
    alignItems: "flex-start",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  settingText: {
    flex: 1,
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
  settingValue: {
    color: colors.primary,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
    flexShrink: 1,
  },
  buttonRow: {
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    justifyContent: "center",
    minHeight: 50,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: colors.inverseText,
    fontSize: 15,
    fontWeight: fontWeight.bold,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: fontWeight.bold,
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    justifyContent: "center",
    minHeight: 50,
    paddingVertical: 14,
  },
  dangerButtonText: {
    color: colors.danger,
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
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  rowPressed: {
    opacity: 0.72,
  },
  legalRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 50,
    paddingVertical: 14,
  },
  legalLabel: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.bold,
  },
  legalArrow: {
    color: colors.muted,
    fontSize: 24,
    fontWeight: fontWeight.bold,
  },
  themeControl: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 10,
    paddingVertical: 13,
  },
  themeGroupLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: fontWeight.bold,
    marginTop: 4,
    textTransform: "uppercase",
  },
  themeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  themeOption: {
    alignItems: "flex-start",
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: isSmallScreen ? "48%" : "31%",
    flexGrow: 1,
    justifyContent: "space-between",
    minHeight: 104,
    padding: 12,
  },
  themeOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  themeOptionLocked: {
    opacity: 0.62,
  },
  themePreviewRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 10,
  },
  themePreviewDot: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  themeOptionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: fontWeight.bold,
  },
  themeOptionTextSelected: {
    color: colors.primary,
  },
  themeOptionTextLocked: {
    color: colors.softText,
  },
  themeLockText: {
    color: colors.softText,
    fontSize: 11,
    fontWeight: fontWeight.bold,
    marginTop: 6,
  },
  modalBackdrop: {
    backgroundColor: colors.modalBackdrop,
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    gap: 12,
    maxHeight: "82%",
    padding: 18,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: fontWeight.bold,
  },
  modalHelper: {
    color: colors.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.regular,
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
    borderRadius: radius.lg,
    flex: 1,
    minHeight: 50,
    justifyContent: "center",
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
    minHeight: 50,
    justifyContent: "center",
  },
  modalPrimaryText: {
    color: colors.inverseText,
    fontSize: 15,
    fontWeight: fontWeight.bold,
  },
  });
}
