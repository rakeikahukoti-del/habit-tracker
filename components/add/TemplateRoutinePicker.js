import { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { habitFormSharedStyles } from "../HabitFormScreen";
import { AppIcon, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import {
  v2FontWeight,
  v2Layout,
  v2PressedStyles,
  v2Radius,
  v2Spacing,
  v2Typography,
} from "../../src/design";
import {
  builtInRoutines,
  findDuplicateHabitDraft,
  templateGroups,
} from "../../utils/habitTemplates";

// This owns its own Modal rather than using components/ui/ModalShell: it's a
// slide-up bottom sheet (square top corners, full width, built-in
// title/subtitle/close header) instead of ModalShell's centered fade-in
// dialog. That's a structural difference driven by the picker's content
// (a search field + scrollable list needing a persistent header), not a
// cosmetic one, so it's intentionally left as-is. See app/settings.js's
// data import/export modal for the app's other bottom sheet, which differs
// from this one too (keyboard-avoiding, footer action bar) and is likewise
// left un-merged rather than forced into a shared primitive for only two
// single-use call sites.
export default function TemplateRoutinePicker({
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
  templateSearch,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        <View
          accessibilityViewIsModal
          importantForAccessibility="yes"
          style={styles.modalCard}
        >
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
                pressed && v2PressedStyles.button,
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
              pressed && v2PressedStyles.button,
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
              pressed && v2PressedStyles.button,
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
                pressed && v2PressedStyles.button,
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
          busy: routineSaving,
          disabled: routineSaving || selectedRoutineDrafts.length === 0,
        }}
        disabled={routineSaving || selectedRoutineDrafts.length === 0}
        onPress={onCreateRoutine}
        style={({ pressed }) => [
          styles.createRoutineButton,
          (routineSaving || selectedRoutineDrafts.length === 0) &&
            styles.saveButtonDisabled,
          pressed && !routineSaving && v2PressedStyles.button,
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
        pressed && v2PressedStyles.button,
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
      borderRadius: v2Radius.large,
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
      borderRadius: v2Radius.large,
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
      borderRadius: v2Radius.medium,
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
      borderRadius: v2Radius.large,
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
    saveButtonDisabled: {
      opacity: 0.65,
    },
  });
}
