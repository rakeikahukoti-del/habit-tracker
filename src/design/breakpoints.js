// Single source of truth for the two `useWindowDimensions().width` checks
// reimplemented ad hoc across screens/components: an SE-class "small
// screen" compact treatment, and a "tablet" treatment (cap content width,
// center it) applied by the shared screen scaffolds (HabitFormScreen,
// SettingsScreen, GamificationScreen, AnalyticsScreen) plus Home and
// onboarding.
//
// Usage: `width < v2Breakpoints.smallScreenMaxWidth`,
// `width >= v2Breakpoints.tabletMinWidth`.
export const v2Breakpoints = {
  smallScreenMaxWidth: 380,
  tabletMinWidth: 768,
};
