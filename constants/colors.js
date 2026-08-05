import {
  v2LegacyDarkTheme,
  v2LegacyLightTheme,
} from "../src/design/legacyThemeAdapter";

export const themes = {
  light: v2LegacyLightTheme,
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
