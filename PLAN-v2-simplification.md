# PLAN: Provider Form v2 Simplification

Per Lane/Amanda call (May 3): strip the form to its minimum viable footprint.
Three fields only — provider email, total clients accepting, special considerations.
No per-type quantities, no calendar drag UI, no modality.

## Files touched

### Modified
- `src/lib/types.ts` — schema/types rewrite
- `src/components/ProviderForm.tsx` — full rewrite of form body (Card structure preserved)
- `src/components/SuccessScreen.tsx` — drop per-type breakdown + scheduling windows; add acceptingClients summary + special considerations display
- `src/App.tsx` — drop `AvailabilityWeek` import; replace `SubmittedSummary` with v2 shape
- `src/lib/api.ts` — type-only changes (still POSTs to `/api/provider-availability`); drop the now-unused tolerance for old payload fields
- `README.md` — update "Endpoint contract" section + "What's intentionally not built" copy

### Added
- `src/components/ui/textarea.tsx` — shadcn-style Textarea component, matching `Input`'s look-and-feel (used for special considerations)

### Deleted
- `src/components/AvailabilityGrid.tsx` — calendar drag UI
- `src/lib/availability.ts` — selection→week transform, slot helpers
- `src/lib/availability.test.ts` — unit tests for the transform (no longer load-bearing)

## Fields removed from form state, types, schema, payload, success view

- `acceptingIndividual` (number)
- `acceptingCouples` (number)
- `acceptingFamily` (number)
- `availability` (`AvailabilityWeek | null`) — and the entire `selection: Set<string>` UI state that backed it
- All availability-related types: `AvailabilityBlock`, `AvailabilityWeek`, `WeekdayKey`, `WEEKDAYS`, `availabilityBlockSchema`, `availabilityWeekSchema`

Modality field: **not currently in the form**, so nothing to remove. (Confirmed by grep — no `modality` references exist.)

## Fields added

| field | type | validation | UI |
|---|---|---|---|
| `email` | `string` | trimmed, required, RFC email format (Zod `.email()`) | text input, type=email, autoComplete=email |
| `acceptingClients` | `number` | integer, min 0, max 50 | number input, inputMode=numeric, min=0 step=1 |
| `specialConsiderations` | `string` (optional) | optional, max 500 chars after trim | multiline textarea with live `N / 500` counter |

**Field naming note:** the previous payload used `providerEmail`. The v2 prompt
specifies `email`. We rename to `email` on the form side. The CRM endpoint
will need to accept the new shape — this is the expected workstream-1
mismatch flagged in the prompt (CRM-side update is a separate workstream;
form ships first per Thursday deadline).

## New submission payload shape

```ts
type ProviderFormSubmission = {
  email: string;                    // RFC-valid, validated against CRM allowlist (404 = unknown)
  acceptingClients: number;         // integer, 0..50
  specialConsiderations?: string;   // omitted if blank; ≤500 chars
  submittedAt: string;              // ISO 8601, generated client-side at submit
};
```

POSTed to `POST {VITE_CRM_API_URL}/api/provider-availability` (path unchanged
from v1) with `X-Provider-Form-Key` header (unchanged).

## Response handling — unchanged

Same five branches: `success` / `validation_error` / `not_found` / `auth_error` / `server_error` / `network_error`.
Field-error mapping in the form's `validation_error` handler updates to map only the three new fields.

## Confirmed interpretations (per prompt's "Decision rules")

1. **`acceptingClients = 0` is a valid submission.** The provider is saying "I'm full,
   pause assignments." Confirmation copy reads: "Got it — we'll pause new
   assignments to you for now."
2. **No backward-compatibility hacks.** The new payload omits `acceptingIndividual`,
   `acceptingCouples`, `acceptingFamily`, `availability` entirely. Stale empty
   fields would just add noise once the CRM endpoint is updated.
3. **Calendar drag component is deleted, not preserved as commented code.**
   Git history is the archive (initial commit `2c49958` has it intact for
   one-command revert).
4. **No layout reorder beyond what's natural.** Three Cards become two:
   "Who you are" (email) and "Your availability" (accepting + special considerations).
   Submit button + helper text below, unchanged.
5. **No new validation rules Lane didn't ask for.** Email format, integer 0..50,
   string ≤500. Nothing else.

## Open questions / things I'm explicitly NOT doing

- `acceptingClients` ceiling at 50: a sanity guard, not a Lane-specified rule.
  If 50 is wrong (too high / too low), surface for adjustment — the value is
  trivial to change.
- The form's `react-hook-form` + `@hookform/resolvers` deps are in
  `package.json` but currently unused (the form uses raw `useState` + Zod).
  Not touching deps in this PR.
- No CHANGELOG file currently exists; will add a note in the commit message
  rather than create the file. (The prompt mentions a CHANGELOG entry; I'll
  flag it as a follow-up if you want a real CHANGELOG.md.)
- Tag `v2.0-simplified-form` is a deploy-time action, not a code change —
  not creating it here.

## Test coverage

The deleted `availability.test.ts` was the only test file in the repo. The
v2 form has no transform logic worth unit-testing (it's plain field
collection). Manual end-to-end test against staging CRM is the verification
path, per the prompt's acceptance criteria.

## Acceptance test mapping

| # | Test | How verified |
|---|---|---|
| 1 | Form renders 3 inputs only | Visual check + grep for removed fields |
| 2 | Known email + 2 + text → CRM updates | Manual against staging |
| 3 | Unknown email → blocked, no CRM write | Manual (existing 404 path unchanged) |
| 4 | `acceptingClients = 0` → succeeds | Manual + Zod schema allows it |
| 5 | Mobile 375px renders cleanly | DevTools responsive mode |
| 6 | 500-char cap on textarea with counter | Visual; client-side enforced |
| 7 | No console errors, a11y not regressed | DevTools + Lighthouse |
