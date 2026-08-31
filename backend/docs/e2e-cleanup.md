# RC1 / Release E2E cleanup

Release E2E fixtures are explicitly marked with `[E2E:<run-id>]` in the property title and `[E2E]` in its description. They must never be treated as real listings.

## Preview first

```bash
npm run cleanup:e2e
```

This only prints strict-marker candidates. It deletes nothing.

## Remove historical RC1 data

After reviewing the preview, include legacy `Release` and `Property E2E` markers:

```bash
npm run cleanup:e2e -- --include-legacy
```

## Apply cleanup

Deletion requires both an explicit CLI flag and exact confirmation value:

```bash
E2E_CLEANUP_CONFIRM=DELETE_RC1_DATA npm run cleanup:e2e -- --include-legacy --apply
```

The tool deletes only marked test properties and their linked test bookings, visits, leases, payments, invoices, conversations/messages, premium listings, memberships, test plans, and related notifications. It does not delete users, required plans, migrations, database volumes, or schema data.
