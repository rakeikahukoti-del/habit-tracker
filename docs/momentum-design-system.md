# Momentum Design System

Momentum uses the V2 design tokens in `src/design` and the shared UI primitives in `components/ui`. Prefer those primitives before creating screen-local variants.

## Typography

- `display`: rare, brand or hero moments only.
- `screenTitle`: screen headers and modal titles.
- `largeMetric`: primary numbers and progress metrics.
- `sectionTitle`: section headers.
- `cardTitle`: habit names and card titles.
- `body`: readable primary body copy.
- `bodySupporting`: secondary descriptions.
- `label`: metadata, chips, compact controls.
- `button`: all primary and secondary button labels.
- `caption`: helper text, timestamps, legal footnotes.
- `navigationLabel`: bottom navigation labels only.

Keep text concise, allow wrapping for user-generated values, and avoid fixed heights around long copy.

## Color

Use theme values from `ThemeContext` for app surfaces:

- `colors.background`: screen background.
- `colors.card`: cards, forms, grouped rows.
- `colors.surface`: secondary surfaces and selected rows.
- `colors.text`: primary text and active navigation.
- `colors.muted`: secondary text.
- `colors.softText`: disabled and low-priority text.
- `colors.primary`: primary actions and key accents.
- `colors.accent`: reward, completion, and rank accents.
- `colors.border`: dividers and neutral borders.
- `colors.danger`: destructive actions.

Avoid hardcoded colors except for fixed semantic gesture surfaces, supplied artwork, or one-off transparent overlays.

## Spacing

Use `v2Spacing` for component spacing:

- `xs` and `sm`: icon/text gaps, captions, compact chips.
- `md` and `base`: row and card internal spacing.
- `lg` and `xl`: section spacing and prominent controls.
- `xxl` and above: empty states, modal rhythm, large feature blocks.

Use `v2Layout.screenPadding` and `v2Layout.screenPaddingCompact` for page edges. Keep bottom content clear of `v2Layout.bottomNavigationClearance`.

## Radius and Cards

- `v2Radius.medium`: compact controls, chips, inputs inside grouped surfaces.
- `v2Radius.large`: cards, primary buttons, grouped settings rows.
- `v2Radius.feature`: large reward and modal cards.
- `v2Radius.pill`: progress bars, badges, small status pills.

Cards should use `colors.card`, `colors.border`, and `v2Shadows.low` by default. Use stronger borders or medium shadows only for active, completed, dragged, or reward states.

## Buttons

Use:

- `PrimaryButton` for the main action.
- `SecondaryButton` for neutral alternatives.
- `IconButton` for icon-only navigation or compact actions.
- `PressableScale` for custom pressable components that still need consistent feedback.

Buttons should be at least `v2Layout.minTapTarget` high, include accessibility labels for icon-only actions, and expose disabled/loading state.

## Motion

Use `v2Motion` for timing and scale:

- Keep button/card press feedback subtle.
- Use fast transitions for routine UI.
- Use emphasis timing for reward popups only.
- Stop animations on unmount when using `Animated.Value`.

Avoid flashy or long-running animations that compete with habit completion.

## Haptics

Haptics should be brief and optional:

- Selection haptic: navigation, toggles, swipe threshold, reorder start.
- Success haptic: habit completion, reward unlock.
- Warning haptic: destructive confirmation only.

Always catch haptic failures so the app still works on unsupported devices.

## Accessibility

Reusable components should provide:

- `accessibilityRole` for buttons, tabs, switches, and modals.
- `accessibilityState` for selected, disabled, checked, expanded, and busy states.
- Clear labels for icon-only controls.
- Color-independent state cues, such as borders, text, icons, or position.
- Touch targets of at least 44px.

User-generated text should support wrapping and avoid horizontal overflow.

## Component Philosophy

Keep primitives small and predictable. Add a shared abstraction only when the same visual and interaction pattern appears repeatedly. Screen-specific components can exist when they reflect a unique workflow, but they should still consume the same tokens.
