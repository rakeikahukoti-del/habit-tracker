export const v2Colors = {
  background: "#0F1115",
  backgroundElevated: "#15181D",
  surface: "#1A1D22",
  surfaceElevated: "#20242A",
  surfacePressed: "#2A2D33",

  borderSubtle: "#252930",
  borderDefault: "#2F343C",
  borderStrong: "#3C4048",

  textPrimary: "#F4F4F2",
  textSecondary: "#B7BDC6",
  textMuted: "#87909C",
  textDisabled: "#5E6670",

  accentPrimary: "#E6E6E6",
  accentContrast: "#0F1115",

  success: "#8EA79A",
  warning: "#D1A557",
  danger: "#C97070",
  informational: "#64748B",
  focus: "#8B5CF6",
  disabled: "#5E6670",

  overlay: "rgba(0, 0, 0, 0.68)",
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
