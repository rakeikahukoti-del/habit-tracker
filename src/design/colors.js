export const v2Colors = {
  background: "#0E0E10",
  backgroundElevated: "#161618",
  surface: "#1C1C1E",
  surfaceElevated: "#242426",
  surfacePressed: "#2C2C2E",

  borderSubtle: "#28282A",
  borderDefault: "#333335",
  borderStrong: "#45454A",

  textPrimary: "#F5F5F4",
  textSecondary: "#B9B9BB",
  textMuted: "#8B8B8F",
  textDisabled: "#5E5E62",

  accentPrimary: "#EDEDEC",
  accentContrast: "#0E0E10",

  success: "#8EA79A",
  warning: "#D1A557",
  danger: "#C97070",
  informational: "#64748B",
  focus: "#8B5CF6",
  disabled: "#5E5E62",

  overlay: "rgba(0, 0, 0, 0.68)",
  transparent: "transparent",
};

export const v2LightColors = {
  background: "#F6F6F6",
  backgroundElevated: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceElevated: "#FCFCFC",
  surfacePressed: "#ECECEC",

  borderSubtle: "#E8E8E8",
  borderDefault: "#DDDDDD",
  borderStrong: "#C6C6C8",

  textPrimary: "#17171A",
  textSecondary: "#4B4B4F",
  textMuted: "#7A7A7E",
  textDisabled: "#B2B2B5",

  accentPrimary: "#17171A",
  accentContrast: "#FFFFFF",

  success: "#5F8B6F",
  warning: "#C58A2B",
  danger: "#B5484C",
  informational: "#64748B",
  focus: "#8B5CF6",
  disabled: "#B2B2B5",

  overlay: "rgba(15, 23, 42, 0.35)",
  transparent: "transparent",
};

export const v2ActionColors = {
  complete: "#4F755B",
  completeIcon: v2Colors.accentContrast,
  completeText: v2Colors.textPrimary,
  undo: "#85494D",
  undoIcon: v2Colors.accentContrast,
  undoText: v2Colors.textPrimary,
};

export const v2BadgeColors = {
  common: "#555555",
  rare: "#A7ACB2",
  epic: "#A98A52",
  legendary: "#C2A86B",
  mythic: "#D8D8D8",
  locked: "#303030",
};

export const v2StateColors = {
  complete: v2Colors.success,
  incomplete: v2Colors.textMuted,
  disabled: v2Colors.textDisabled,
  destructive: v2Colors.danger,
  selected: v2Colors.accentPrimary,
};
