import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import {
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  spacing,
} from "../../constants/typography";
import { useTheme } from "../../context/ThemeContext";

export function SettingsSection({ children, footer, title }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

export function SettingsRow({
  accessibilityLabel,
  description,
  disabled = false,
  destructive = false,
  onPress,
  right,
  showChevron = Boolean(onPress),
  title,
  value,
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={{ disabled }}
      disabled={!onPress || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        disabled && styles.disabled,
        pressed && onPress && styles.pressed,
      ]}
    >
      <View style={styles.rowText}>
        <Text
          numberOfLines={2}
          style={[
            styles.rowTitle,
            destructive && styles.destructiveText,
            disabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
        {description ? (
          <Text numberOfLines={3} style={styles.rowDescription}>
            {description}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.trailingControl}>{right}</View> : null}
      {value ? (
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          numberOfLines={2}
          style={styles.value}
        >
          {value}
        </Text>
      ) : null}
      {showChevron ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

export function SettingsToggleRow({
  description,
  disabled = false,
  onValueChange,
  title,
  value,
}) {
  const { colors } = useTheme();

  return (
    <SettingsRow
      accessibilityLabel={`${title}, ${value ? "on" : "off"}`}
      description={description}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      right={
        <Switch
          accessibilityLabel={title}
          accessibilityRole="switch"
          accessibilityState={{ checked: value, disabled }}
          disabled={disabled}
          ios_backgroundColor={colors.border}
          onValueChange={onValueChange}
          thumbColor={value ? colors.primary : colors.surface}
          trackColor={{ false: colors.border, true: colors.primarySoft }}
          value={Boolean(value)}
        />
      }
      showChevron={false}
      title={title}
    />
  );
}

export function ThemePreviewRow({
  disabled = false,
  label,
  lockedText,
  onPress,
  previewColors,
  selected = false,
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityLabel={`${label} theme${selected ? ", selected" : ""}${disabled ? `, locked ${lockedText || ""}` : ""}`}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.themeRow,
        selected && styles.themeSelected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.swatches}>
        <View
          style={[
            styles.swatch,
            { backgroundColor: previewColors.background },
          ]}
        />
        <View
          style={[
            styles.swatch,
            { backgroundColor: previewColors.card || previewColors.surface },
          ]}
        />
        <View
          style={[styles.swatch, { backgroundColor: previewColors.primary }]}
        />
        <View
          style={[styles.swatch, { backgroundColor: previewColors.accent }]}
        />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, disabled && styles.disabledText]}>
          {label}
        </Text>
        <Text style={styles.rowDescription}>
          {disabled ? lockedText : selected ? "Selected" : "Available"}
        </Text>
      </View>
      <Text style={selected ? styles.selectedMark : styles.chevron}>
        {selected ? "✓" : ""}
      </Text>
    </Pressable>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    section: {
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
      letterSpacing: 0.5,
      paddingHorizontal: spacing.xs,
      textTransform: "uppercase",
    },
    group: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      overflow: "hidden",
    },
    footer: {
      color: colors.muted,
      fontSize: fontSize.caption,
      lineHeight: lineHeight.caption,
      paddingHorizontal: spacing.xs,
    },
    row: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 56,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    trailingControl: {
      flexShrink: 0,
    },
    rowTitle: {
      color: colors.text,
      fontSize: fontSize.bodyLarge,
      fontWeight: fontWeight.bold,
      lineHeight: lineHeight.bodyLarge,
    },
    rowDescription: {
      color: colors.muted,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.caption,
      marginTop: 3,
    },
    value: {
      color: colors.muted,
      flexShrink: 1,
      fontSize: fontSize.label,
      fontWeight: fontWeight.bold,
      maxWidth: "36%",
      minWidth: 0,
      textAlign: "right",
    },
    chevron: {
      color: colors.muted,
      flexShrink: 0,
      fontSize: 22,
      fontWeight: fontWeight.bold,
      lineHeight: 22,
    },
    selectedMark: {
      color: colors.primary,
      fontSize: fontSize.section,
      fontWeight: fontWeight.bold,
    },
    destructiveText: {
      color: colors.danger,
    },
    disabled: {
      opacity: 0.54,
    },
    disabledText: {
      color: colors.softText,
    },
    pressed: {
      opacity: 0.76,
    },
    themeRow: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 68,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    themeSelected: {
      backgroundColor: colors.surface,
    },
    swatches: {
      flexDirection: "row",
      flexShrink: 0,
      gap: 4,
    },
    swatch: {
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 18,
      width: 18,
    },
  });
}
