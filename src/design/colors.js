export const v2Colors = {
  background: "#0D0D0D",
  backgroundElevated: "#111111",
  surface: "#151515",
  surfaceElevated: "#1A1A1A",
  surfacePressed: "#202020",

  borderSubtle: "#222222",
  borderDefault: "#2B2B2B",
  borderStrong: "#3A3A3A",

  textPrimary: "#F3F3F3",
  textSecondary: "#A3A3A3",
  textMuted: "#6F6F6F",
  textDisabled: "#4F4F4F",

  accentPrimary: "#E6E6E6",
  accentContrast: "#111111",

  success: "#BFC8BF",
  warning: "#C8BFA8",
  danger: "#C7A5A5",

  overlay: "rgba(0, 0, 0, 0.68)",
  transparent: "transparent",
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
