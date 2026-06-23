export const fontSize = {
  display: 34,
  pageTitle: 30,
  pageTitleSmall: 27,
  section: 18,
  cardTitle: 16,
  body: 14,
  bodyLarge: 15,
  label: 13,
  caption: 12,
  tiny: 11,
};

export const lineHeight = {
  pageTitle: 36,
  pageTitleSmall: 32,
  body: 20,
  bodyLarge: 22,
  caption: 17,
};

export const fontWeight = {
  regular: "700",
  medium: "800",
  bold: "900",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 24,
};

export const radius = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 24,
  round: 999,
};

export const layout = {
  screenPadding: 18,
  screenPaddingSmall: 14,
  screenBottomPadding: 28,
  maxContentWidth: 820,
  formMaxWidth: 760,
  minTapTarget: 44,
};

export function pageTitleSize(isSmallScreen) {
  return isSmallScreen ? fontSize.pageTitleSmall : fontSize.pageTitle;
}

export function pageTitleLineHeight(isSmallScreen) {
  return isSmallScreen ? lineHeight.pageTitleSmall : lineHeight.pageTitle;
}
