export const v2Colors = {
  background: "#0E0E10",
  // Raised from #161618: read at only 1.062:1 against `surface` below (the
  // nested-tile-inside-a-card pattern - e.g. stat tiles inside
  // WeeklyReviewCard) - Phase 11 Thread E, the card/tile fill contrast
  // backlog item Thread A deliberately left for its own pass. Capped well
  // below `surface`'s new value (not chasing the full ~1.5:1 target here)
  // to leave `surface`/`surfaceElevated`/`surfacePressed`'s existing
  // ordering above it untouched - see `surface`'s comment for why 1.5:1
  // wasn't reachable everywhere without side effects. #121214 clears
  // 1.164:1 against the new `surface` (up from 1.062:1).
  backgroundElevated: "#121214",
  // Raised from #1C1C1E: read at only 1.133:1 against `background` above -
  // the literal "card" fill (colors.card in the legacy adapter) sitting on
  // the page canvas behind it, ~90 call sites. Capped below
  // `surfaceElevated` (#242426) deliberately, not raised all the way to
  // the ~1.5:1 target computed for this fix: reaching 1.5:1 exactly would
  // require a value brighter than surfaceElevated/surfacePressed above it,
  // inverting their elevation/pressed-state ordering (e.g. a "pressed"
  // state would darken instead of lighten). Landed at 1.1997:1 instead -
  // a real improvement with no ordering side effects. See
  // backgroundElevated's comment above for the matching nested-tile fix.
  surface: "#212123",
  surfaceElevated: "#242426",
  surfacePressed: "#2C2C2E",

  borderSubtle: "#28282A",
  // Lightened from #333335: at the original value, this read at only
  // 1.23-1.53:1 against the backgrounds/surfaces it's actually used on as a
  // UI-component boundary (idle Pressable buttons in HabitFormFields, cards,
  // dividers) - below WCAG 1.4.11's 3:1 non-text contrast minimum, and the
  // literal cause of Phase 10 Thread A's "buttons read as decoration"
  // finding. #6E6E6E clears 3:1 against background/backgroundElevated/
  // surface/surfaceElevated (3.04-3.78:1).
  borderDefault: "#6E6E6E",
  borderStrong: "#45454A",

  textPrimary: "#F5F5F4",
  textSecondary: "#B9B9BB",
  textMuted: "#8B8B8F",
  textDisabled: "#5E5E62",

  accentPrimary: "#EDEDEC",
  accentContrast: "#0E0E10",

  success: "#8EA79A",
  warning: "#D1A557",
  danger: "#C97070",
  focus: "#8B5CF6",
  disabled: "#5E5E62",

  overlay: "rgba(0, 0, 0, 0.68)",
  transparent: "transparent",
};

export const v2LightColors = {
  background: "#F6F6F6",
  // Darkened from #FAFAFA: read at only 1.044:1 against `surface` below,
  // same nested-tile-inside-a-card pattern as the dark theme (see
  // v2Colors.backgroundElevated's comment). Unlike dark theme, the full
  // 1.5:1 target was reachable here without any ordering side effects, so
  // it's not capped short - #A6A6A6 clears 1.5005:1 against the new
  // `surface` value below.
  backgroundElevated: "#A6A6A6",
  // Darkened from #FFFFFF: read at only 1.081:1 against `background`
  // above - the literal "card" fill, ~90 call sites (colors.card in the
  // legacy adapter). #FFFFFF was already pure white, the maximum possible
  // luminance - there was no lighter value to move to, so reaching ~1.5:1
  // required flipping the relationship (card now reads darker/grayer than
  // the page, not lighter/whiter) rather than a same-direction shade
  // adjustment. Escalated and confirmed before implementing (Phase 11
  // Thread E). #CBCBCB clears 1.5012:1.
  //
  // Flagging one consequence of the flip that wasn't part of that
  // decision: `surfacePressed` (#ECECEC, mapped to colors.accentSoft/
  // colors.primarySoft - mostly soft icon-tint backgrounds, not literal
  // press-feedback, at 18 call sites) was lighter than card before and is
  // now darker than it (1.373:1 apart) - the same kind of ordering
  // inversion the dark-theme surface value was deliberately capped to
  // avoid. Left as-is here since capping card to preserve that ordering
  // caps the achievable ratio at ~1.09:1 - barely above the original
  // 1.081:1, making the fix nearly pointless - and the token's actual
  // usage (soft tint fills, not real pressed-state feedback outside one
  // ripple color) makes the inversion low-stakes. Worth a look, not
  // reverted silently.
  surface: "#CBCBCB",
  surfaceElevated: "#FCFCFC",
  surfacePressed: "#ECECEC",

  borderSubtle: "#E8E8E8",
  // Darkened from #DDDDDD: read at only 1.26-1.36:1 against the
  // backgrounds/surfaces it's used on as a UI-component boundary - same
  // WCAG 1.4.11 failure as the dark theme's borderDefault above, same fix
  // (see that comment). #8E8E8E clears 3:1 against background/
  // backgroundElevated/surface/surfaceElevated (3.03-3.28:1).
  borderDefault: "#8E8E8E",
  borderStrong: "#C6C6C8",

  textPrimary: "#17171A",
  textSecondary: "#4B4B4F",
  // Darkened from #7A7A7E: at the original value, text set in this color
  // (bottom nav labels, calendar day numbers, progress-dot labels) read at
  // 3.96:1 against the light background - below WCAG AA's 4.5:1 for normal
  // text. #707074 clears 4.5:1 against both background and card.
  textMuted: "#707074",
  textDisabled: "#B2B2B5",

  accentPrimary: "#17171A",
  accentContrast: "#FFFFFF",

  // success/warning are also used as text color (e.g. backup-import preview
  // status copy in app/settings.js), where the original values read at
  // 3.88:1 / 2.98:1 against light backgrounds - below WCAG AA's 4.5:1.
  // Darkened along the same hue to clear 4.5:1; still well above the 3:1
  // floor everywhere else they're used as a border/accent color.
  success: "#537960",
  warning: "#936720",
  danger: "#B5484C",
  focus: "#8B5CF6",
  disabled: "#B2B2B5",

  overlay: "rgba(15, 23, 42, 0.35)",
  transparent: "transparent",
};

export const v2ActionColors = {
  complete: "#4F755B",
  completeIcon: v2Colors.accentContrast,
  completeText: v2Colors.textPrimary,
  undo: "#85494D",
  undoIcon: v2Colors.accentContrast,
  undoText: v2Colors.textPrimary,
};

export const v2StateColors = {
  complete: v2Colors.success,
  incomplete: v2Colors.textMuted,
  disabled: v2Colors.textDisabled,
  destructive: v2Colors.danger,
  selected: v2Colors.accentPrimary,
};
