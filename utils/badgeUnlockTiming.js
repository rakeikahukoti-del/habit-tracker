import { v2Motion } from "../src/design";

// Single source of truth for badge-unlock tier timing, shared by
// BadgeUnlockCard.js (the glow animation) and useHomeController.js (the
// auto-dismiss timer) - Phase 9 accessibility re-audit fix #5. Before this,
// the dismiss timer in useHomeController.js was a flat 4200ms unrelated to
// this tier logic, already out of sync with Diamond/Master's longer glow
// (Phase 8 survey, Proposal A). Extracting it here means the two consumers
// can't drift apart again.
const LINGERING_GLOW_TIERS = new Set(["Diamond", "Master"]);
const LINGERING_GLOW_EXTRA_MS = 500;

// Fixed reading-time margin stacked on top of the glow duration before the
// badge-unlock card auto-dismisses - enough to read the badge label, tier,
// and one-line description aloud. Chosen so the previous flat 4200ms is
// preserved unchanged for the five tiers that use the baseline glow
// duration (300ms + 3900ms = 4200ms); Diamond/Master now correctly get the
// same +500ms extension their glow animation already had.
const READING_TIME_MARGIN_MS = 3900;

export function getBadgeGlowDuration(tier) {
  return LINGERING_GLOW_TIERS.has(tier)
    ? v2Motion.duration.emphasis + LINGERING_GLOW_EXTRA_MS
    : v2Motion.duration.emphasis;
}

export function getBadgeUnlockDismissDelay(tier) {
  return getBadgeGlowDuration(tier) + READING_TIME_MARGIN_MS;
}
