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
        placeholder="Drink water"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={name}
      />

      <Text style={styles.label}>Habit emoji</Text>
      <View style={styles.emojiRow}>
        {emojiOptions.map((item) => (
          <Pressable
            key={item}
            onPress={() => setEmoji(item)}
            style={[styles.emojiButton, emoji === item && styles.optionSelected]}
          >
            <Text style={styles.emojiText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.optionGrid}>
        {categoryOptions.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[
              styles.optionButton,
              category === item && styles.optionSelected,
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
            key={item}
            onPress={() => setColor(item)}
            style={[
              styles.colorButton,
              { backgroundColor: item },
              color === item && styles.colorSelected,
            ]}
          />
        ))}
      </View>

      <Text style={styles.label}>Frequency</Text>
      <View style={styles.segmented}>
        {frequencyOptions.map((item) => (
          <Pressable
            key={item}
            onPress={() => setFrequency(item)}
            style={[
              styles.segmentButton,
              frequency === item && styles.segmentSelected,
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
                key={day}
                onPress={() => toggleCustomDay(day)}
                style={[styles.dayButton, selected && styles.daySelected]}
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
        onChangeText={setReminderTime}
        placeholder="Optional, e.g. 08:30"
        placeholderTextColor={colors.muted}
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
    paddingHorizontal: 16,
    paddingVertical: 13,
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
    minHeight: 46,
    justifyContent: "center",
    minWidth: 46,
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
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
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
    minHeight: 38,
    minWidth: 38,
  },
  colorSelected: {
    borderColor: colors.text,
  },
  segmented: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    flexDirection: "row",
    flexWrap: isSmallScreen ? "wrap" : "nowrap",
    gap: isSmallScreen ? 4 : 0,
    padding: 4,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: radius.sm,
    flexBasis: isSmallScreen ? "48%" : 0,
    flexGrow: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 10,
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
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
