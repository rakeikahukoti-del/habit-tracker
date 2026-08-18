import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { QuickStartCard, TemplateRoutinePicker } from "../components/add";
import HabitFormFields from "../components/HabitFormFields";
import HabitFormScreen, {
  HabitFormHeader,
  habitFormSharedStyles,
} from "../components/HabitFormScreen";
import { AppText } from "../components/ui";
import {
  v2FontWeight,
  v2Layout,
  v2PressedStyles,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";
import { useTheme } from "../context/ThemeContext";
import { useAddHabitController } from "../hooks/useAddHabitController";

export default function AddHabitScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    applyTemplate,
    category,
    clearError,
    closePicker,
    color,
    customDays,
    emoji,
    error,
    existingHabits,
    filteredTemplates,
    frequency,
    handleCancel,
    handleCreateRoutine,
    handleSave,
    message,
    name,
    openPicker,
    pickerMode,
    reminderTime,
    saving,
    selectedRoutine,
    selectedRoutineDrafts,
    selectedRoutineId,
    selectedRoutineTemplateIds,
    selectedRoutineTemplates,
    selectedTemplateGroup,
    setCategory,
    setColor,
    setCustomDays,
    setEmoji,
    setFrequency,
    setName,
    setReminderTime,
    setSelectedRoutineId,
    setSelectedTemplateGroup,
    setTemplateSearch,
    templateSearch,
    toggleRoutineTemplate,
  } = useAddHabitController();

  return (
    <HabitFormScreen
      error={error}
      footer={
        <Pressable
          accessibilityLabel="Save habit"
          accessibilityRole="button"
          accessibilityState={{ busy: saving, disabled: saving }}
          disabled={saving}
          onPress={() => handleSave()}
          style={({ pressed }) => [
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            pressed && !saving && v2PressedStyles.button,
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
            pressed && v2PressedStyles.button,
          ]}
        >
          <AppText style={styles.cancelButtonText}>Cancel</AppText>
        </Pressable>
      }
    >
      <QuickStartCard onOpenPicker={openPicker} />

      {message ? <AppText style={styles.message}>{message}</AppText> : null}

      <HabitFormFields
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
        templateSearch={templateSearch}
      />
    </HabitFormScreen>
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
      paddingHorizontal: v2Spacing.base,
    },
    cancelButtonText: {
      color: colors.text,
      ...v2Typography.button,
      fontWeight: v2FontWeight.bold,
    },
    message: {
      backgroundColor: colors.primarySoft,
      borderRadius: v2Radius.medium,
      color: colors.text,
      ...v2Typography.label,
      fontWeight: v2FontWeight.medium,
      marginBottom: v2Spacing.lg,
      padding: v2Spacing.md,
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
    saveButtonText: {
      color: colors.inverseText,
      ...v2Typography.button,
      fontWeight: v2FontWeight.bold,
    },
  });
}
