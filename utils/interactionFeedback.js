export function isSwipeCompletionSource(source) {
  return source === "swipe" || source === "swipe-undo";
}

export function shouldRunInitialCompletionHaptic(source, preferences = {}) {
  return (
    Boolean(preferences?.enableRewardHaptics) && !isSwipeCompletionSource(source)
  );
}
