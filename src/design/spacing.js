export const v2Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  display: 48,
};

// Padding values that fall between v2Spacing's steps (10 sits between sm/md,
// 14 between md/base, 18 between base/lg). Used by the small dismissible
// cards, pill badges, and reward cards - error banners, ReturnExperienceCard,
// SwipeHintCard, CompletionRewardCard, BadgeUnlockCard, and similar - that
// predate v2Spacing and previously reimplemented these as raw numbers at 20+
// call sites. Kept as a separate export rather than interleaved into
// v2Spacing so that scale stays a clean progression.
export const v2CompactSpacing = {
  sm: 10,
  md: 14,
  lg: 18,
};
