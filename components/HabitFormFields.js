import { useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  radius,
  spacing,
} from "../constants/typography";
import {
  categoryOptions,
  emojiOptions,
  frequencyOptions,
  habitColorOptions,
  weekDayOptions,
} from "../constants/habitOptions";
import { useTheme } from "../context/ThemeContext";

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
  const styles = createStyles(colors, isSmallScreen);
  const reminderInputRef = useRef(null);

  function toggleCustomDay(day) {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter((item) => item !== day));
      return;
    }

    setCustomDays([...customDays, day]);
  }

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Habit name</Text>
      <TextInput
        autoFocus={autoFocus}
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

      <Text style={styles.label}>Habit emoji</Text>
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
            <Text style={styles.emojiText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Category</Text>
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
            <Text
              style={[
                styles.optionText,
                category === item && styles.optionTextSelected,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Color</Text>
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

      <Text style={styles.label}>Frequency</Text>
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
            <Text
              style={[
                styles.segmentText,
                frequency === item && styles.segmentTextSelected,
              ]}
            >
              {item}
            </Text>
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
                <Text
                  style={[styles.dayText, selected && styles.dayTextSelected]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Reminder time</Text>
      <TextInput
        keyboardType="numbers-and-punctuation"
        onChangeText={setReminderTime}
        placeholder="Optional, e.g. 08:30"
        placeholderTextColor={colors.muted}
        ref={reminderInputRef}
        returnKeyType="done"
        style={styles.input}
        value={reminderTime}
      />
    </View>
  );
}

function createStyles(colors, isSmallScreen) {
  return StyleSheet.create({
    form: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.xxl,
      borderWidth: 1,
      gap: spacing.sm,
      padding: spacing.xl,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 2,
    },
    label: {
      color: colors.text,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
      marginTop: spacing.sm,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      color: colors.text,
      fontSize: fontSize.bodyLarge,
      lineHeight: lineHeight.bodyLarge,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    emojiRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    emojiButton: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: layout.minTapTarget,
      minWidth: layout.minTapTarget,
    },
    emojiText: {
      fontSize: 23,
    },
    optionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    optionButton: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.round,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    optionSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    optionPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
    optionText: {
      color: colors.muted,
      fontSize: fontSize.label,
      fontWeight: fontWeight.medium,
    },
    optionTextSelected: {
      color: colors.primaryDark,
    },
    colorRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    colorButton: {
      borderColor: colors.swatchBorder,
      borderRadius: radius.lg,
      borderWidth: 3,
      minHeight: layout.minTapTarget,
      minWidth: layout.minTapTarget,
    },
    colorSelected: {
      borderColor: colors.text,
    },
    segmented: {
      backgroundColor: colors.inputBackground,
      borderRadius: radius.md,
      flexDirection: "row",
      flexWrap: isSmallScreen ? "wrap" : "nowrap",
      gap: isSmallScreen ? spacing.xs : 0,
      padding: spacing.xs,
    },
    segmentButton: {
      alignItems: "center",
      borderRadius: radius.sm,
      flexBasis: isSmallScreen ? "48%" : 0,
      flexGrow: 1,
      justifyContent: "center",
      minHeight: layout.minTapTarget,
      paddingVertical: spacing.sm,
    },
    segmentSelected: {
      backgroundColor: colors.card,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 1,
    },
    segmentText: {
      color: colors.muted,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
    },
    segmentTextSelected: {
      color: colors.primary,
    },
    dayRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    dayButton: {
      alignItems: "center",
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderRadius: radius.round,
      borderWidth: 1,
      minHeight: layout.minTapTarget,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    daySelected: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    dayText: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
    },
    dayTextSelected: {
      color: colors.text,
    },
  });
}
