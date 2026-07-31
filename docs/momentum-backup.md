# Momentum Backup and Restore

Momentum backup is local-only. It does not use cloud sync, accounts, network requests, or external storage providers.

## Backup Schema

Backups are human-readable JSON:

```json
{
  "app": "Momentum",
  "schemaVersion": 1,
  "version": 1,
  "appVersion": "1.0.0",
  "exportedAt": "2026-07-30T00:00:00.000Z",
  "exportedData": {
    "appearance": {},
    "dailyPlan": {},
    "flags": {},
    "gamification": {},
    "habits": [],
    "preferences": {},
    "recovery": {}
  },
  "data": {
    "appearance": {},
    "dailyPlan": {},
    "flags": {},
    "gamification": {},
    "habits": [],
    "preferences": {},
    "recovery": {}
  }
}
```

`schemaVersion` and `exportedData` are the preferred schema fields. `version`
and `data` remain in the export for existing Momentum backups and older import
paths. Unknown fields are ignored safely. Older habit-only backups remain
importable.

## Storage Keys

The canonical storage manifest lives in `storage/appBackup.js` as `STORAGE_KEY_MANIFEST`.

It documents:

- key
- purpose
- owner
- version
- dependencies

The current app data includes habits, gamification, app preferences, onboarding
flags, appearance preference, the daily plan, and a recovery copy for unreadable
habit JSON when one exists.

Activity history, analytics, templates, routines, Focus Mode, and long-term
insights are derived from habit completion history or built-in definitions. They
do not currently have separate AsyncStorage keys.

## Export Flow

`exportAppData()` reads the current local data once, normalizes supported sections, and returns formatted JSON.

Export includes:

- habits and completion history
- app preferences
- appearance preference
- gamification snapshot
- daily plan
- onboarding and guidance flags
- unreadable habit recovery data when present
- export metadata

Derived analytics and activity history are not stored separately. They are rebuilt from habit history.

## Import Flow

Momentum uses a Replace import flow.

1. Parse JSON.
2. Migrate older backup versions if needed.
3. Validate and normalize each section.
4. Show an import preview in Settings.
5. Build the full replacement storage set in memory.
6. On confirmation, write the replacement set with one AsyncStorage `multiSet`.
7. Rebuild gamification from imported habit history.
8. Reconcile local reminders through the existing notification path.

Existing data is not overwritten if parsing, validation, normalization, or the
main storage commit fails.

## Validation Rules

Validation repairs safe issues:

- duplicate habit IDs
- invalid habit names
- invalid dates
- invalid custom days
- invalid reminder times
- unsupported reminder status
- unsupported theme values
- missing preferences
- invalid daily plan entries
- stale notification IDs from imported habits

Validation rejects unrecoverable issues:

- empty JSON
- malformed JSON
- unsupported future backup version
- backup without a usable data object or habit array
- non-array habits section
- backups containing only invalid habit entries

Duplicate habit IDs are repaired before import. Imported notification IDs are
discarded because notification identifiers are device-local; reminders are
reconciled after the data commit.

## Migration Pipeline

`migrateBackup()` is sequential and idempotent. Version 1 is current. A minimal
version 0 migration exists for older habit-only backup objects that stored
`habits` at the root.

Future migrations should be added as:

```js
const migrations = {
  1: migrateV1ToV2
};
```

Each migration should return a full backup object with the next version number.

## Recovery Strategy

Recoverable data is normalized and a warning is exposed to the user.

Unrecoverable data aborts import before any local data is replaced.

Replace imports intentionally avoid Merge behavior. Merge can be added later, but it must never overwrite existing IDs silently.

The import path is intentionally all-or-nothing for persisted app data. It does
not call screen-level save helpers during the main commit because those helpers
can write one section at a time. Notification reconciliation is allowed to run
after the data commit because reminders are external device state and can be
repaired from stored habit data.

## Accessibility

The Settings import preview summarizes:

- whether the backup is valid
- habit count
- activity history count
- routine count
- template count
- export date
- preferences availability
- activity history availability
- first error or warning

The final Replace action remains disabled until the pasted backup validates.
