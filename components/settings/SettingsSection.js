import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
} from "react-native";
import BottomNav from "../BottomNav";
import { AppIcon, BackIcon, IconButton, AppText } from "../ui";
import { useTheme } from "../../context/ThemeContext";
import {
  v2FontWeight,
  v2Layout,
  v2Radius,
  v2Shadows,
  v2Spacing,
  v2Typography,
} from "../../src/design";

export function SettingsScreen({
  backLabel = "Back to Settings",
  bottomNav = false,
  children,
  eyebrow = "Settings",
  onBack,
  scrollEnabled = true,
  scrollEventThrottle,
  scrollRef,
  onScroll,
  subtitle,
  title,
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const styles = createStyles(colors, { isSmallScreen, isTablet });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          bottomNav && styles.containerWithBottomNav,
        ]}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        ref={scrollRef}
        scrollEnabled={scrollEnabled}
        scrollEventThrottle={scrollEventThrottle}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeader
          backLabel={backLabel}
          eyebrow={eyebrow}
          onBack={onBack}
          subtitle={subtitle}
          title={title}
        />
        {children}
      </ScrollView>
      {bottomNav ? <BottomNav /> : null}
    </SafeAreaView>
  );
}

export function SettingsHeader({
  backLabel = "Back",
  eyebrow,
  onBack,
  subtitle,
  title,
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors, { isSmallScreen: false, isTablet: false });

  return (
    <View style={styles.header}>
      {onBack ? (
        <IconButton
          accessibilityLabel={backLabel}
          onPress={onBack}
          style={styles.backButton}
        >
          <BackIcon />
        </IconButton>
      ) : null}
      {eyebrow ? <AppText style={styles.eyebrow}>{eyebrow}</AppText> : null}
      <AppText style={styles.title}>{title}</AppText>
      {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
    </View>
  );
}

export function SettingsMessage({ tone = "info", children }) {
  const { colors } = useTheme();
  const styles = createStyles(colors, { isSmallScreen: false, isTablet: false });

  if (!children) {
    return null;
  }

  return (
    <AppText
      accessibilityRole="text"
      style={[
        styles.message,
        tone === "danger" && styles.messageDanger,
      ]}
    >
      {children}
    </AppText>
  );
}

export function SettingsSection({ children, footer, title }) {
  const { colors } = useTheme();
  const styles = createStyles(colors, { isSmallScreen: false, isTablet: false });

  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <View style={styles.group}>{children}</View>
      {footer ? <AppText style={styles.footer}>{footer}</AppText> : null}
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
  const styles = createStyles(colors, { isSmallScreen: false, isTablet: false });

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={{ disabled }}
      disabled={!onPress || disabled}
      hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        disabled && styles.disabled,
        pressed && onPress && styles.pressed,
      ]}
    >
      <View style={styles.rowText}>
        <AppText
          numberOfLines={2}
          style={[
            styles.rowTitle,
            destructive && styles.destructiveText,
            disabled && styles.disabledText,
          ]}
        >
          {title}
        </AppText>
        {description ? (
          <AppText numberOfLines={3} style={styles.rowDescription}>
            {description}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.trailingControl}>{right}</View> : null}
      {value ? (
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          numberOfLines={2}
          style={styles.value}
        >
          {value}
        </AppText>
      ) : null}
      {showChevron ? (
        <View style={styles.chevron}>
          <AppIcon
            color={colors.muted}
            name="chevron-right"
            size={18}
            strokeWidth={2}
          />
        </View>
      ) : null}
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
          accessibilityState={{ checked: Boolean(value), disabled }}
          disabled={disabled}
          ios_backgroundColor={colors.border}
          onValueChange={onValueChange}
          thumbColor={value ? colors.inverseText : colors.surface}
          trackColor={{ false: colors.border, true: colors.primary }}
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
  const styles = createStyles(colors, { isSmallScreen: false, isTablet: false });

  return (
    <Pressable
      accessibilityLabel={`${label} theme${selected ? ", selected" : ""}${disabled ? `, locked ${lockedText || ""}` : ""}`}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
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
        <AppText style={[styles.rowTitle, disabled && styles.disabledText]}>
          {label}
        </AppText>
        <AppText style={styles.rowDescription}>
          {disabled ? lockedText : selected ? "Selected" : "Available"}
        </AppText>
      </View>
      <View style={styles.selectedIconSlot}>
        {selected ? (
          <AppIcon
            color={colors.text}
            name="check"
            size={18}
            strokeWidth={2.2}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(colors, { isSmallScreen, isTablet }) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    container: {
      alignSelf: "center",
      maxWidth: isTablet ? v2Layout.formMaxWidth : "100%",
      padding: isSmallScreen
        ? v2Layout.screenPaddingCompact
        : v2Layout.screenPadding,
      paddingBottom: v2Spacing.xxl,
      width: "100%",
    },
    containerWithBottomNav: {
      paddingBottom: v2Layout.bottomNavigationClearance,
    },
    header: {
      paddingBottom: v2Spacing.lg,
      paddingTop: v2Spacing.sm,
    },
    backButton: {
      marginBottom: v2Spacing.lg,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      marginBottom: v2Spacing.xs,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: isSmallScreen ? 26 : v2Typography.screenTitle.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: isSmallScreen ? 32 : v2Typography.screenTitle.lineHeight,
    },
    subtitle: {
      color: colors.muted,
      fontSize: v2Typography.body.fontSize,
      lineHeight: v2Typography.body.lineHeight,
      marginTop: v2Spacing.sm,
    },
    message: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.border,
      borderRadius: v2Radius.small,
      borderWidth: 1,
      color: colors.text,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.medium,
      lineHeight: v2Typography.label.lineHeight,
      marginBottom: v2Spacing.lg,
      overflow: "hidden",
      paddingHorizontal: v2Spacing.md,
      paddingVertical: v2Spacing.sm,
    },
    messageDanger: {
      backgroundColor: colors.dangerSoft,
      color: colors.danger,
    },
    section: {
      gap: v2Spacing.sm,
      marginBottom: v2Spacing.xl,
    },
    sectionTitle: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.bold,
      letterSpacing: 0.5,
      paddingHorizontal: v2Spacing.xs,
      textTransform: "uppercase",
    },
    group: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: v2Radius.large,
      borderWidth: 1,
      overflow: "hidden",
      ...v2Shadows.low,
      shadowColor: colors.shadow,
      shadowOpacity: 0.07,
    },
    footer: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      lineHeight: v2Typography.caption.lineHeight,
      paddingHorizontal: v2Spacing.xs,
    },
    row: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 62,
      paddingHorizontal: v2Spacing.lg,
      paddingVertical: v2Spacing.md,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    trailingControl: {
      flexShrink: 0,
      minHeight: v2Layout.minTapTarget,
      justifyContent: "center",
    },
    rowTitle: {
      color: colors.text,
      fontSize: v2Typography.body.fontSize,
      fontWeight: v2FontWeight.bold,
      lineHeight: v2Typography.body.lineHeight,
    },
    rowDescription: {
      color: colors.muted,
      fontSize: v2Typography.caption.fontSize,
      fontWeight: v2FontWeight.regular,
      lineHeight: v2Typography.caption.lineHeight,
      marginTop: 3,
    },
    value: {
      color: colors.muted,
      flexShrink: 1,
      fontSize: v2Typography.label.fontSize,
      fontWeight: v2FontWeight.bold,
      maxWidth: "36%",
      minWidth: 0,
      textAlign: "right",
    },
    chevron: {
      alignItems: "center",
      flexShrink: 0,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    selectedIconSlot: {
      alignItems: "center",
      flexShrink: 0,
      height: 24,
      justifyContent: "center",
      width: 24,
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
      backgroundColor: colors.surface,
      opacity: 0.9,
    },
    themeRow: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: v2Spacing.md,
      minHeight: 72,
      paddingHorizontal: v2Spacing.lg,
      paddingVertical: v2Spacing.md,
    },
    themeSelected: {
      backgroundColor: colors.surface,
    },
    swatches: {
      flexDirection: "row",
      flexShrink: 0,
      gap: v2Spacing.xs,
    },
    swatch: {
      borderColor: colors.border,
      borderRadius: v2Radius.pill,
      borderWidth: 1,
      height: 18,
      width: 18,
    },
  });
}
