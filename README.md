# TFC Provider Availability Form

Standalone Vite + React + TypeScript form that lets TFC providers self-report
how many new clients they're accepting and their preferred scheduling windows.
The form POSTs to the CRM endpoint at
`POST https://tfc-crm-2-0.fly.dev/api/provider-availability` with a shared
secret in the `X-Provider-Form-Key` header.

This app has one feature: the form. It has no portal, no dashboard, no
auth flow. The provider's email address is the identity; the CRM 404s on
unknown emails.

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS, theme variables matched to the TFC CRM
- shadcn/ui-style components (button, input, label, card, alert) hand-rolled into `src/components/ui/`
- Zod for client-side validation
- Custom drag-on-grid availability picker — see [src/components/AvailabilityGrid.tsx](src/components/AvailabilityGrid.tsx)

## Local development

```bash
# 1. Install deps
npm install

# 2. Configure env
cp .env.example .env.local
#   then edit .env.local and set:
#     VITE_CRM_API_URL=https://tfc-crm-2-0.fly.dev
#     VITE_PROVIDER_FORM_API_KEY=<shared-secret>

# 3. Run dev server
npm run dev
# → http://localhost:5173

# 4. Typecheck / build / test
npm run check
npm run build
npm test
```

> **Note on env vars:** `VITE_*` vars are inlined into the bundle at build
> time. The shared API key ships to the client. That's fine — it's a
> low-trust gate (any provider could read it from devtools), and the CRM
> still validates the email against `PROVIDER_LIST` before writing.

## Endpoint contract

```ts
POST /api/provider-availability
Headers:
  Content-Type: application/json
  X-Provider-Form-Key: <shared-secret>
Body:
  {
    providerEmail: string,            // valid email
    acceptingIndividual: number,      // integer >= 0
    acceptingCouples:    number,      // integer >= 0
    acceptingFamily:     number,      // integer >= 0
    availability: {                   // or null
      mon: { start: "HH:MM", end: "HH:MM" }[],
      tue: ..., wed: ..., thu: ..., fri: ...,
    } | null,
  }
```

Responses:
- `200` — `{ success, providerEmail, providerName, submittedAt }`
- `400` — `{ error: "validation_error", issues: ZodIssue[] }`
- `401` — auth failure (form treats as "Something went wrong")
- `404` — `{ error: "provider_not_found", email }` (unknown email)
- `500` — `{ error: "internal_error" }`

The form maps each case to user-facing copy in [src/components/ProviderForm.tsx](src/components/ProviderForm.tsx).

## Deploy to Fly.io

The app is configured to deploy as a separate Fly app (suggested name:
`tfc-provider-form`). The Dockerfile is a two-stage build: Vite build →
nginx static serve on port 8080. `fly.toml` already has `internal_port =
8080`, `force_https = true`, and `auto_stop_machines = "stop"` for cost.

```bash
# First-time setup
fly launch --no-deploy --copy-config --name tfc-provider-form
# (skip the auto-detected toml prompts — fly.toml in this repo is correct)

# Deploy. Build args ARE the way to inject Vite env at build time:
fly deploy \
  --build-arg VITE_CRM_API_URL=https://tfc-crm-2-0.fly.dev \
  --build-arg VITE_PROVIDER_FORM_API_KEY=<shared-secret>
```

For subsequent deploys, you can keep the build args in a script or in
your CI env. They are baked into the bundle each build, not stored as
Fly secrets — there are no runtime env vars (it's a static SPA).

## What's intentionally not built

- No saved drafts / `localStorage` — single-shot submission by design.
- No "show me my previous submission" — listed as v2 nice-to-have.
- No magic links or tokens — email is the identity.
- No analytics or tracking scripts.
- No mobile-first design — it doesn't break on phones, but the grid
  is laid out for laptops.

## Tests

```bash
npm test
```

The availability transform (selection → `AvailabilityWeek`) has unit
tests in [src/lib/availability.test.ts](src/lib/availability.test.ts).
That's the highest-risk piece — off-by-one in the contiguous-block
grouping would silently send wrong data to the CRM.
