import { v2LegacyDarkTheme } from "../src/design/legacyThemeAdapter";

const shared = {
  primary: "#64748B",
  primaryDark: "#3C4048",
  accent: "#3B82F6",
  success: "#5F8B6F",
  warning: "#C58A2B",
  danger: "#B5484C",
};

export const themes = {
  light: {
    ...shared,
    background: "#F4F4F2",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    text: "#1A1D22",
    muted: "#64748B",
    softText: "#87909C",
    border: "#DADDE2",
    habitCardBorder: "#D0D5DC",
    habitCardCompletedBorder: "#64748B",
    badgeBackground: "#ECEEF1",
    badgeText: "#2A2D33",
    primarySoft: "#E6E9EE",
    accentSoft: "#E3ECF8",
    successSoft: "#DFF2E8",
    dangerSoft: "#F6E1E2",
    input: "#FFFFFF",
    inputBackground: "#F9FAFD",
    dotEmpty: "#D8DDE8",
    shadow: "#111827",
    inverseText: "#FFFFFF",
    heroMuted: "#CDD5EF",
    heroSoftText: "#E4E9F7",
    heroBadge: "rgba(255, 255, 255, 0.16)",
    modalBackdrop: "rgba(15, 23, 42, 0.35)",
    swatchBorder: "#FFFFFF",
  },
  dark: v2LegacyDarkTheme,
};

export const badgeTierColors = {
  Bronze: {
    background: "#E6D2BE",
    border: "#A9794D",
    text: "#352416",
    iconBackground: "#F4E8DA",
  },
  Silver: {
    background: "#DCE2EA",
    border: "#9DA8B7",
    text: "#1F2937",
    iconBackground: "#F2F5F8",
  },
  Gold: {
    background: "#E8D7A7",
    border: "#BFA05A",
    text: "#332813",
    iconBackground: "#F6EDCE",
  },
  Platinum: {
    background: "#D7E2E9",
    border: "#A8C5D6",
    text: "#14263A",
    iconBackground: "#EDF4F7",
  },
  Diamond: {
    background: "#D1E8ED",
    border: "#67B7C5",
    text: "#0F283F",
    iconBackground: "#E9F6F8",
  },
  Master: {
    background: "#E8CED2",
    border: "#96313A",
    text: "#32141A",
    iconBackground: "#F4E4E7",
  },
};

export const rarityColors = {
  Common: {
    background: "#EEF2F6",
    text: "#334155",
  },
  Rare: {
    background: "#DDE9F2",
    text: "#27536B",
  },
  Epic: {
    background: "#E7E0EF",
    text: "#58406F",
  },
  Legendary: {
    background: "#F0DFCB",
    text: "#76502A",
  },
};

export const colors = themes.light;
