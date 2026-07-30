import { useMemo, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  v2FontWeight,
  v2Layout,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../src/design";
import {
  categoryOptions,
  emojiOptions,
  frequencyOptions,
  habitColorOptions,
  weekDayOptions,
} from "../constants/habitOptions";
import { useTheme } from "../context/ThemeContext";
import { getReminderPreview } from "../notifications/habitNotifications";
import { AppText } from "./ui";

export default function HabitFormFields({
  name,
  setName,
  emoji,
  setEmoji,
  category,
  setCategory,
  color,
  setColor,
  frequency,
  setFrequency,
  customDays,
  setCustomDays,
  reminderTime,
  setReminderTime,
  onNameChange,
  autoFocus = false,
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const styles = useMemo(
    () => createStyles(colors, isSmallScreen),
    [colors, isSmallScreen]
  );
  const reminderInputRef = useRef(null);
  const reminderPreview = useMemo(
    () =>
      getReminderPreview({
        customDays,
        frequency,
        reminderTime,
      }),
    [customDays, frequency, reminderTime]
  );

  function toggleCustomDay(day) {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter((item) => item !== day));
      return;
    }

    setCustomDays([...customDays, day]);
  }

  return (
    <View style={styles.form}>
      <AppText style={styles.label}>Habit name</AppText>
      <TextInput
        accessibilityHint="Enter the habit you want to track."
        accessibilityLabel="Habit name"
        autoFocus={autoFocus}
        autoCapitalize="sentences"
        onChangeText={(value) => {
          setName(value);
          onNameChange?.();
        }}
        onSubmitEditing={() => reminderInputRef.current?.focus()}
        placeholder="Drink water"
        placeholderTextColor={colors.muted}
        returnKeyType="next"
        style={styles.input}
        value={name}
      />

      <AppText style={styles.label}>Habit emoji</AppText>
      <View style={styles.emojiRow}>
        {emojiOptions.map((item) => (
          <Pressable
            accessibilityLabel={`Habit emoji ${item}`}
            accessibilityRole="button"
            accessibilityState={{ selected: emoji === item }}
            key={item}
            onPress={() => setEmoji(item)}
            style={({ pressed }) => [
              styles.emojiButton,
              emoji === item && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
          >
            <AppText style={styles.emojiText}>{item}</AppText>
          </Pressable>
        ))}
      </View>

      <AppText style={styles.label}>Category</AppText>
      <View style={styles.optionGrid}>
        {categoryOptions.map((item) => (
          <Pressable
            accessibilityLabel={`Category ${item}`}
            accessibilityRole="button"
            accessibilityState={{ selected: category === item }}
            key={item}
            onPress={() => setCategory(item)}
            style={({ pressed }) => [
              styles.optionButton,
              category === item && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
          >
            <AppText
              style={[
                styles.optionText,
                category === item && styles.optionTextSelected,
              ]}
            >
              {item}
            </AppText>
          </Pressable>
        ))}
      </View>

      <AppText style={styles.label}>Color</AppText>
      <View style={styles.colorRow}>
        {habitColorOptions.map((item) => (
          <Pressable
            accessibilityLabel={`Habit color ${item}`}
            accessibilityRole="button"
            accessibilityState={{ selected: color === item }}
            key={item}
            onPress={() => setColor(item)}
            style={({ pressed }) => [
              styles.colorButton,
              { backgroundColor: item },
              color === item && styles.colorSelected,
              pressed && styles.optionPressed,
            ]}
          />
        ))}
      </View>

      <AppText style={styles.label}>Frequency</AppText>
      <View style={styles.segmented}>
        {frequencyOptions.map((item) => (
          <Pressable
            accessibilityLabel={`Frequency ${item}`}
            accessibilityRole="button"
            accessibilityState={{ selected: frequency === item }}
            key={item}
            onPress={() => setFrequency(item)}
            style={({ pressed }) => [
              styles.segmentButton,
              frequency === item && styles.segmentSelected,
              pressed && styles.optionPressed,
            ]}
          >
            <AppText
              style={[
                styles.segmentText,
                frequency === item && styles.segmentTextSelected,
              ]}
            >
              {item}
            </AppText>
          </Pressable>
        ))}
      </View>

      {frequency === "Custom" && (
        <View style={styles.dayRow}>
          {weekDayOptions.map((day) => {
            const selected = customDays.includes(day);

            return (
              <Pressable
                accessibilityLabel={`Custom day ${day}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={day}
                onPress={() => toggleCustomDay(day)}
                style={({ pressed }) => [
                  styles.dayButton,
                  selected && styles.daySelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <AppText
                  style={[styles.dayText, selected && styles.dayTextSelected]}
                >
                  {day}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}

      <AppText style={styles.label}>Reminder time</AppText>
      <TextInput
        accessibilityHint="Optional reminder time in 24 hour format, for example 08:30."
        accessibilityLabel="Reminder time"
        keyboardType="numbers-and-punctuation"
        onChangeText={setReminderTime}
        placeholder="Optional, e.g. 08:30"
        placeholderTextColor={colors.muted}
        ref={reminderInputRef}
        returnKeyType="done"
        style={styles.input}
        value={reminderTime}
      />
      <AppText
        accessibilityLabel={`Reminder preview. ${reminderPreview}`}
        style={styles.reminderPreview}
      >
        {reminderPreview}
      </AppText>
    </View>
  );
}

function createStyles(colors, isSmallScreen) {
  return StyleSheet.create({
    form: {
      gap: v2Layout.formGap,
    },
    label: {
      color: colors.muted,
      ...v2Typography.label,
      fontWeight: v2FontWeight.bold,
      marginTop: v2Spacing.xs,
    },
    input: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      color: colors.text,
      ...v2Typography.body,
      minHeight: 52,
      paddingHorizontal: v2Spacing.lg,
      paddingVertical: 14,
    },
    emojiRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    emojiButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: v2Layout.minTapTarget,
      minWidth: v2Layout.minTapTarget,
    },
    emojiText: {
      fontSize: 23,
    },
    optionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    optionButton: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      minHeight: v2Layout.minTapTarget,
      paddingHorizontal: v2Spacing.md,
      paddingVertical: 10,
    },
    optionSelected: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
    },
    optionPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
    optionText: {
      color: colors.muted,
      ...v2Typography.label,
      fontWeight: v2FontWeight.medium,
    },
    optionTextSelected: {
      color: colors.text,
    },
    colorRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    colorButton: {
      borderColor: colors.swatchBorder,
      borderRadius: v2Radius.medium,
      borderWidth: 2,
      minHeight: v2Layout.minTapTarget,
      minWidth: v2Layout.minTapTarget,
    },
    colorSelected: {
      borderColor: colors.text,
    },
    segmented: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: isSmallScreen ? "wrap" : "nowrap",
      gap: isSmallScreen ? v2Spacing.xs : 0,
      padding: v2Spacing.xs,
    },
    segmentButton: {
      alignItems: "center",
      borderRadius: v2Radius.medium,
      flexBasis: isSmallScreen ? "48%" : 0,
      flexGrow: 1,
      justifyContent: "center",
      minHeight: v2Layout.minTapTarget,
      paddingVertical: v2Spacing.sm,
    },
    segmentSelected: {
      backgroundColor: colors.surface,
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
    },
    segmentText: {
      color: colors.muted,
      ...v2Typography.label,
      fontWeight: v2FontWeight.bold,
    },
    segmentTextSelected: {
      color: colors.primary,
    },
    dayRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: v2Spacing.sm,
    },
    dayButton: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      minHeight: v2Layout.minTapTarget,
      paddingHorizontal: v2Spacing.md,
      paddingVertical: v2Spacing.sm,
    },
    daySelected: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    dayText: {
      color: colors.muted,
      ...v2Typography.caption,
      fontWeight: v2FontWeight.bold,
    },
    dayTextSelected: {
      color: colors.text,
    },
    reminderPreview: {
      color: colors.muted,
      ...v2Typography.caption,
      marginTop: -v2Spacing.xs,
    },
  });
}
