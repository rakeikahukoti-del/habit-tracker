// Shared pressed-state style constants used by Pressable components across
// the app (home, add, rank, stats, analytics screens). Kept as plain style
// objects rather than PressableScale variants because many call sites apply
// them conditionally alongside other pressed-state logic (e.g. disabling the
// effect while a save is in flight).
export const v2PressedStyles = {
  button: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  card: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  stats: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },
};
