# Momentum Templates and Routines

Momentum templates and routines are starting points for normal habits. They do
not create a separate habit system.

## Template Model

Built-in templates live in code in `utils/habitTemplates.js`. A template may
define name, category, emoji, colour, frequency, custom days, optional reminder
fields, description, group, and order.

Templates never contain:

- persisted habit IDs
- creation dates
- completion history
- streaks
- XP, rank, badge, or achievement state

Applying a template only fills the Add Habit form. The user can review and edit
every field before saving.

## Built-In Catalogue

The built-in catalogue is grouped into:

- Morning
- Health
- Focus
- Evening
- Personal

Template IDs are stable and deterministic.

## Routines

Routines are small groups of templates. Built-in routines include:

- Morning Reset
- Study Session
- Evening Reset
- Training Day

Creating a routine creates separate normal habits using the existing habit data
shape. Each habit receives a unique ID, one shared creation timestamp for that
routine creation, and no completion history.

## Conversion Rules

`createHabitDraftFromTemplate` returns a safe form draft. It normalises category,
colour, frequency, custom days, emoji, and reminder values, and clones arrays so
templates cannot be mutated from the form.

`createRoutineHabitsFromSelection` converts selected routine template IDs into
habit drafts and removes duplicate selected template IDs.

## Duplicate Warnings

Duplicate checks compare:

- trimmed lowercase habit name
- frequency
- custom days in stable weekday order

Duplicates warn but do not block creation. Existing habits are never merged or
modified.

## Custom Templates

Custom templates were not added in this phase. No new custom-template storage key
exists, and import/export behavior is unchanged.

## Import and Export

Habit import/export remains habit-only. Built-in templates and routines are
code-defined and are not exported. Older exports continue to import through the
existing habit backup path.

## Accessibility

Template cards are accessible buttons. Routine habit rows are accessible
checkboxes with checked state. Duplicate warnings use alert semantics, and modal
controls use existing theme-aware touch targets.

## Independence

Habits created from templates or routines are independent. Editing a habit never
updates a template, and changing template code never updates existing habits.
