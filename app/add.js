import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import HabitFormFields from "../components/HabitFormFields";
import HabitFormScreen, {
  HabitFormHeader,
  habitFormSharedStyles,
} from "../components/HabitFormScreen";
import { AppIcon, AppText } from "../components/ui";
import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_EMOJI,
  DEFAULT_HABIT_FREQUENCY,
} from "../constants/habitOptions";
import {
  v2FontWeight,
  v2Layout,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { parseReminderTime } from "../notifications/habitNotifications";
import { awardHabitCreatedBadge } from "../storage/gamificationStorage";
import { addHabit, addHabitsFromDrafts, getHabits } from "../storage/habitsStorage";
import {
  builtInHabitTemplates,
  builtInRoutines,
  createHabitDraftFromTemplate,
  createRoutineHabitsFromSelection,
  findDuplicateHabitDraft,
  getRoutineTemplates,
  templateGroups,
} from "../utils/habitTemplates";

export default function AddHabitScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_HABIT_EMOJI);
  const [category, setCategory] = useState(DEFAULT_HABIT_CATEGORY);
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);
  const [frequency, setFrequency] = useState(DEFAULT_HABIT_FREQUENCY);
  const [customDays, setCustomDays] = useState([]);
  const [reminderTime, setReminderTime] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [existingHabits, setExistingHabits] = useState([]);
  const [pickerMode, setPickerMode] = useState(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState("All");
  const [selectedRoutineId, setSelectedRoutineId] = useState(
    builtInRoutines[0]?.id || ""
  );
  const [selectedRoutineTemplateIds, setSelectedRoutineTemplateIds] = useState(
    []
  );
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const routineSavingRef = useRef(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const hasUnsavedInput =
    name.trim() ||
    emoji !== DEFAULT_HABIT_EMOJI ||
    category !== DEFAULT_HABIT_CATEGORY ||
    color !== DEFAULT_HABIT_COLOR ||
    frequency !== DEFAULT_HABIT_FREQUENCY ||
    customDays.length > 0 ||
    reminderTime.trim();
  const filteredTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();

    return builtInHabitTemplates.filter((template) => {
      const matchesGroup =
        selectedTemplateGroup === "All" ||
        template.group === selectedTemplateGroup;
      const matchesSearch =
        !query ||
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query);

      return matchesGroup && matchesSearch;
    });
  }, [selectedTemplateGroup, templateSearch]);
  const selectedRoutine = useMemo(
    () => builtInRoutines.find((routine) => routine.id === selectedRoutineId),
    [selectedRoutineId]
  );
  const selectedRoutineTemplates = useMemo(
    () => getRoutineTemplates(selectedRoutineId),
    [selectedRoutineId]
  );
  const selectedRoutineDrafts = useMemo(
    () =>
      createRoutineHabitsFromSelection({
        selectedTemplateIds: selectedRoutineTemplateIds,
      }),
    [selectedRoutineTemplateIds]
  );
  const currentDuplicate = findDuplicateHabitDraft(
    { customDays, frequency, name },
    existingHabits
  );

  useEffect(() => {
    let isActive = true;

    async function loadExistingHabits() {
      const storedHabits = await getHabits();

      if (isActive) {
        setExistingHabits(storedHabits);
      }
    }

    loadExistingHabits();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setSelectedRoutineTemplateIds(
      selectedRoutineTemplates.map((template) => template.id)
    );
  }, [selectedRoutineTemplates]);

  function clearError() {
    if (error) {
      setError("");
    }

    if (message) {
      setMessage("");
    }

    if (duplicateConfirmed) {
      setDuplicateConfirmed(false);
    }
  }

  function openPicker(mode) {
    setPickerMode(mode);
    setMessage("");
  }

  function closePicker() {
    setPickerMode(null);
    setTemplateSearch("");
  }

  function applyTemplate(template) {
    const draft = createHabitDraftFromTemplate(template, {
      category,
      color,
      emoji,
      frequency,
    });

    setName(draft.name);
    setEmoji(draft.emoji);
    setCategory(draft.category);
    setColor(draft.color);
    setFrequency(draft.frequency);
    setCustomDays(draft.customDays);
    setReminderTime(draft.reminderTime);
    setDuplicateConfirmed(false);
    setError("");
    setMessage(`${template.name} template applied. Review before saving.`);
    closePicker();
  }

  function toggleRoutineTemplate(templateId) {
    setSelectedRoutineTemplateIds((current) =>
      current.includes(templateId)
        ? current.filter((id) => id !== templateId)
        : [...current, templateId]
    );
  }

  function handleCancel() {
    if (!hasUnsavedInput) {
      router.replace("/");
      return;
    }

    Alert.alert("Discard this habit?", "Your unsaved changes will be lost.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => router.replace("/"),
      },
    ]);
  }

  async function handleSave(allowDuplicate = false) {
    if (savingRef.current) {
      return;
    }

    if (!name.trim()) {
      setError("Habit name is required.");
      return;
    }

    if (reminderTime.trim() && !parseReminderTime(reminderTime)) {
      setError("Use 24-hour reminder time, like 08:30.");
      return;
    }

    if (frequency === "Custom" && customDays.length === 0) {
      setError("Choose at least one custom day.");
      return;
    }

    if (currentDuplicate && !duplicateConfirmed && !allowDuplicate) {
      Alert.alert(
        "Possible duplicate",
        `You already have a habit named "${currentDuplicate.name}".`,
        [
          { text: "Review", style: "cancel" },
          {
            text: "Add another anyway",
            onPress: () => {
              setDuplicateConfirmed(true);
              handleSave(true);
            },
          },
        ]
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const savedHabit = await addHabit({
        name,
        emoji,
        category,
        color,
        frequency,
        customDays,
        reminderTime,
      });

      try {
        await awardHabitCreatedBadge();
      } catch {
        // The habit is saved; reward recovery can happen during the next rebuild.
      }

      if (savedHabit) {
        router.replace("/");
      }
    } catch {
      setError("Could not save this habit. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleCreateRoutine() {
    if (routineSavingRef.current) {
      return;
    }

    if (selectedRoutineDrafts.length === 0) {
      setError("Select at least one habit from this routine.");
      return;
    }

    routineSavingRef.current = true;
    setSaving(true);
    setError("");

    try {
      await addHabitsFromDrafts(selectedRoutineDrafts);

      try {
        await awardHabitCreatedBadge();
      } catch {
        // Routine habits are saved; reward recovery can happen later.
      }

      router.replace("/");
    } catch {
      setError("Could not add this routine. Please try again.");
    } finally {
      routineSavingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <HabitFormScreen
      error={error}
      footer={
        <Pressable
          accessibilityLabel="Save habit"
          accessibilityRole="button"
          disabled={saving}
          onPress={() => handleSave()}
          style={({ pressed }) => [
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            pressed && !saving && styles.buttonPressed,
          ]}
        >
          <AppText style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save habit"}
          </AppText>
        </Pressable>
      }
      header={
        <HabitFormHeader
          eyebrow="New Habit"
          subtitle="Choose one promise you can repeat tomorrow."
          title="Create a habit"
        />
      }
      topBar={
        <Pressable
          accessibilityLabel="Cancel creating habit"
          accessibilityRole="button"
          hitSlop={10}
          onPress={handleCancel}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <AppText style={styles.cancelButtonText}>Cancel</AppText>
        </Pressable>
      }
    >
      <View style={styles.quickStartCard}>
        <View style={styles.quickStartText}>
          <AppText style={styles.quickStartTitle}>Quick start</AppText>
          <AppText style={styles.quickStartSubtitle}>
            Start manually, use a template, or add a small routine.
          </AppText>
        </View>
        <View style={styles.quickStartActions}>
          <Pressable
            accessibilityLabel="Use a habit template"
            accessibilityRole="button"
            onPress={() => openPicker("template")}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <AppText style={styles.secondaryButtonText}>Use template</AppText>
          </Pressable>
          <Pressable
            accessibilityLabel="Add a routine"
            accessibilityRole="button"
            onPress={() => openPicker("routine")}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <AppText style={styles.secondaryButtonText}>Add routine</AppText>
          </Pressable>
        </View>
      </View>

      {message ? <AppText style={styles.message}>{message}</AppText> : null}

      <HabitFormFields
        autoFocus
        category={category}
        color={color}
        customDays={customDays}
        emoji={emoji}
        frequency={frequency}
        name={name}
        onNameChange={clearError}
        reminderTime={reminderTime}
        setCategory={(value) => {
          clearError();
          setCategory(value);
        }}
        setColor={(value) => {
          clearError();
          setColor(value);
        }}
        setCustomDays={(value) => {
          clearError();
          setCustomDays(value);
        }}
        setEmoji={(value) => {
          clearError();
          setEmoji(value);
        }}
        setFrequency={(value) => {
          clearError();
          setFrequency(value);
        }}
        setName={setName}
        setReminderTime={(value) => {
          clearError();
          setReminderTime(value);
        }}
      />

      <TemplateRoutinePicker
        colors={colors}
        existingHabits={existingHabits}
        filteredTemplates={filteredTemplates}
        onApplyTemplate={applyTemplate}
        onClose={closePicker}
        onCreateRoutine={handleCreateRoutine}
        onGroupChange={setSelectedTemplateGroup}
        onRoutineChange={setSelectedRoutineId}
        onSearchChange={setTemplateSearch}
        onToggleRoutineTemplate={toggleRoutineTemplate}
        pickerMode={pickerMode}
        routineSaving={saving}
        selectedGroup={selectedTemplateGroup}
        selectedRoutine={selectedRoutine}
        selectedRoutineDrafts={selectedRoutineDrafts}
        selectedRoutineId={selectedRoutineId}
        selectedRoutineTemplateIds={selectedRoutineTemplateIds}
        selectedRoutineTemplates={selectedRoutineTemplates}
        styles={styles}
        templateSearch={templateSearch}
      />
    </HabitFormScreen>
  );
}

function TemplateRoutinePicker({
  colors,
  existingHabits,
  filteredTemplates,
  onApplyTemplate,
  onClose,
  onCreateRoutine,
  onGroupChange,
  onRoutineChange,
  onSearchChange,
  onToggleRoutineTemplate,
  pickerMode,
  routineSaving,
  selectedGroup,
  selectedRoutine,
  selectedRoutineDrafts,
  selectedRoutineId,
  selectedRoutineTemplateIds,
  selectedRoutineTemplates,
  styles,
  templateSearch,
}) {
  if (!pickerMode) {
    return null;
  }

  const isTemplateMode = pickerMode === "template";

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderText}>
              <AppText style={styles.modalTitle}>
                {isTemplateMode ? "Use a template" : "Add a routine"}
              </AppText>
              <AppText style={styles.modalSubtitle}>
                {isTemplateMode
                  ? "Choose a starting point, then review before saving."
                  : "Create separate habits from a small routine."}
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="Close picker"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <AppText style={styles.closeButtonText}>Close</AppText>
            </Pressable>
          </View>

          {isTemplateMode ? (
            <TemplatePickerContent
              filteredTemplates={filteredTemplates}
              onApplyTemplate={onApplyTemplate}
              onGroupChange={onGroupChange}
              onSearchChange={onSearchChange}
              selectedGroup={selectedGroup}
              styles={styles}
              templateSearch={templateSearch}
            />
          ) : (
            <RoutinePickerContent
              existingHabits={existingHabits}
              onCreateRoutine={onCreateRoutine}
              onRoutineChange={onRoutineChange}
              onToggleRoutineTemplate={onToggleRoutineTemplate}
              routineSaving={routineSaving}
              selectedRoutine={selectedRoutine}
              selectedRoutineDrafts={selectedRoutineDrafts}
              selectedRoutineId={selectedRoutineId}
              selectedRoutineTemplateIds={selectedRoutineTemplateIds}
              selectedRoutineTemplates={selectedRoutineTemplates}
              styles={styles}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function TemplatePickerContent({
  filteredTemplates,
  onApplyTemplate,
  onGroupChange,
  onSearchChange,
  selectedGroup,
  styles,
  templateSearch,
}) {
  return (
    <>
      <TextInput
        accessibilityLabel="Search habit templates"
        onChangeText={onSearchChange}
        placeholder="Search templates"
        placeholderTextColor={styles.placeholderColor.color}
        style={styles.searchInput}
        value={templateSearch}
      />
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        style={styles.groupScroller}
      >
        {["All", ...templateGroups].map((group) => (
          <Pressable
            accessibilityLabel={`${group} templates`}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedGroup === group }}
            key={group}
            onPress={() => onGroupChange(group)}
            style={({ pressed }) => [
              styles.groupChip,
              selectedGroup === group && styles.groupChipSelected,
              pressed && styles.buttonPressed,
            ]}
          >
            <AppText
              style={[
                styles.groupChipText,
                selectedGroup === group && styles.groupChipTextSelected,
              ]}
            >
              {group}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView
        contentContainerStyle={styles.modalList}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              onPress={() => onApplyTemplate(template)}
              styles={styles}
              template={template}
            />
          ))
        ) : (
          <AppText style={styles.emptyPickerText}>No matching templates.</AppText>
        )}
      </ScrollView>
    </>
  );
}

function RoutinePickerContent({
  existingHabits,
  onCreateRoutine,
  onRoutineChange,
  onToggleRoutineTemplate,
  routineSaving,
  selectedRoutine,
  selectedRoutineDrafts,
  selectedRoutineId,
  selectedRoutineTemplateIds,
  selectedRoutineTemplates,
  styles,
}) {
  const duplicateCount = selectedRoutineDrafts.filter((draft) =>
    findDuplicateHabitDraft(draft, existingHabits)
  ).length;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.groupScroller}
      >
        {builtInRoutines.map((routine) => (
          <Pressable
            accessibilityLabel={`${routine.name} routine`}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedRoutineId === routine.id }}
            key={routine.id}
            onPress={() => onRoutineChange(routine.id)}
            style={({ pressed }) => [
              styles.groupChip,
              selectedRoutineId === routine.id && styles.groupChipSelected,
              pressed && styles.buttonPressed,
            ]}
          >
            <AppText
              style={[
                styles.groupChipText,
                selectedRoutineId === routine.id &&
                  styles.groupChipTextSelected,
              ]}
            >
              {routine.name}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.modalList}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.routineSummary}>
          <AppText style={styles.routineTitle}>{selectedRoutine?.name}</AppText>
          <AppText style={styles.routineDescription}>
            {selectedRoutine?.description}
          </AppText>
          <AppText style={styles.routineCount}>
            {selectedRoutineDrafts.length} habit
            {selectedRoutineDrafts.length === 1 ? "" : "s"} selected
          </AppText>
        </View>

        {duplicateCount > 0 ? (
          <AppText accessibilityRole="alert" style={styles.duplicateWarning}>
            {duplicateCount} selected habit
            {duplicateCount === 1 ? " looks" : "s look"} similar to habits you
            already track. You can add them anyway.
          </AppText>
        ) : null}

        {selectedRoutineTemplates.map((template) => {
          const selected = selectedRoutineTemplateIds.includes(template.id);

          return (
            <Pressable
              accessibilityLabel={`${template.name} routine habit`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              key={template.id}
              onPress={() => onToggleRoutineTemplate(template.id)}
              style={({ pressed }) => [
                styles.routineItem,
                selected && styles.routineItemSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.routineCheck}>
                {selected ? (
                  <AppIcon name="check" size={14} color={styles.checkColor.color} />
                ) : null}
              </View>
              <View style={styles.templateText}>
                <AppText style={styles.templateName}>{template.name}</AppText>
                <AppText style={styles.templateDescription}>
                  {template.frequency}
                  {template.frequency === "Custom"
                    ? ` · ${template.customDays.join(", ")}`
                    : ""}
                </AppText>
              </View>
            </Pressable>
          );
        })}

        {selectedRoutineDrafts.length === 0 ? (
          <AppText style={styles.emptyPickerText}>
            Select at least one habit.
          </AppText>
        ) : null}
      </ScrollView>

      <Pressable
        accessibilityLabel="Create selected routine habits"
        accessibilityRole="button"
        accessibilityState={{
          disabled: routineSaving || selectedRoutineDrafts.length === 0,
        }}
        disabled={routineSaving || selectedRoutineDrafts.length === 0}
        onPress={onCreateRoutine}
        style={({ pressed }) => [
          styles.createRoutineButton,
          (routineSaving || selectedRoutineDrafts.length === 0) &&
            styles.saveButtonDisabled,
          pressed && !routineSaving && styles.buttonPressed,
        ]}
      >
        <AppText style={styles.createRoutineButtonText}>
          {routineSaving
            ? "Adding..."
            : `Add ${selectedRoutineDrafts.length} habit${
                selectedRoutineDrafts.length === 1 ? "" : "s"
              }`}
        </AppText>
      </Pressable>
    </>
  );
}

function TemplateCard({ onPress, styles, template }) {
  return (
    <Pressable
      accessibilityHint="Applies this template to the habit form."
      accessibilityLabel={`${template.name}. ${template.description}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.templateCard,
        pressed && styles.buttonPressed,
      ]}
    >
      <View style={styles.templateEmoji}>
        <AppText style={styles.templateEmojiText}>{template.emoji}</AppText>
      </View>
      <View style={styles.templateText}>
        <View style={styles.templateHeaderRow}>
          <AppText style={styles.templateName}>{template.name}</AppText>
          <AppText style={styles.templateGroup}>{template.group}</AppText>
        </View>
        <AppText style={styles.templateDescription}>
          {template.description}
        </AppText>
      </View>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    cancelButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      justifyContent: "center",
      marginLeft: "auto",
      minHeight: v2Layout.minTapTarget,
      paddingHorizontal: 16,
    },
    cancelButtonText: {
      color: colors.text,
      ...v2Typography.button,
      fontWeight: v2FontWeight.bold,
    },
    quickStartCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      gap: v2Spacing.md,
      marginBottom: v2Spacing.xl,
      padding: v2Spacing.lg,
    },
    quickStartText: {
      gap: v2Spacing.xs,
    },
    quickStartTitle: {
      color: colors.text,
      ...v2Typography.cardTitle,
      fontWeight: v2FontWeight.bold,
    },
    quickStartSubtitle: {
      color: colors.muted,
      ...v2Typography.label,
      fontWeight: v2FontWeight.medium,
    },
    quickStartActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    secondaryButton: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      flexGrow: 1,
      justifyContent: "center",
      minHeight: v2Layout.minTapTarget,
      minWidth: 132,
      paddingHorizontal: v2Spacing.md,
    },
    secondaryButtonText: {
      color: colors.text,
      ...v2Typography.label,
      fontWeight: v2FontWeight.bold,
    },
    message: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      color: colors.text,
      ...v2Typography.label,
      fontWeight: v2FontWeight.medium,
      marginBottom: v2Spacing.lg,
      padding: v2Spacing.md,
    },
    modalBackdrop: {
      backgroundColor: colors.modalBackdrop,
      flex: 1,
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderTopLeftRadius: v2Radius.large,
      borderTopRightRadius: v2Radius.large,
      borderWidth: 1,
      maxHeight: "88%",
      padding: v2Spacing.lg,
    },
    modalHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.md,
      justifyContent: "space-between",
      marginBottom: v2Spacing.lg,
    },
    modalHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    modalTitle: {
      color: colors.text,
      ...v2Typography.sectionTitle,
      fontWeight: v2FontWeight.bold,
    },
    modalSubtitle: {
      color: colors.muted,
      ...v2Typography.label,
      fontWeight: v2FontWeight.medium,
      marginTop: v2Spacing.xs,
    },
    iconButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: v2Layout.minTapTarget,
      paddingHorizontal: v2Spacing.md,
    },
    closeButtonText: {
      color: colors.text,
      ...v2Typography.label,
      fontWeight: v2FontWeight.bold,
    },
    searchInput: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      color: colors.text,
      ...v2Typography.body,
      marginBottom: v2Spacing.md,
      minHeight: 48,
      paddingHorizontal: v2Spacing.lg,
    },
    placeholderColor: {
      color: colors.muted,
    },
    groupScroller: {
      flexGrow: 0,
      marginBottom: v2Spacing.md,
    },
    groupChip: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      justifyContent: "center",
      marginRight: v2Spacing.sm,
      minHeight: 40,
      paddingHorizontal: v2Spacing.md,
    },
    groupChipSelected: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
    },
    groupChipText: {
      color: colors.muted,
      ...v2Typography.label,
      fontWeight: v2FontWeight.bold,
    },
    groupChipTextSelected: {
      color: colors.text,
    },
    modalList: {
      gap: v2Spacing.sm,
      paddingBottom: v2Spacing.lg,
    },
    templateCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      padding: v2Spacing.md,
    },
    templateEmoji: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 48,
      minWidth: 48,
    },
    templateEmojiText: {
      fontSize: 22,
    },
    templateText: {
      flex: 1,
      minWidth: 0,
    },
    templateHeaderRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: v2Spacing.sm,
      justifyContent: "space-between",
    },
    templateName: {
      color: colors.text,
      flex: 1,
      ...v2Typography.body,
      fontWeight: v2FontWeight.bold,
      minWidth: 0,
    },
    templateGroup: {
      color: colors.primary,
      flexShrink: 0,
      ...v2Typography.caption,
      fontWeight: v2FontWeight.bold,
      textTransform: "uppercase",
    },
    templateDescription: {
      color: colors.muted,
      ...v2Typography.label,
      fontWeight: v2FontWeight.medium,
      marginTop: 3,
    },
    routineSummary: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      padding: v2Spacing.lg,
    },
    routineTitle: {
      color: colors.text,
      ...v2Typography.cardTitle,
      fontWeight: v2FontWeight.bold,
    },
    routineDescription: {
      color: colors.muted,
      ...v2Typography.label,
      fontWeight: v2FontWeight.medium,
      marginTop: v2Spacing.xs,
    },
    routineCount: {
      color: colors.primary,
      ...v2Typography.caption,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.md,
      textTransform: "uppercase",
    },
    duplicateWarning: {
      backgroundColor: colors.warning
        ? colors.primarySoft
        : colors.dangerSoft,
      borderColor: colors.border,
      borderRadius: v2Radius.medium,
      borderWidth: 1,
      color: colors.text,
      ...v2Typography.label,
      fontWeight: v2FontWeight.medium,
      padding: v2Spacing.md,
    },
    routineItem: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 64,
      padding: v2Spacing.md,
    },
    routineItemSelected: {
      borderColor: colors.primary,
    },
    routineCheck: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: v2Radius.small,
      borderWidth: 1,
      height: 26,
      justifyContent: "center",
      width: 26,
    },
    checkColor: {
      color: colors.primary,
    },
    emptyPickerText: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      color: colors.muted,
      ...v2Typography.body,
      padding: v2Spacing.lg,
      textAlign: "center",
    },
    createRoutineButton: {
      ...habitFormSharedStyles.actionButton,
      backgroundColor: colors.primary,
      marginTop: v2Spacing.md,
    },
    createRoutineButtonText: {
      color: colors.inverseText,
      ...v2Typography.button,
      fontWeight: v2FontWeight.bold,
    },
    saveButton: {
      ...habitFormSharedStyles.actionButton,
      backgroundColor: colors.primary,
      ...v2Shadows.low,
      shadowColor: colors.primary,
      shadowOpacity: 0.18,
    },
    saveButtonDisabled: {
      opacity: 0.65,
    },
    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
    saveButtonText: {
      color: colors.inverseText,
      ...v2Typography.button,
      fontWeight: v2FontWeight.bold,
    },
  });
}
