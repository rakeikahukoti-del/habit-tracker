# Momentum Backup and Restore

Momentum backup is local-only. It does not use cloud sync, accounts, network requests, or external storage providers.

## Backup Schema

Backups are human-readable JSON:

```json
{
  "app": "Momentum",
  "version": 1,
  "appVersion": "1.0.0",
  "exportedAt": "2026-07-30T00:00:00.000Z",
  "data": {
    "appearance": {},
    "dailyPlan": {},
    "flags": {},
    "gamification": {},
    "habits": [],
    "preferences": {}
  }
}
```

Unknown fields are ignored safely. Older habit-only backups remain importable.

## Storage Keys

The canonical storage manifest lives in `storage/appBackup.js` as `STORAGE_KEY_MANIFEST`.

It documents:

- key
- purpose
- owner
- version
- dependencies

The current app data includes habits, gamification, app preferences, onboarding flags, appearance preference, and the daily plan.

## Export Flow

`exportAppData()` reads the current local data once, normalizes supported sections, and returns formatted JSON.

Export includes:

- habits and completion history
- app preferences
- appearance preference
- gamification snapshot
- daily plan
- onboarding and guidance flags
- export metadata

Derived analytics and activity history are not stored separately. They are rebuilt from habit history.

## Import Flow

Momentum uses a Replace import flow.

1. Parse JSON.
2. Migrate older backup versions if needed.
3. Validate and normalize each section.
4. Show an import preview in Settings.
5. On confirmation, replace local app data.
6. Rebuild gamification from imported habits.
7. Reconcile local reminders through the existing notification path.

Existing data is not overwritten if parsing or validation fails.

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

Validation rejects unrecoverable issues:

- empty JSON
- malformed JSON
- unsupported future backup version
- backup without a usable data object or habit array
- non-array habits section
- backups containing only invalid habit entries

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

## Accessibility

The Settings import preview summarizes:

- whether the backup is valid
- habit count
- export date
- preferences availability
- activity history availability
- first error or warning

The final Replace action remains disabled until the pasted backup validates.
