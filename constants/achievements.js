// The six badge groups (utils/gamification.js's createBadge `group` arg).
// Single source of truth for "which groups exist" - both
// components/progression/BadgeGroupGlyph.js (one dedicated glyph mark per
// group, composited onto BadgeFrame - Phase 8 badge/rank survey,
// Proposal A) and the logic smoke test (coverage check) key off this list.
// Superseded the old per-badge ACHIEVEMENT_ICON_MAP, which pointed every
// badge at a generic AppIcon glyph shared with the rest of the app
// (star/flame/check/trophy/analytics/progress) - nothing in the art
// reflected grouping, just individual badge-to-icon guesses.
export const ACHIEVEMENT_GROUPS = [
  "Getting started",
  "Consistency",
  "Daily volume",
  "Total completions",
  "Progress",
  "Ranks",
];

export function getRecentAchievementIconName(type) {
  if (type === "badge") {
    return "trophy";
  }

  if (type === "perfect-day") {
    return "star";
  }

  if (type === "theme") {
    return "rank";
  }

  if (type === "level") {
    return "progress";
  }

  return "analytics";
}
